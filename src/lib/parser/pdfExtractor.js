// src/lib/parser/pdfExtractor.js — pdf.js vector text extraction

/**
 * Extracts text content from a PDF file using pdf.js.
 * Dynamically imports pdfjs-dist to avoid DOMMatrix reference during SSR.
 * Maps text items into a 2D structured column array using header X-coordinates.
 *
 * Handles multi-line column headers (e.g. "Course" on line 1, "Code" on line 2).
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

  // ── Step 1: Collect ALL text items across all pages ──────────────
  let allItems = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (item.str.trim() === "") continue;
      allItems.push({
        str: item.str.trim(),
        x: item.transform[4],
        // Offset Y per page so multi-page docs don't overlap
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

  // ── Step 2: Group items into rows by y-coordinate ───────────────
  allItems.sort((a, b) => b.y - a.y); // Descending Y = top of page first

  const rowBuckets = [];
  let bucket = [allItems[0]];

  for (let i = 1; i < allItems.length; i++) {
    const item = allItems[i];
    const meanY = bucket.reduce((s, it) => s + it.y, 0) / bucket.length;
    if (Math.abs(item.y - meanY) <= 4) {
      bucket.push(item);
    } else {
      rowBuckets.push(bucket);
      bucket = [item];
    }
  }
  if (bucket.length > 0) rowBuckets.push(bucket);

  // ── Step 3: Sort each row left-to-right ─────────────────────────
  for (const row of rowBuckets) {
    row.sort((a, b) => a.x - b.x);
  }

  console.log("[pdfExtractor] Total rows found:", rowBuckets.length);

  // ── Step 4: Find HEADER rows (may span 1–2 physical rows) ──────
  const HEADER_KEYWORDS = [
    "course", "code", "description", "subject", "title",
    "lec", "lab", "units", "day", "days", "time",
    "room", "section", "venue", "schedule",
  ];

  // Score every row by how many header keywords it contains
  const rowScores = rowBuckets.map((row) => {
    const text = row.map((it) => it.str).join(" ").toLowerCase();
    let score = 0;
    for (const kw of HEADER_KEYWORDS) {
      if (text.includes(kw)) score++;
    }
    return score;
  });

  // Find the row with the HIGHEST score
  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < rowScores.length; i++) {
    if (rowScores[i] > bestScore) {
      bestScore = rowScores[i];
      bestIdx = i;
    }
  }

  if (bestScore === 0) {
    console.warn("[pdfExtractor] No header row found");
    return { headers: [], rows: [] };
  }

  // Check adjacent rows — if they also score > 0, they are part of a multi-line header
  let headerStart = bestIdx;
  let headerEnd = bestIdx;

  if (bestIdx > 0 && rowScores[bestIdx - 1] > 0) {
    headerStart = bestIdx - 1;
  }
  if (bestIdx + 1 < rowBuckets.length && rowScores[bestIdx + 1] > 0) {
    headerEnd = bestIdx + 1;
  }

  console.log("[pdfExtractor] Header spans rows", headerStart, "to", headerEnd);
  for (let i = headerStart; i <= headerEnd; i++) {
    console.log(`  Row ${i}:`, rowBuckets[i].map((it) => `"${it.str}" @x=${Math.round(it.x)}`).join(", "));
  }

  // ── Merge all header-row items and group by X proximity ─────────
  let allHeaderItems = [];
  for (let i = headerStart; i <= headerEnd; i++) {
    allHeaderItems = allHeaderItems.concat(rowBuckets[i]);
  }
  allHeaderItems.sort((a, b) => a.x - b.x);

  // Group items whose X positions overlap or are very close (< 20 units gap)
  const xGroups = [];
  let currentGroup = [allHeaderItems[0]];

  for (let i = 1; i < allHeaderItems.length; i++) {
    const item = allHeaderItems[i];
    // Right edge of current group
    const groupRightEdge = Math.max(
      ...currentGroup.map((it) => it.x + it.width)
    );
    const gap = item.x - groupRightEdge;

    if (gap < 20) {
      // Same column header (overlapping or close)
      currentGroup.push(item);
    } else {
      xGroups.push(currentGroup);
      currentGroup = [item];
    }
  }
  xGroups.push(currentGroup);

  // Within each group, sort top-to-bottom (higher Y = higher on page = first)
  // then concatenate to form the full column label
  const mergedHeaders = xGroups.map((group) => {
    group.sort((a, b) => b.y - a.y); // top first
    return {
      label: group.map((it) => it.str).join(" ").trim(),
      x: Math.min(...group.map((it) => it.x)),
      width:
        Math.max(...group.map((it) => it.x + it.width)) -
        Math.min(...group.map((it) => it.x)),
    };
  });

  // Build column boundaries
  const columns = [];
  for (let i = 0; i < mergedHeaders.length; i++) {
    const h = mergedHeaders[i];
    const nextH = mergedHeaders[i + 1];
    columns.push({
      label: h.label,
      xStart: h.x,
      xEnd: nextH ? nextH.x : Infinity,
    });
  }

  console.log(
    "[pdfExtractor] Detected columns:",
    columns.map((c) => `"${c.label}" [${Math.round(c.xStart)}–${c.xEnd === Infinity ? "∞" : Math.round(c.xEnd)}]`).join(" | ")
  );

  // ── Step 5: Map every data row into the column grid ─────────────
  const structuredRows = [];
  const dataStartIdx = headerEnd + 1;

  for (let i = dataStartIdx; i < rowBuckets.length; i++) {
    const rowItems = rowBuckets[i];
    const meanY = rowItems.reduce((s, it) => s + it.y, 0) / rowItems.length;
    const rowObj = { _y: meanY };

    for (const col of columns) {
      rowObj[col.label] = "";
    }

    for (const item of rowItems) {
      let assignedCol = null;

      // Primary: find column where xStart <= item.x < xEnd
      for (const col of columns) {
        if (item.x >= col.xStart && item.x < col.xEnd) {
          assignedCol = col;
          break;
        }
      }

      // Fallback: snap to nearest column center
      if (!assignedCol) {
        let minDist = Infinity;
        for (const col of columns) {
          const center =
            col.xEnd === Infinity
              ? col.xStart + 30
              : (col.xStart + col.xEnd) / 2;
          const dist = Math.abs(item.x - center);
          if (dist < minDist) {
            minDist = dist;
            assignedCol = col;
          }
        }
      }

      if (assignedCol) {
        if (rowObj[assignedCol.label] === "") {
          rowObj[assignedCol.label] = item.str;
        } else {
          rowObj[assignedCol.label] += " " + item.str;
        }
      }
    }

    // Only keep rows that have at least one non-empty cell
    const hasContent = Object.entries(rowObj).some(
      ([k, v]) => k !== "_y" && v !== ""
    );
    if (hasContent) {
      structuredRows.push(rowObj);
    }
  }

  const headers = columns.map((c) => c.label);

  console.log("[pdfExtractor] Final headers:", headers);
  console.log("[pdfExtractor] Data rows:", structuredRows.length);
  if (structuredRows.length > 0) {
    console.log("[pdfExtractor] First data row:", JSON.stringify(structuredRows[0]));
    console.log("[pdfExtractor] Second data row:", JSON.stringify(structuredRows[1]));
  }

  // ── Step 6: Return structured object ────────────────────────────
  return { headers, rows: structuredRows };
}
