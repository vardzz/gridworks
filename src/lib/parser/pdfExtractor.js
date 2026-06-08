// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

/**
 * Extracts text content from a PDF file using pdf.js.
 * Dynamically imports pdfjs-dist to avoid DOMMatrix reference during SSR.
 * Maps text items into a 2D structured column array using header X-coordinates.
 *
 * @param {File} file — a PDF File object from the drop zone or file picker
 * @returns {Promise<{ headers: string[], rows: Array<Object> }>} — the structured 2D output
 */
export async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");

  // Point to the pre-copied worker in public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let allItems = [];

  // Step 1 — Collect all text items across all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (item.str.trim() === "") continue;
      allItems.push({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5] + ((pdf.numPages - i) * 2000), // Offset by page to prevent Y overlap
        width: item.width,
      });
    }
  }

  // IMAGE_BASED_PDF guard
  const totalChars = allItems.reduce((sum, item) => sum + item.str.length, 0);
  if (totalChars < 50 && file.size > 100 * 1024) {
    const error = new Error("Image based PDF");
    error.code = "IMAGE_BASED_PDF";
    throw error;
  }

  if (allItems.length === 0) return { headers: [], rows: [] };

  // Step 2 — Group items into rows by y-coordinate (4 unit tolerance)
  allItems.sort((a, b) => b.y - a.y); // Descending Y (top to bottom)

  const rowsByY = [];
  let currentRow = [allItems[0]];

  for (let i = 1; i < allItems.length; i++) {
    const item = allItems[i];
    const meanY = currentRow.reduce((sum, it) => sum + it.y, 0) / currentRow.length;
    if (Math.abs(item.y - meanY) <= 4) {
      currentRow.push(item);
    } else {
      rowsByY.push(currentRow);
      currentRow = [item];
    }
  }
  if (currentRow.length > 0) rowsByY.push(currentRow);

  // Step 3 — Within each row, sort items by x-coordinate ascending (left to right)
  for (const row of rowsByY) {
    row.sort((a, b) => a.x - b.x);
  }

  // Step 4 — Detect column boundaries from the HEADER ROW
  let headerRowIdx = 0;
  for (let i = 0; i < rowsByY.length; i++) {
    const rowStr = rowsByY[i].map((it) => it.str).join(" ").toLowerCase();
    if (
      rowsByY[i].length >= 3 &&
      (rowStr.includes("course") ||
        rowStr.includes("code") ||
        rowStr.includes("subject") ||
        rowStr.includes("time"))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  const headerItems = rowsByY[headerRowIdx];
  if (!headerItems || headerItems.length === 0) return { headers: [], rows: [] };

  // Merge header items that are part of the same column label (e.g. "Course" and "Code")
  const mergedHeaders = [];
  let currentHeader = { ...headerItems[0] };

  for (let i = 1; i < headerItems.length; i++) {
    const item = headerItems[i];
    const gap = item.x - (currentHeader.x + (currentHeader.width || 0));
    
    // If words are very close (less than 8 units), they are part of the same header cell
    if (gap <= 8) {
      currentHeader.str += " " + item.str;
      currentHeader.width = (item.x + (item.width || 0)) - currentHeader.x;
    } else {
      mergedHeaders.push(currentHeader);
      currentHeader = { ...item };
    }
  }
  mergedHeaders.push(currentHeader);

  const columns = [];
  for (let i = 0; i < mergedHeaders.length; i++) {
    const item = mergedHeaders[i];
    const nextItem = mergedHeaders[i + 1];
    columns.push({
      label: item.str.trim(),
      xStart: item.x,
      xEnd: nextItem ? nextItem.x : Infinity,
    });
  }

  // Step 5 — For each data row, assign each text item to a column by its x-coordinate
  const structuredRows = [];

  for (let i = headerRowIdx + 1; i < rowsByY.length; i++) {
    const rowItems = rowsByY[i];
    const meanY = rowItems.reduce((sum, it) => sum + it.y, 0) / rowItems.length;
    const rowObj = { _y: meanY };
    for (const col of columns) rowObj[col.label] = "";

    for (const item of rowItems) {
      let assignedCol = null;

      // Primary check: xStart <= item.x < xEnd
      for (const col of columns) {
        if (item.x >= col.xStart && item.x < col.xEnd) {
          assignedCol = col;
          break;
        }
      }

      // Fallback: if item falls outside (e.g. before first column), snap to nearest center
      if (!assignedCol) {
        let minDiff = Infinity;
        for (const col of columns) {
          const center = col.xEnd === Infinity ? col.xStart + item.width : (col.xStart + col.xEnd) / 2;
          const diff = Math.abs(item.x - center);
          if (diff < minDiff) {
            minDiff = diff;
            assignedCol = col;
          }
        }
      }

      // Step 6 - append
      if (rowObj[assignedCol.label] === "") {
        rowObj[assignedCol.label] = item.str;
      } else {
        rowObj[assignedCol.label] += " " + item.str;
      }
    }

    if (Object.values(rowObj).some((val) => val !== "")) {
      structuredRows.push(rowObj);
    }
  }

  return {
    headers: columns.map((c) => c.label),
    rows: structuredRows,
  };
}
