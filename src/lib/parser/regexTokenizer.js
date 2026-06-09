// src/lib/parser/regexTokenizer.js — Structured Data Tokenizer

const SCHEDULE_CONCEPTS = [
  // Code concept
  ["course code", "code", "subject code", "subj", "catalog", "subject no"],
  // Title concept
  ["description", "title", "subject", "course name", "descriptive title"],
  // Time concept
  ["time", "schedule", "hours", "oras"],
  // Day concept
  ["day", "days", "araw", "sched"],
  // Room concept
  ["room", "venue", "location", "silid", "classroom"]
];

function scoreLineAsHeader(line) {
  const lower = line.toLowerCase();
  // Count how many DISTINCT concept groups this line matches
  const matched = SCHEDULE_CONCEPTS.filter(group =>
    group.some(synonym => lower.includes(synonym))
  );
  return matched.length; // 0-5
}

function findScheduleHeaderLine(lines) {
  let bestScore = 0;
  let bestIndex = -1;
  lines.forEach((line, i) => {
    const score = scoreLineAsHeader(line);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  // Require at least 3 concept matches to qualify as a schedule header
  if (bestScore < 3) throw new Error('NO_SCHEDULE_TABLE_FOUND');
  return bestIndex;
}

const SCHEDULE_DATA_SIGNALS = [
  /\b[A-Z]{1,6}\d{1,4}[A-Z]?\b/,           // course code shape
  /\d{1,2}:\d{2}\s*[aApP][mM]/,            // time with meridiem
  /\b\d{2}:\d{2}\b/,                       // 24h time
  /\b(M(?!a)|T(?!u)|W(?!e)|Th|F(?!e)|S(?!e)|Su|Mon|Tue|Wed|Thu|Fri|Sat|Sun|MWF|MTh|TF|TTh)\b/
];

function isScheduleDataRow(line) {
  if (line.trim() === '') return false;
  return SCHEDULE_DATA_SIGNALS.some(pattern => pattern.test(line));
}

function extractTableLines(allLines, headerIndex) {
  const dataLines = [];
  let consecutiveNonDataRows = 0;

  for (let i = headerIndex + 1; i < allLines.length; i++) {
    const line = allLines[i].trim();
    if (line === '') continue;

    if (isScheduleDataRow(line)) {
      consecutiveNonDataRows = 0;
      dataLines.push(allLines[i]);
    } else {
      consecutiveNonDataRows++;
      // After 2 consecutive non-schedule rows, the table has ended
      if (consecutiveNonDataRows >= 2) break;
    }
  }
  return dataLines;
}

const FIELD_SYNONYMS = {
  course_code: [
    "course code", "code", "subject code", "subj code", "subj. code",
    "subject no", "subj no", "catalog no", "cat. no", "katalogo"
  ],
  course_title: [
    "course description", "description", "subject", "title",
    "course title", "subject title", "descriptive title",
    "subject description", "pamagat"
  ],
  day: [
    "day", "days", "day/s", "araw", "schedule day", "sched day"
  ],
  time: [
    "time", "time slot", "class hours", "schedule", "oras",
    "class time", "sched time", "meeting time"
  ],
  room: [
    "room", "room no", "room no.", "venue", "location",
    "silid", "classroom", "room/venue", "building", "bldg"
  ]
};



const COURSE_CODE_PATTERNS = [
  /^[A-Z]{2,6}\d{1,4}[A-Z]?$/,       // CSP109, TEC101, MATH11A
  /^[A-Z]{1,6}\s\d{1,4}[A-Z]?$/,     // MATH 11, CS 101
  /^[A-Z]{2,6}-\d{1,4}[A-Z]?$/,      // ENG-101, IT-201
  /^[A-Z]{1,6}\d{1,4}[A-Z]{1,2}$/,   // CS101L, IT201LB (with lab suffix)
  /^[A-Z]{2,8}\d{1,2}$/,             // NSTP01, PATHFIT1, ROTC1
  /^[A-Z]{1,4}\d{1,4}$/,             // GE1, PE2, CS1
  /^\d[A-Z]{2,6}\d{2,4}$/            // semester-prefixed codes
];

// Shape validator — does this LOOK like a course code?
function isValidCourseCodeShape(str) {
  const s = str.trim();
  if (s.length < 2 || s.length > 12) return false;
  return COURSE_CODE_PATTERNS.some(p => p.test(s));
}

// Noise validator — is this definitely NOT a course code?
const DEFINITE_NON_CODES = [
  /^\d+$/,                            // pure number: "3", "18"
  /^(lec|lab|units?|section|total|no\.?|hrs?\.?)$/i,  // header fragments
  /^[a-z]/,                           // starts with lowercase
  /\s{2,}/                            // contains multiple spaces (it's a phrase)
];

function isDefinitelyNotACourseCode(str) {
  return DEFINITE_NON_CODES.some(p => p.test(str.trim()));
}

function classifyCourseCodeCell(cellValue) {
  const s = cellValue.trim();
  if (s === '') return 'EMPTY';                       // continuation row
  if (isDefinitelyNotACourseCode(s)) return 'NOISE'; // skip this row
  if (isValidCourseCodeShape(s)) return 'VALID';     // new entry
  return 'UNKNOWN'; // non-empty, not noise, not valid — treat as new entry cautiously
}

// Layer 4: Multi-Slot Detection Patterns
const MULTI_SLOT_SEPARATORS = [
  " / ",    // BCH 501 / COMLAB 3         (your current form)
  " & ",    // BCH 501 & COMLAB 3
  " and ",  // BCH 501 and COMLAB 3
  "\n",     // separate lines (handled by continuation row logic already)
  "; "      // BCH 501; COMLAB 3
];



function readMultiValue(cellValue) {
  if (!cellValue) return [];

  for (const sep of MULTI_SLOT_SEPARATORS) {
    if (cellValue.includes(sep)) {
      return cellValue.split(sep).map(s => s.trim()).filter(Boolean);
    }
  }

  return [cellValue.trim()];
}



// Layer 0: Auto-Detect Delimiter
function detectDelimiter(headerLine) {
  const candidates = [
    { pattern: /\t+/,    name: 'TAB' },
    { pattern: /\s{3,}/, name: 'SPACE_3+' },
    { pattern: /\s{2,}/, name: 'SPACE_2+' },
  ];

  let bestDelimiter = null;
  let bestCellCount = 0;

  for (const candidate of candidates) {
    const cells = headerLine.split(candidate.pattern).map(s => s.trim()).filter(Boolean);
    const hasScheduleConcept = cells.some(cell =>
      SCHEDULE_CONCEPTS.some(group =>
        group.some(syn => cell.toLowerCase().includes(syn))
      )
    );
    if (hasScheduleConcept && cells.length > bestCellCount) {
      bestCellCount = cells.length;
      bestDelimiter = candidate.pattern;
    }
  }

  return bestDelimiter ?? /\s{2,}/;
}

function buildFieldIndexMap(headerCells) {
  const map = {};

  headerCells.forEach((cell, index) => {
    const lower = cell.toLowerCase().trim();
    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.some(syn => lower.includes(syn))) {
        // Only assign if not already assigned (first match wins)
        if (map[field] === undefined) {
          map[field] = index;
        }
      }
    }
  });

  console.log('[Gridworks Extractor] Header cells:', headerCells);
  console.log('[Gridworks Extractor] Field index map:', map);

  return map;
}

function validateFieldMap(map, headerCells) {
  const REQUIRED = ['course_code', 'time'];
  const RECOMMENDED = ['day', 'room', 'course_title'];

  const missingRequired = REQUIRED.filter(f => map[f] === undefined);
  if (missingRequired.length > 0) {
    throw new Error(`MISSING_REQUIRED_COLUMNS: ${missingRequired.join(', ')}`);
  }

  const missingRecommended = RECOMMENDED.filter(f => map[f] === undefined);
  if (missingRecommended.length > 0) {
    console.warn('[Gridworks Extractor] Missing optional columns:', missingRecommended);
    // Do not throw — set missing fields to null in output
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

  if (delimiter && delimiter.toString() === '/\\s{2,}/') {
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
  try {
    headerIndex = findScheduleHeaderLine(rawLines);
  } catch (error) {
    if (error.message === 'NO_SCHEDULE_TABLE_FOUND') {
      throw error; // Propagate for "No schedule table at all" requirement
    }
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
  
  const headerCells = normHeaderLine.split(delimiter).map(s => s.trim()).filter(Boolean);
  const fieldIndexMap = buildFieldIndexMap(headerCells);

  try {
    validateFieldMap(fieldIndexMap, headerCells);
  } catch (err) {
    console.error("[tokenizer]", err.message);
    return [];
  }

  // Step 4 — Read Data Lines
  const tableLines = extractTableLines(rawLines, headerIndex);

  // Steps 5-7 — Spatial Extraction + Detect + Accumulate
  const entries = [];
  
  for (const line of tableLines) {
    const splitLine = line.split(delimiter).map(s => s.trim());
    
    // Temporarily build cells object for backward compatibility with Problem 3 & 4
    const cells = {
      course_code: fieldIndexMap.course_code !== undefined ? splitLine[fieldIndexMap.course_code] || "" : "",
      course_title: fieldIndexMap.course_title !== undefined ? splitLine[fieldIndexMap.course_title] || "" : "",
      time: fieldIndexMap.time !== undefined ? splitLine[fieldIndexMap.time] || "" : "",
      room: fieldIndexMap.room !== undefined ? splitLine[fieldIndexMap.room] || "" : "",
      day: fieldIndexMap.day !== undefined ? splitLine[fieldIndexMap.day] || "" : ""
    };

    const codeCell = cells.course_code || "";
    const codeClass = classifyCourseCodeCell(codeCell);

    if (codeClass === 'NOISE') continue;

    const isContinuation = (codeClass === 'EMPTY');

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
