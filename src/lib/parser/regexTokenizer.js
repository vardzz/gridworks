// src/lib/parser/regexTokenizer.js — Structured Data Tokenizer

const TRIGGER_WORDS = [
  "course code", "course description", "subject code",
  "day", "time", "room"
];

// Layer 1: Header Synonym Expansion
const TARGET_MATCH = {
  course_code: [
    "course code", "code", "subject code", "subj code", "subj. code",
    "subject no", "subj no", "subj. no.", "no.", "katalogo"
  ],
  course_title: [
    "course description", "description", "subject", "title",
    "course title", "subject title", "subject description",
    "descriptive title", "pamagat"
  ],
  day: [
    "day", "days", "day/s", "araw", "schedule day", "sched"
  ],
  time: [
    "time", "time slot", "schedule", "class hours", "oras",
    "time schedule", "class time", "sched time"
  ],
  room: [
    "room", "room no", "room no.", "venue", "location",
    "silid", "classroom", "room/venue", "bldg/room"
  ]
};

const END_MARKERS = [
  "prepared by", "noted by", "approved", "checked by",
  "registrar", "dean", "total", "signature", "assessment of fees", "registered"
];

const HEADER_NOISE_PATTERNS = [
  /^units$/i,
  /^lec$/i,
  /^lab$/i,
  /^section$/i,
  /^no\.?$/i,
  /^hrs?\.?$/i
];

// Layer 2: Course Code Pattern Expansion
const COURSE_CODE_PATTERNS = [
  /^[A-Z]{2,5}\d{2,4}[A-Z]?$/,        // CSP109, TEC101, MATH11A
  /^[A-Z]{2,5}\s\d{2,4}[A-Z]?$/,      // CSP 109 (with space)
  /^[A-Z]{2,5}-\d{2,4}[A-Z]?$/,       // CSP-109 (with dash)
  /^[A-Z]{1,5}\d{1,4}[A-Z]{0,2}$/,    // CS101, IT1, GE1A
  /^[A-Z]{2,6}\d{2,4}$/,              // NSTP01, PATHFIT1
  /^\d{1,2}[A-Z]{2,5}\d{2,4}$/        // 1CSP109 (some systems prefix semester)
];

// Layer 4: Multi-Slot Detection Patterns
const MULTI_SLOT_SEPARATORS = [
  " / ",    // BCH 501 / COMLAB 3         (your current form)
  " & ",    // BCH 501 & COMLAB 3
  " and ",  // BCH 501 and COMLAB 3
  "\n",     // separate lines (handled by continuation row logic already)
  "; "      // BCH 501; COMLAB 3
];

function isHeaderNoiseString(firstCellText) {
  return HEADER_NOISE_PATTERNS.some(pattern => pattern.test(firstCellText));
}

function isValidCourseCode(str) {
  const s = str.trim();
  return COURSE_CODE_PATTERNS.some(pattern => pattern.test(s));
}

function readMultiValue(cellValue) {
  if (!cellValue) return [];

  for (const sep of MULTI_SLOT_SEPARATORS) {
    if (cellValue.includes(sep)) {
      return cellValue.split(sep).map(s => s.trim()).filter(Boolean);
    }
  }

  return [cellValue.trim()];
}

function isHeaderLine(line) {
  const lower = line.toLowerCase();
  const matches = TRIGGER_WORDS.filter(word => lower.includes(word));
  return matches.length >= 2;
}

function isFooterLine(line) {
  const lower = line.toLowerCase().trim();
  return END_MARKERS.some(marker => lower.startsWith(marker) || lower.includes(marker));
}

// Layer 0: Auto-Detect Delimiter
function detectDelimiter(headerLine) {
  if (headerLine.includes("\t")) return "TAB";
  if (/\s{3,}/.test(headerLine)) return "MULTI_SPACE_3";
  if (/\s{2,}/.test(headerLine)) return "MULTI_SPACE_2";
  return "SINGLE_SPACE";
}

function splitByDelimiter(line, delimiter) {
  switch (delimiter) {
    case "TAB":           return line.split("\t");
    case "MULTI_SPACE_3": return line.split(/\s{3,}/);
    case "MULTI_SPACE_2": return line.split(/\s{2,}/);
    case "SINGLE_SPACE":  return line.split(/\s+/);
  }
  return line.split(/\s{2,}/);
}

// Layer 5: Continuation Row Detection
function isContinuationRow(cells, firstCellText) {
  if (cells.course_code !== undefined && cells.course_code === "") {
    return true;
  }

  if (firstCellText === "") {
    return true;
  }

  if (!isValidCourseCode(firstCellText)) {
    const hasTimeOrRoom = (cells.time && cells.time !== "") || (cells.room && cells.room !== "");
    if (hasTimeOrRoom) {
      return true;
    }
  }

  return false;
}

// Layer 6: Fallback Header Detection
const REQUIRED_MINIMUM = ["course_code", "day", "time"];

function validateFieldBounds(fieldBounds) {
  const missing = REQUIRED_MINIMUM.filter(f => !fieldBounds[f]);
  if (missing.length > 0) {
    throw new Error("MISSING_REQUIRED_COLUMNS: " + missing.join(", "));
  }
}

// Layer 7: OCR Text Normalization
function normalizeOCRText(rawText, delimiter) {
  let text = rawText
    .replace(/\|/g, "I")          
    .replace(/0(?=[A-Z])/g, "O")  
    .replace(/(?<=[A-Z])0/g, "O") 
    .replace(/l(?=\d)/g, "1")     
    .replace(/(?<=\d)l/g, "1");   

  text = text.replace(/(\d:\d{2}\s*[aApP][mM])\s+(\d:\d{2})/g, "$1 - $2");

  if (delimiter === "MULTI_SPACE_2") {
    text = text.replace(/\s{3,}/g, "  ");
  }

  return text;
}

/**
 * Tokenizes raw text lines into raw entry objects.
 *
 * @param {Array<string>} rawLines
 * @param {boolean} isOCR
 * @returns {Array<Object>} — array of raw entry objects
 */
export function tokenize(rawLines, isOCR = false) {
  if (!rawLines || rawLines.length === 0) {
    return [];
  }

  // Step 2 — Find the Header Line
  let headerIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (isHeaderLine(rawLines[i])) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.warn("[tokenizer] No target table header found");
    return [];
  }

  const headerLine = rawLines[headerIndex];
  
  // Layer 0: Auto-Detect Delimiter
  const delimiter = detectDelimiter(headerLine);
  
  // Layer 7: Normalize OCR Lines
  if (isOCR) {
    rawLines = rawLines.map(line => normalizeOCRText(line, delimiter));
  }

  // Re-fetch header line after optional OCR normalization
  const normHeaderLine = rawLines[headerIndex];
  
  // Spatial Heuristic: Extract spatial coordinates of headers
  let lookahead = "\\s{2,}|\\t";
  if (delimiter === "SINGLE_SPACE") lookahead = "\\s+|\\t";
  
  const headers = [];
  const regex = new RegExp(`(\\S(?:.*?\\S)?)(?=${lookahead}|$)`, "g");
  let match;
  while ((match = regex.exec(normHeaderLine)) !== null) {
    headers.push({
      text: match[1],
      start: match.index,
      end: match.index + match[1].length
    });
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }

  // Define strict bounds for each column
  for (let i = 0; i < headers.length; i++) {
    const current = headers[i];
    const next = headers[i + 1];
    
    // Left-aligned column heuristic: a column starts roughly where its header starts,
    // and ends right before the next header starts. We add a small 2-character margin
    // to catch data that is slightly misaligned to the left.
    current.colStart = i === 0 ? 0 : current.start - 2;
    current.colEnd = next ? next.start - 2 : Infinity;
  }

  // Map spatial bounds to target fields
  const fieldBounds = {};
  for (const targetField of Object.keys(TARGET_MATCH)) {
    for (const header of headers) {
      const cellLower = header.text.toLowerCase().trim();
      if (!cellLower) continue;

      const isMatch = TARGET_MATCH[targetField].some(synonym => {
        if (cellLower === synonym) return true;
        if (cellLower.includes(synonym)) return true;
        if (cellLower.length >= 3 && synonym.includes(cellLower)) return true;
        return false;
      });

      if (isMatch) {
        fieldBounds[targetField] = header;
        break;
      }
    }
  }

  console.log("[tokenizer] Detected Delimiter:", delimiter);
  console.log("[tokenizer] Field Bounds:", Object.keys(fieldBounds).map(k => `${k}(${fieldBounds[k].colStart}-${fieldBounds[k].colEnd})`).join(", "));

  // Layer 6: Validate Minimum Fields
  try {
    validateFieldBounds(fieldBounds);
  } catch (err) {
    console.error("[tokenizer]", err.message);
    return [];
  }

  // Step 4 — Read Data Lines
  const dataLines = rawLines.slice(headerIndex + 1);
  const tableLines = [];
  for (const line of dataLines) {
    if (isFooterLine(line)) break;
    if (line.trim() !== "") {
      tableLines.push(line);
    }
  }

  // Steps 5-7 — Spatial Extraction + Detect + Accumulate
  const entries = [];
  
  for (const line of tableLines) {
    const firstCellText = headers[0] && line.length > headers[0].colStart 
      ? line.substring(headers[0].colStart, headers[0].colEnd).trim() 
      : "";

    if (isHeaderNoiseString(firstCellText)) continue;

    if (firstCellText !== "" && !isValidCourseCode(firstCellText)) {
      continue;
    }

    // Extract data using coordinates, NOT splits
    const cells = {};
    for (const targetField of Object.keys(fieldBounds)) {
      const bound = fieldBounds[targetField];
      let cellText = "";
      if (line.length > bound.colStart) {
        cellText = line.substring(bound.colStart, bound.colEnd).trim();
      }
      cells[targetField] = cellText;
    }

    const isContinuation = isContinuationRow(cells, firstCellText);

    if (!isContinuation) {
      const t = cells.time || "";
      const r = cells.room || "";
      
      const rawTimeValues = readMultiValue(t);
      const rawRoomValues = readMultiValue(r);

      const entry = {
        subject_code:  cells.course_code || "",
        subject_title: cells.course_title || "",
        days_raw:      cells.day || "",
        times_raw:     rawTimeValues,
        rooms_raw:     rawRoomValues
      };
      
      entries.push(entry);
    } else {
      if (entries.length === 0) continue;
      
      const lastEntry = entries[entries.length - 1];
      const t = cells.time || "";
      const r = cells.room || "";
      
      const rawTimeValues = readMultiValue(t);
      const rawRoomValues = readMultiValue(r);

      lastEntry.times_raw.push(...rawTimeValues);
      lastEntry.rooms_raw.push(...rawRoomValues);
    }
  }

  return entries;
}
