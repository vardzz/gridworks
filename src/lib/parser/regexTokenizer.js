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
    'course code', 'code', 'subject code', 'subj code',
    'subj. code', 'subject no', 'subj no', 'catalog no',
    'cat. no', 'katalogo', 'course no', 'course no.'
  ],
  course_title: [
    'course description', 'descriptive title', 'course title',
    'subject title', 'subject description', 'description',
    'course name', 'subject name', 'pamagat'
  ],
  day: [
    'day', 'days', 'day/s', 'araw', 'schedule day', 'class day',
    'meeting day'
  ],
  time: [
    'time', 'time slot', 'class hours', 'class time',
    'meeting time', 'schedule time', 'sched time', 'oras'
  ],
  room: [
    'room', 'room no', 'room no.', 'venue', 'location',
    'classroom', 'class room', 'silid', 'bldg', 'building',
    'room/venue'
  ],
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

const INLINE_SEPARATORS = [' / ', ' & ', '; ', ' and ', ' or '];

function detectInlineSeparator(timeValue, roomValue) {
  // Check which separator appears in BOTH time and room values
  // If it appears in both, it's the multi-slot separator for this form
  for (const sep of INLINE_SEPARATORS) {
    if (timeValue.includes(sep) && roomValue.includes(sep)) {
      return sep;
    }
  }
  // Check if separator appears in just the time value
  for (const sep of INLINE_SEPARATORS) {
    if (timeValue.includes(sep)) {
      return sep;
    }
  }
  return null; // single slot
}

function readMultiValue(cellValue, separator) {
  if (!cellValue || cellValue.trim() === '') return [];
  if (!separator) return [cellValue.trim()];
  return cellValue.split(separator).map(s => s.trim()).filter(Boolean);
}

function shouldMergeWithPrevious(cells, lastEntry, fieldMap) {
  if (!lastEntry) return false;
  const code = cells[fieldMap.course_code]?.trim();
  // Same code as previous entry = Format C continuation
  if (code && code === lastEntry.course_code) return true;
  return false;
}

function isContinuationRow(cells, fieldIndexMap) {
  const firstCell = cells[0]?.trim() ?? '';
  
  // CONDITION A: first cell is empty (explicitly aligned continuation)
  if (firstCell === '') return true;

  // CONDITION B: first cell looks like a time value (Format B)
  if (/^\d{1,2}:\d{2}/.test(firstCell)) return true;

  // CONDITION C: first cell is NOT a valid course code shape, 
  // and we either have time data or it's clearly a title continuation word
  if (!isValidCourseCodeShape(firstCell)) {
    const hasTimeData = cells.some(c => /\d{1,2}:\d{2}/.test(c));
    if (hasTimeData) return true;
    
    // If it's not a noise word (like header artifact) and not a code, treat as title continuation
    if (!isDefinitelyNotACourseCode(firstCell)) return true;
  }

  return false;
}

function accumulateEntries(dataLines, fieldMap, delimiter) {
  const entries = [];

  for (const line of dataLines) {
    const cells = line.split(delimiter).map(s => s.trim());
    if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) continue;

    if (isContinuationRow(cells, fieldMap)) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        cells.forEach(cell => {
          const c = cell.trim();
          if (!c) return;
          
          if (/\d{1,2}:\d{2}/.test(c)) {
            lastEntry.times_raw.push(c);
          } else if (/^(M|T|W|Th|F|S|MTh|TF|Sa|Su|W \/ W|M \/ Th|Sa \/ Sa)+$/i.test(c.replace(/\s/g, ''))) {
            // Day continuation
          } else if (/^\d$/.test(c)) {
            // Disregard units
          } else if (c.includes('CS-') || c.includes('IT-')) {
            // Disregard section
          } else {
            // Title or room
            const hasNumbers = /\d/.test(c);
            const isShort = c.length <= 15;
            if (hasNumbers || (isShort && c === c.toUpperCase())) {
              lastEntry.rooms_raw.push(c);
            } else {
              lastEntry.course_title = lastEntry.course_title ? lastEntry.course_title + ' ' + c : c;
            }
          }
        });
      }
      continue;
    }

    const codeCell = cells[0] ?? '';
    let titleCell = cells[1] ?? '';
    
    // Dynamic shape matching for the rest of the row, bypassing offset bugs
    const timeCell = cells.find(c => /\d{1,2}:\d{2}/.test(c)) || '';
    const dayCell = cells.find(c => /^(M|T|W|Th|F|S|MTh|TF|Sa|Su|W \/ W|M \/ Th|Sa \/ Sa)+$/i.test(c.replace(/\s/g, ''))) || '';
    
    // Room is whatever is left that isn't a known field, a unit, or a section
    const roomCell = cells.find(c => 
      c !== codeCell && 
      c !== titleCell && 
      c !== timeCell && 
      c !== dayCell && 
      !/^\d$/.test(c) && 
      !/^[1-4][A-Z]{2,4}-[A-Z]$/.test(c) &&
      c !== ''
    ) || '';

    const codeClass = classifyCourseCodeCell(codeCell);
    if (codeClass === 'NOISE') continue;

    const lastEntry = entries[entries.length - 1] ?? null;
    const isSameCodeAsPrevious = shouldMergeWithPrevious(cells, lastEntry, fieldMap);

    if (isSameCodeAsPrevious) {
      if (lastEntry) {
        if (timeCell) lastEntry.times_raw.push(timeCell);
        if (roomCell) lastEntry.rooms_raw.push(roomCell);
      }
    } else {
      const sep = detectInlineSeparator(timeCell, roomCell);
      const newEntry = {
        course_code:  codeCell,
        course_title: titleCell,
        days_raw:     dayCell,
        times_raw:    readMultiValue(timeCell, sep),
        rooms_raw:    readMultiValue(roomCell, sep),
      };
      entries.push(newEntry);
    }
  }

  return entries;
}

// Layer 0: Auto-Detect Delimiter
function detectDelimiter(headerLine) {
  // TAB wins if present — it is the explicit column delimiter
  // set by pdfExtractor.js and is unambiguous
  if (headerLine.includes("\t")) {
    console.log("[tokenizer] Delimiter detected: TAB");
    return /\t/;
  }
 
  // Fallback for OCR text or non-tab PDFs:
  // Try 3+ spaces, then 2+ spaces
  if (/\s{3,}/.test(headerLine)) {
    console.log("[tokenizer] Delimiter detected: 3+ spaces");
    return /\s{3,}/;
  }
 
  if (/\s{2,}/.test(headerLine)) {
    console.log("[tokenizer] Delimiter detected: 2+ spaces");
    return /\s{2,}/;
  }
 
  console.warn("[tokenizer] No reliable delimiter found — using single space (low confidence)");
  return /\s+/;
}
 
// Also update your splitLine function to use the detected delimiter:
function splitLine(line, delimiter) {
  return line.split(delimiter).map(s => s.trim()).filter(s => s !== "");
}

function matchesSynonym(cellText, synonym) {
  const cellLower = cellText.toLowerCase().trim();
  const synLower = synonym.toLowerCase().trim();

  // Use exact match for short synonyms (single word, under 8 chars)
  // Use includes() for longer multi-word synonyms
  if (synLower.length <= 8 && !synLower.includes(' ')) {
    return cellLower === synLower;
  }
  return cellLower.includes(synLower);
}

function buildFieldIndexMap(headerCells) {
  const map = {};

  headerCells.forEach((cell, index) => {
    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (map[field] !== undefined) continue; // already assigned, skip
      if (synonyms.some(syn => matchesSynonym(cell, syn))) {
        map[field] = index;
        console.log(`[tokenizer] Mapped "${cell}" (index ${index}) → ${field}`);
        break;
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
  
  const headerCells = normHeaderLine.split(delimiter).map(s => s.trim());
  
  // --- DISREGARD SPECIFIC COLUMNS (Lec, Lab, Units, Section) ---
  const disregardIndices = new Set();
  headerCells.forEach((cell, idx) => {
    const c = cell.toLowerCase();
    if (c.includes('lec') || c.includes('lab') || c.includes('unit') || c.includes('section')) {
      disregardIndices.add(idx);
    }
  });

  const filteredHeaderCells = headerCells.filter((_, idx) => !disregardIndices.has(idx));
  const fieldIndexMap = buildFieldIndexMap(filteredHeaderCells);

  try {
    validateFieldMap(fieldIndexMap, filteredHeaderCells);
  } catch (err) {
    console.error("[tokenizer]", err.message);
    return [];
  }

  // Step 4 — Read Data Lines
  let tableLines = extractTableLines(rawLines, headerIndex);

  // Apply the same disregard filter to every data line to maintain column alignment
  tableLines = tableLines.map(line => {
    const cells = line.split(delimiter).map(s => s.trim());
    const filteredCells = cells.filter((_, idx) => !disregardIndices.has(idx));
    // Join using a string tab since delimiter is a RegExp object
    return filteredCells.join('\t');
  });

  // Force accumulateEntries to use the tab delimiter we just joined with
  return accumulateEntries(tableLines, fieldIndexMap, /\t/);
}
