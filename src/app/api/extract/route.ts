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
          const headerRow = rows.find(r => 
            r.nodes.some(n => n.text.toLowerCase().includes('course code')) &&
            r.nodes.some(n => n.text.toLowerCase().includes('time'))
          );

          if (!headerRow) {
            throw new Error("This document does not contain a schedule, please upload a valid pdf file");
          }

          const getX = (synonyms: string[]) => {
            const node = headerRow.nodes.find(n => synonyms.some(syn => n.text.toLowerCase().includes(syn)));
            return node ? node.x : null;
          };

          const anchors = {
            code: getX(['course code', 'subject']),
            title: getX(['description', 'title']),
            day: getX(['day']),
            time: getX(['time']),
            room: getX(['room']),
            sec: getX(['section']) || 100 // Fallback far right
          };

          if (anchors.code === null || anchors.title === null || anchors.day === null || anchors.time === null || anchors.room === null) {
            throw new Error("This document does not contain a schedule, please upload a valid pdf file");
          }

          const BOUNDS = {
            code:  { min: 0, max: (anchors.code + anchors.title) / 2 },
            title: { min: (anchors.code + anchors.title) / 2, max: (anchors.title + anchors.day) / 2 },
            day:   { min: (anchors.title + anchors.day) / 2, max: (anchors.day + anchors.time) / 2 },
            time:  { min: (anchors.day + anchors.time) / 2, max: (anchors.time + anchors.room) / 2 },
            room:  { min: (anchors.time + anchors.room) / 2, max: (anchors.room + anchors.sec) / 2 },
          };

          const extractedEntries: any[] = [];
          let currentEntry: any = null;

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

            // A row is a "Main Row" if it has a valid course code format (e.g. CSP110)
            const isMainRow = courseCode && /^[A-Z0-9]+$/i.test(courseCode.replace(/\s/g, ''));

            if (isMainRow) {
               currentEntry = {
                 course_code: courseCode || null,
                 course_title: courseTitle || null,
                 days_raw: day || null,
                 times_raw: timeRaw ? [timeRaw] : [],
                 rooms_raw: room ? [room] : [],
               };
               extractedEntries.push(currentEntry);
            } else if (currentEntry && (courseTitle || timeRaw || room)) {
               // This is a Continuation Row (e.g. wrapped times or rooms)
               if (courseTitle) currentEntry.course_title += ' ' + courseTitle;
               if (day) currentEntry.days_raw += ' ' + day;
               
               if (timeRaw) {
                 if (currentEntry.times_raw.length > 0) {
                   currentEntry.times_raw[0] += ' ' + timeRaw; // append so frontend can split by /
                 } else {
                   currentEntry.times_raw.push(timeRaw);
                 }
               }
               
               if (room) {
                 if (currentEntry.rooms_raw.length > 0) {
                   currentEntry.rooms_raw[0] += ' ' + room; // append so frontend can split by /
                 } else {
                   currentEntry.rooms_raw.push(room);
                 }
               }
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
