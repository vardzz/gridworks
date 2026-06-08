// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

/**
 * Extracts text content from a PDF file using pdf.js.
 * Dynamically imports pdfjs-dist to avoid DOMMatrix reference during SSR.
 * Grouped items by y-coordinate into tab-separated lines for table parsing.
 *
 * @param {File} file — a PDF File object from the drop zone or file picker
 * @returns {Promise<string>} — the raw concatenated text, structured by lines and tabs
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
        return yB - yA; // Sort top to bottom (Y descending)
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

    // Reconstruct page text from rows
    let pageText = "";
    for (const row of rows) {
      // Ensure strictly sorted by X within the tolerant Y bucket
      row.sort((a, b) => a.x - b.x);
      const validItems = row.filter((i) => i.str !== "");
      if (validItems.length > 0) {
        pageText += validItems.map((i) => i.str).join("\t") + "\n";
      }
    }

    fullText += pageText + "\n";
  }

  return fullText;
}
