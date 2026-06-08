// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

const ROW_TOLERANCE = 4;

const TARGET_HEADER_SYNONYMS = [
  ["course code", "code", "subject code", "subj code", "subj. code"],
  ["course description", "description", "subject", "title", "course title"],
  ["day", "days", "day/s"],
  ["time", "time slot", "schedule", "class hours"],
  ["room", "room no", "room no.", "venue"]
];

const END_MARKERS = [
  "prepared by", "noted by", "approved by", "signature",
  "dean", "registrar", "total units", "checked by",
  "total number of units", "assessment of fees", "registered"
];

function isTargetHeaderRow(row) {
  // Concatenate ALL item strings in the row into one searchable string.
  // This is critical because pdf.js splits "Course Code" into two separate
  // text items "Course" and "Code". Checking individual items against
  // "course code" would never match.
  const rowText = row.items.map(it => it.str.toLowerCase().trim()).join(" ");
  
  let matchCount = 0;
  for (const synonymGroup of TARGET_HEADER_SYNONYMS) {
    for (const synonym of synonymGroup) {
      if (rowText.includes(synonym)) {
        matchCount++;
        break; // count each group at most once
      }
    }
  }
  return matchCount >= 3;
}

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

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (item.str.trim() === "") continue;
      allItems.push({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5] + (pdf.numPages - i) * 10000,
        width: item.width || 0,
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

  // Step 1 — Row Clustering
  const rows = [];
  for (const item of allItems) {
    let matched = false;
    for (const r of rows) {
      if (Math.abs(item.y - r.mean_y) <= ROW_TOLERANCE) {
        r.items.push(item);
        r.mean_y = r.items.reduce((s, it) => s + it.y, 0) / r.items.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      rows.push({ items: [item], mean_y: item.y });
    }
  }

  rows.sort((a, b) => b.mean_y - a.mean_y); // top to bottom

  for (const r of rows) {
    r.items.sort((a, b) => a.x - b.x); // left to right
  }

  // Step 1.5 — Target Table Detection
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (isTargetHeaderRow(rows[i])) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("No target table header found");
    return { headers: [], rows: [] };
  }

  // Edge Case — Split Headers
  // Check if the next row contains small orphaned headers (e.g. "Units")
  if (headerRowIndex + 1 < rows.length) {
    const nextRow = rows[headerRowIndex + 1];
    const isFragmentRow = nextRow.items.length <= 4 && nextRow.items.every(it => !it.str.includes(" "));
    if (isFragmentRow) {
      rows[headerRowIndex].items.push(...nextRow.items);
      rows[headerRowIndex].items.sort((a, b) => a.x - b.x);
      rows.splice(headerRowIndex + 1, 1);
    }
  }

  const headerRow = rows[headerRowIndex];
  
  const TABLE_X_LEFT = Math.min(...headerRow.items.map(i => i.x));
  const TABLE_X_RIGHT = Math.max(...headerRow.items.map(i => i.x + i.width));

  let tableRows = rows.slice(headerRowIndex);

  const xLeft = TABLE_X_LEFT - 5;
  const xRight = TABLE_X_RIGHT + 5;

  tableRows = tableRows.filter(row =>
    row.items.some(item => item.x >= xLeft && item.x <= xRight)
  );

  for (let i = 1; i < tableRows.length; i++) {
    const rowText = tableRows[i].items.map(it => it.str.toLowerCase()).join(" ");
    if (END_MARKERS.some(marker => rowText.includes(marker))) {
      tableRows = tableRows.slice(0, i);
      break;
    }
  }

  // Step 2 — Column Partitioning
  // Merge close items in header row to prevent "Course Code" becoming two columns
  const hItems = [];
  if (tableRows[0].items.length > 0) {
    let currentHeader = { ...tableRows[0].items[0] };
    for (let j = 1; j < tableRows[0].items.length; j++) {
      const item = tableRows[0].items[j];
      const gap = item.x - (currentHeader.x + currentHeader.width);
      if (gap < 25) { // 25px is a safe threshold for a space between words
        currentHeader.str += " " + item.str;
        currentHeader.width = (item.x + item.width) - currentHeader.x;
      } else {
        hItems.push(currentHeader);
        currentHeader = { ...item };
      }
    }
    hItems.push(currentHeader);
  }

  const columns = [];
  for (let j = 0; j < hItems.length; j++) {
    columns.push({
      label: hItems[j].str,
      xStart: hItems[j].x,
      xEnd: (j < hItems.length - 1) ? hItems[j+1].x : Infinity
    });
  }

  function assignColumn(x) {
    for (const col of columns) {
      if (x >= col.xStart && x < col.xEnd) return col.label;
    }
    // Boundary fallback
    let nearest = columns[0];
    let minDiff = Infinity;
    for (const col of columns) {
      const center = col.xEnd === Infinity ? col.xStart + 30 : (col.xStart + col.xEnd) / 2;
      const diff = Math.abs(center - x);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = col;
      }
    }
    return nearest.label;
  }

  // Step 3 — Cell Assignment
  const matrix = [];
  for (let r = 1; r < tableRows.length; r++) {
    const row = tableRows[r];
    const cell = {};
    for (const col of columns) {
      cell[col.label] = "";
    }
    
    // Only process items within table x boundaries
    const validItems = row.items.filter(i => i.x >= xLeft && i.x <= xRight);
    
    for (const item of validItems) {
      const colLabel = assignColumn(item.x);
      cell[colLabel] += item.str + " ";
    }
    
    for (const col of columns) {
      cell[col.label] = cell[col.label].trim();
    }
    
    matrix.push(cell);
  }

  return { headers: columns.map(c => c.label), rows: matrix };
}
