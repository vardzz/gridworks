// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

/**
 * Extracts text content from a PDF file using pdf.js.
 * Dynamically imports pdfjs-dist to avoid DOMMatrix reference during SSR.
 * Loops through every page and concatenates all text items.
 *
 * @param {File} file — a PDF File object from the drop zone or file picker
 * @returns {Promise<string>} — the raw concatenated text
 */
export async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");

  // Point to the pre-copied worker in public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group and sort items by Y coordinate (descending) then X coordinate (ascending)
    const items = textContent.items;
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      // Use 3px tolerance for items on the same baseline
      if (Math.abs(yA - yB) > 3) {
        return yB - yA;
      }
      return a.transform[4] - b.transform[4];
    });

    // Group into physical rows based on Y coordinate
    const rows = [];
    let currentRow = [];
    let lastY = null;

    for (const item of sortedItems) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        rows.push(currentRow);
        currentRow = [];
      }
      currentRow.push({
        x: item.transform[4],
        y: y,
        str: item.str.trim()
      });
      lastY = y;
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Merge continuation rows into their parent row based on X coordinate
    const mergedRows = [];
    let baseRow = null;

    for (const row of rows) {
      const validItems = row.filter((i) => i.str !== "");
      if (validItems.length === 0) continue;

      const firstStr = validItems[0].str;
      // Detect new schedule entry (has subject code OR has many columns)
      const isNewEntry =
        /\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/.test(firstStr) || validItems.length > 4;

      if (isNewEntry || !baseRow) {
        baseRow = validItems;
        mergedRows.push(baseRow);
      } else {
        // Continuation row: find the closest X in baseRow and append it
        for (const item of validItems) {
          let closestMatch = null;
          let minDiff = Infinity;
          for (const baseItem of baseRow) {
            const diff = Math.abs(baseItem.x - item.x);
            if (diff < minDiff) {
              minDiff = diff;
              closestMatch = baseItem;
            }
          }
          // If within 80px, it's definitely the same column
          if (closestMatch && minDiff < 80) {
            closestMatch.str += " " + item.str;
          } else {
            baseRow.push(item);
          }
        }
      }
    }

    // Reconstruct page text from merged rows
    let pageText = "";
    for (const row of mergedRows) {
      row.sort((a, b) => a.x - b.x);
      pageText += row.map((i) => i.str).join(" ") + "\n";
    }

    fullText += pageText + "\n";
  }

  return fullText;
}

