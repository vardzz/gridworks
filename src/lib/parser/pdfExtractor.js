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

    let pageText = "";
    let lastY = null;

    for (const item of sortedItems) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        pageText += "\n";
      } else if (pageText !== "" && !pageText.endsWith("\n")) {
        pageText += " ";
      }
      pageText += item.str;
      lastY = y;
    }

    fullText += pageText + "\n";
  }

  return fullText;
}

