import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = Buffer.from(await file.arrayBuffer());

    return new Promise<NextResponse>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          if (!pdfData.Pages || !pdfData.Pages[0] || !pdfData.Pages[0].Texts) {
             throw new Error("Invalid PDF or no text found on page 1");
          }

          const texts = pdfData.Pages[0].Texts;
          
          // 1. Decode and normalize all text nodes
          const normalizedNodes = texts.map((node: any) => ({
            text: decodeURIComponent(node.R[0].T).trim(),
            x: node.x,
            y: node.y
          })).filter((n: any) => n.text !== '');

          // 2. Y-Axis Grouping (Rows) with 0.5 tolerance
          const rows: { y: number, nodes: any[] }[] = [];
          normalizedNodes.forEach((node: any) => {
            let matchedRow = rows.find(r => Math.abs(r.y - node.y) <= 0.5);
            if (matchedRow) {
              matchedRow.nodes.push(node);
            } else {
              rows.push({ y: node.y, nodes: [node] });
            }
          });

          // Sort rows top to bottom
          rows.sort((a, b) => a.y - b.y);

          // 3. X-Axis Grouping (Columns)
          // Dynamically detect column bounds based on header locations to ensure 100% accuracy
          let BOUNDS = {
            code:  { min: 0,  max: 6 },
            title: { min: 6,  max: 18 },
            day:   { min: 22, max: 28 },
            time:  { min: 28, max: 36 },
            room:  { min: 36, max: 45 },
          };

          const headerRow = rows.find(r => 
            r.nodes.some(n => n.text.toLowerCase().includes('course code') || n.text.toLowerCase().includes('time'))
          );

          if (headerRow) {
            const getX = (keyword: string) => {
              const node = headerRow.nodes.find(n => n.text.toLowerCase().includes(keyword));
              return node ? node.x : null;
            };

            const codeX = getX('code') ?? 0;
            const descX = getX('description') ?? 6;
            const dayX = getX('day') ?? 22;
            const timeX = getX('time') ?? 28;
            const roomX = getX('room') ?? 36;

            BOUNDS = {
              code:  { min: codeX - 1, max: descX - 0.5 },
              title: { min: descX - 0.5, max: dayX - 2 }, // Ignore intermediate units
              day:   { min: dayX - 1, max: timeX - 0.5 },
              time:  { min: timeX - 1, max: roomX - 0.5 },
              room:  { min: roomX - 1, max: roomX + 15 },
            };
          }

          const extractedEntries: any[] = [];

          rows.forEach(row => {
            // Helper to extract text strictly within an X-boundary
            const getTextInBounds = (min: number, max: number) => {
              const nodesInBounds = row.nodes.filter(n => n.x >= min && n.x < max);
              // Sort left-to-right before joining to preserve intra-cell order
              nodesInBounds.sort((a, b) => a.x - b.x);
              return nodesInBounds.map(n => n.text).join(' ').trim();
            };

            const courseCode = getTextInBounds(BOUNDS.code.min, BOUNDS.code.max);
            const courseTitle = getTextInBounds(BOUNDS.title.min, BOUNDS.title.max);
            const day = getTextInBounds(BOUNDS.day.min, BOUNDS.day.max);
            const timeRaw = getTextInBounds(BOUNDS.time.min, BOUNDS.time.max);
            const room = getTextInBounds(BOUNDS.room.min, BOUNDS.room.max);

            // Filter out empty noise rows
            if (courseCode || courseTitle || timeRaw) {
               extractedEntries.push({
                 course_code: courseCode || null,
                 course_title: courseTitle || null,
                 days_raw: day || null,
                 times_raw: timeRaw ? [timeRaw] : [],
                 rooms_raw: room ? [room] : [],
               });
            }
          });

          resolve(NextResponse.json({ success: true, data: extractedEntries }));
        } catch (error: any) {
          resolve(NextResponse.json({ success: false, error: error.message }, { status: 500 }));
        }
      });

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        resolve(NextResponse.json({ success: false, error: errData?.parserError?.message || errData.message || "Unknown PDF parsing error" }, { status: 500 }));
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
