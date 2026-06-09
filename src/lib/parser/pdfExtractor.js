// src/lib/parser/pdfExtractor.js
//
// WHAT CHANGED FROM PREVIOUS VERSION AND WHY:
//
// REMOVED: leadingSpaces = Math.round(currentItem.x / 4.5)
//   Problem: PDF x-coordinates are in points (1pt = 1/72 inch). A column
//   starting at x=36 produced 8 leading spaces. This made the tokenizer
//   think column 0 started 8 characters in, breaking all index mapping.
//
// REMOVED: spaces = Math.max(2, Math.round(gap / 4.5))
//   Problem: Word gaps inside cells (3-5pt) and column gaps between cells
//   (8-15pt) both rounded to 1-2 spaces. The tokenizer could not tell a
//   column boundary from a space inside "Software Engineering 1".
//
// ADDED: TAB character (\t) between items whose gap exceeds TAB_THRESHOLD
//   A tab is an unambiguous column delimiter. Text inside cells never
//   contains tabs. The tokenizer splits on \t with zero ambiguity.
//
// ADDED: Diagnostic console.log output so you can see exactly what
//   the extractor produces before the tokenizer touches it.

/**
 * Extracts raw text lines from a PDF file using pdf.js.
 *
 * @param {File} file — a PDF File object
 * @returns {Promise<string[]>} — array of text lines, columns separated by \t
 */
export async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // TAB_THRESHOLD: gap in PDF points that means "new column, not new word"
  // Words inside a cell are typically 2-6pt apart.
  // Columns are typically 8-40pt apart depending on the form.
  // 8pt is the safe boundary — anything wider than 8pt gets a \t.
  const TAB_THRESHOLD = 8;
  const ROW_TOLERANCE = 4;

  let allLines = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Filter out whitespace-only items
    const items = textContent.items.filter(item => item.str.trim() !== "");
    items.forEach(item => (totalChars += item.str.length));

    // ── Step 1: Cluster items into rows by y-coordinate ──────────────────
    const rows = [];

    for (const item of items) {
      const y = item.transform[5];
      const x = item.transform[4];
      const width = item.width || 0;

      let matched = false;
      for (const row of rows) {
        if (Math.abs(y - row.mean_y) <= ROW_TOLERANCE) {
          // Running mean: update mean_y as items are added
          const n = row.items.length;
          row.mean_y = (row.mean_y * n + y) / (n + 1);
          row.items.push({ str: item.str, x, width });
          matched = true;
          break;
        }
      }

      if (!matched) {
        rows.push({
          items: [{ str: item.str, x, width }],
          mean_y: y,
        });
      }
    }

    // ── Step 2: Sort rows top-to-bottom (y descending in pdf.js coords) ──
    rows.sort((a, b) => b.mean_y - a.mean_y);

    // ── Step 3: Build line strings using \t as column delimiter ──────────
    for (const row of rows) {
      // Sort items left-to-right within each row
      row.items.sort((a, b) => a.x - b.x);

      let lineText = "";

      for (let j = 0; j < row.items.length; j++) {
        const current = row.items[j];

        if (j === 0) {
          // First item: no leading padding, just the text
          lineText += current.str;
        } else {
          const prev = row.items[j - 1];
          // Gap = distance from end of previous item to start of current item
          const gap = current.x - (prev.x + prev.width);

          if (gap > TAB_THRESHOLD) {
            // Large gap = column boundary → use TAB
            lineText += "\t" + current.str;
          } else {
            // Small gap = space within the same word/phrase → use single space
            lineText += " " + current.str;
          }
        }
      }

      if (lineText.trim() !== "") {
        allLines.push(lineText);
      }
    }
  }

  // ── IMAGE_BASED_PDF guard ─────────────────────────────────────────────
  if (totalChars < 50 && file.size > 100 * 1024) {
    const error = new Error("Image based PDF");
    error.code = "IMAGE_BASED_PDF";
    throw error;
  }

  // ── Diagnostic output — READ THIS IN YOUR CONSOLE ─────────────────────
  // This shows you EXACTLY what the tokenizer will receive.
  // Each line should look like:
  //   "CSP109\tSoftware Engineering 1\t2\t0\tM / Th\t1:00pm - 3:00pm\tBCH 501 / COMLAB 3\t3CS-A"
  // If you see lines with NO tabs, TAB_THRESHOLD needs to be lower.
  // If you see lines split at wrong points, TAB_THRESHOLD needs to be higher.
  console.log("[pdfExtractor] Total lines extracted:", allLines.length);
  console.log("[pdfExtractor] First 20 lines (\\t shown as → ):");
  allLines.slice(0, 20).forEach((line, i) => {
    console.log(`  [${i}] ${line.replace(/\t/g, " → ")}`);
  });

  return allLines.filter(line => line.trim() !== "");
}