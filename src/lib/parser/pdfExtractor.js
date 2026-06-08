// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

/**
 * Extracts raw text lines from a PDF file using pdf.js.
 * Sorts items top-to-bottom, left-to-right, and clusters rows into string lines.
 *
 * @param {File} file — a PDF File object from the drop zone or file picker
 * @returns {Promise<string[]>} — array of text lines
 */

export async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");

  // Point to the pre-copied worker in public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let allLines = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const items = textContent.items.filter(item => item.str.trim() !== "");
    
    // IMAGE_BASED_PDF guard
    items.forEach(item => totalChars += item.str.length);

    // Step 1: Group by Y (rows)
    const rows = [];
    const ROW_TOLERANCE = 4;
    for (const item of items) {
      const y = item.transform[5];
      const x = item.transform[4];
      const width = item.width || 0;
      
      let matched = false;
      for (const r of rows) {
        if (Math.abs(y - r.mean_y) <= ROW_TOLERANCE) {
          r.items.push({ str: item.str, x, width });
          r.mean_y = (r.mean_y * r.items.length + y) / (r.items.length + 1);
          matched = true;
          break;
        }
      }
      if (!matched) {
        rows.push({ items: [{ str: item.str, x, width }], mean_y: y });
      }
    }

    // Sort rows top to bottom
    rows.sort((a, b) => b.mean_y - a.mean_y);

    // Sort items within rows left to right, and join to form line strings
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      
      let lineText = "";
      if (row.items.length > 0) {
        let currentItem = row.items[0];
        lineText += currentItem.str;
        
        for (let j = 1; j < row.items.length; j++) {
          const item = row.items[j];
          const gap = item.x - (currentItem.x + currentItem.width);
          
          if (gap > 12) {
            lineText += "  "; // 2 spaces to separate columns
          } else {
            lineText += " ";  // 1 space to separate words
          }
          lineText += item.str;
          currentItem = item;
        }
      }
      allLines.push(lineText);
    }
  }

  if (totalChars < 50 && file.size > 100 * 1024) {
    const error = new Error("Image based PDF");
    error.code = "IMAGE_BASED_PDF";
    throw error;
  }

  // Filter out completely empty lines
  return allLines.filter(line => line.trim() !== "");
}

