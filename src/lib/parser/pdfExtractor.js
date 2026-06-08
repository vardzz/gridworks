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
  let globalHeaders = null;

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

    // Find headers to establish column X boundaries (only need to do this once)
    if (!globalHeaders) {
      for (const row of rows) {
        row.sort((a, b) => a.x - b.x);
        const validItems = row.filter(i => i.str !== "");
        const rowStr = validItems.map(i => i.str).join(" ").toLowerCase();
        
        if (validItems.length >= 3 && (rowStr.includes("course") || rowStr.includes("code") || rowStr.includes("subject") || rowStr.includes("time") || rowStr.includes("room"))) {
          globalHeaders = validItems;
          break;
        }
      }
    }

    // Reconstruct page text from rows, using header boundaries to prevent column shifting
    let pageText = "";
    if (globalHeaders) {
      for (const row of rows) {
        const validItems = row.filter((i) => i.str !== "");
        if (validItems.length === 0) continue;

        const columns = new Array(globalHeaders.length).fill("");

        for (const item of validItems) {
          // Snap item to the nearest column header using midpoint boundaries
          let closestIdx = 0;
          for (let j = 0; j < globalHeaders.length; j++) {
            const leftBound = j === 0 ? -Infinity : (globalHeaders[j-1].x + globalHeaders[j].x) / 2;
            const rightBound = j === globalHeaders.length - 1 ? Infinity : (globalHeaders[j].x + globalHeaders[j+1].x) / 2;
            
            if (item.x >= leftBound && item.x < rightBound) {
              closestIdx = j;
              break;
            }
          }
          
          if (columns[closestIdx] === "") {
            columns[closestIdx] = item.str;
          } else {
            columns[closestIdx] += " " + item.str;
          }
        }
        pageText += columns.join("\t") + "\n";
      }
    } else {
      // Fallback if no headers found on the entire document
      for (const row of rows) {
        row.sort((a, b) => a.x - b.x);
        const validItems = row.filter((i) => i.str !== "");
        if (validItems.length > 0) {
          pageText += validItems.map((i) => i.str).join("\t") + "\n";
        }
      }
    }

    fullText += pageText + "\n";
  }

  return fullText;
}
