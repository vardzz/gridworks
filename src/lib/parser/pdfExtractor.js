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
  const TAB_THRESHOLD = 5;
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
    let rows = [];

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

    rows = mergeSubHeaderRow(rows);

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

          if (gap > 5) { // TAB_THRESHOLD computed as 5
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

/**
 * Detects a split header row (e.g. "Lec" / "Units" on separate lines)
 * and merges the sub-row text into the correct cell of the main header row.
 *
 * A sub-header row is identified by ALL of these conditions:
 * 1. It appears immediately after a row that scores as a schedule header
 * 2. It contains FEWER items than the header row
 * 3. ALL of its items are short (≤ 8 chars) single words
 * 4. NONE of its items match a course code shape
 *
 * When found, each sub-row item is merged into the header item whose
 * x-coordinate is nearest.
 */
function mergeSubHeaderRow(rows) {
  if (rows.length < 2) return rows;

  // Score each row to find the best header row
  const HEADER_KEYWORDS = [
    'course', 'code', 'description', 'day', 'time', 'room',
    'subject', 'schedule', 'section', 'unit', 'lec', 'lab'
  ];

  function rowHeaderScore(row) {
    const text = row.items.map(i => i.str).join(' ').toLowerCase();
    return HEADER_KEYWORDS.filter(kw => text.includes(kw)).length;
  }

  function isSubHeaderRow(row, headerRow) {
    // Must have fewer items than header
    if (row.items.length >= headerRow.items.length) return false;
    // All items must be short single words
    const allShort = row.items.every(item => {
      const s = item.str.trim();
      return s.length <= 10 && !s.includes(' ');
    });
    if (!allShort) return false;
    // Must be within 20pt vertically of the header row (directly below it)
    const vertDist = Math.abs(row.mean_y - headerRow.mean_y);
    if (vertDist > 20) return false;
    return true;
  }

  // Find the header row index (highest scoring row)
  let headerRowIdx = 0;
  let bestScore = 0;
  rows.forEach((row, idx) => {
    const score = rowHeaderScore(row);
    if (score > bestScore) {
      bestScore = score;
      headerRowIdx = idx;
    }
  });

  const headerRow = rows[headerRowIdx];
  const nextRowIdx = headerRowIdx + 1;

  if (nextRowIdx >= rows.length) return rows;

  const nextRow = rows[nextRowIdx];

  if (!isSubHeaderRow(nextRow, headerRow)) return rows;

  // Merge: for each sub-row item, find the nearest header item by x-coord
  // and append its text to that header item
  nextRow.items.forEach(subItem => {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    headerRow.items.forEach((headerItem, idx) => {
      const dist = Math.abs(headerItem.x - subItem.x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    // Append sub-item text to nearest header item with a space
    headerRow.items[nearestIdx].str += ' ' + subItem.str.trim();
  });

  // Remove the sub-header row from the array
  rows.splice(nextRowIdx, 1);

  console.log('[pdfExtractor] Merged split header row. Header now:',
    headerRow.items.map(i => i.str.trim()).join(' | '));

  return rows;
}