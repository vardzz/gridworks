// src/lib/parser/regexTokenizer.js — Structured Data Tokenizer

const TRIGGER_WORDS = [
  "course code", "course description", "subject code",
  "day", "time", "room"
];

const TARGET_MATCH = {
  course_code:   ["course code", "code", "subject code", "subj code", "subj. code"],
  course_title:  ["course description", "description", "subject", "title", "course title"],
  day:           ["day", "days", "day/s"],
  time:          ["time", "time slot", "schedule", "class hours"],
  room:          ["room", "room no", "room no.", "venue", "location"]
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

function isHeaderNoiseLine(cells) {
  const firstCell = cells[0].trim();
  return HEADER_NOISE_PATTERNS.some(pattern => pattern.test(firstCell));
}

function isValidCourseCode(str) {
  return /^[A-Z]{2,5}\d{2,4}[A-Z]?$/.test(str.trim());
}

function readMultiValue(cellValue) {
  if (!cellValue) return [];
  return cellValue.split(" / ").map(s => s.trim()).filter(Boolean);
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

function splitIntoCells(line) {
  // Use regex split by 2 or more spaces or a tab
  return line.split(/\t|\s{2,}/);
}

function isContinuationLine(cells) {
  return cells[0].trim() === "";
}

/**
 * Tokenizes raw text lines into raw entry objects.
 *
 * @param {Array<string>} rawLines
 * @returns {Array<Object>} — array of raw entry objects
 */
export function tokenize(rawLines) {
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
  const headerCells = splitIntoCells(headerLine);

  // Step 3 — Build the Column Index Map
  const fieldIndexMap = {};
  for (const targetField of Object.keys(TARGET_MATCH)) {
    for (let i = 0; i < headerCells.length; i++) {
      const cellLower = headerCells[i].toLowerCase().trim();
      if (TARGET_MATCH[targetField].some(synonym => cellLower === synonym || cellLower.includes(synonym) || synonym.includes(cellLower))) {
        fieldIndexMap[targetField] = i;
        break;
      }
    }
  }

  console.log("[tokenizer] Field Index Map:", JSON.stringify(fieldIndexMap));

  // Step 4 — Read Data Lines
  const dataLines = rawLines.slice(headerIndex + 1);
  const tableLines = [];
  for (const line of dataLines) {
    if (isFooterLine(line)) break;
    if (line.trim() !== "") {
      tableLines.push(line);
    }
  }

  // Steps 5-7 — Split + Detect + Accumulate
  const entries = [];
  
  for (const line of tableLines) {
    // If the line has leading spaces, the first cell will be empty or a space
    // Let's preserve leading spaces when splitting, or manually check
    const startsWithDoubleSpace = line.startsWith("  ") || line.startsWith("\t");
    const cells = splitIntoCells(line.trimStart());
    
    // If the line started with a double space, the first column is effectively empty
    if (startsWithDoubleSpace) {
      cells.unshift("");
    }

    if (isHeaderNoiseLine(cells)) continue;

    if (cells[0].trim() !== "" && !isValidCourseCode(cells[0])) {
      continue;
    }

    const isContinuation = isContinuationLine(cells);

    if (!isContinuation) {
      const t = (fieldIndexMap.time !== undefined && cells[fieldIndexMap.time]) ? cells[fieldIndexMap.time].trim() : "";
      const r = (fieldIndexMap.room !== undefined && cells[fieldIndexMap.room]) ? cells[fieldIndexMap.room].trim() : "";
      
      const rawTimeValues = readMultiValue(t);
      const rawRoomValues = readMultiValue(r);

      const entry = {
        subject_code:  (fieldIndexMap.course_code !== undefined && cells[fieldIndexMap.course_code]) ? cells[fieldIndexMap.course_code].trim() : "",
        subject_title: (fieldIndexMap.course_title !== undefined && cells[fieldIndexMap.course_title]) ? cells[fieldIndexMap.course_title].trim() : "",
        days_raw:      (fieldIndexMap.day !== undefined && cells[fieldIndexMap.day]) ? cells[fieldIndexMap.day].trim() : "",
        times_raw:     rawTimeValues,
        rooms_raw:     rawRoomValues
      };
      
      entries.push(entry);
    } else {
      if (entries.length === 0) continue;
      
      const lastEntry = entries[entries.length - 1];
      const t = (fieldIndexMap.time !== undefined && cells[fieldIndexMap.time]) ? cells[fieldIndexMap.time].trim() : "";
      const r = (fieldIndexMap.room !== undefined && cells[fieldIndexMap.room]) ? cells[fieldIndexMap.room].trim() : "";
      
      const rawTimeValues = readMultiValue(t);
      const rawRoomValues = readMultiValue(r);

      lastEntry.times_raw.push(...rawTimeValues);
      lastEntry.rooms_raw.push(...rawRoomValues);
    }
  }

  return entries;
}
