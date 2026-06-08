// src/lib/parser/regexTokenizer.js — Structured Data Tokenizer

const TARGET_FIELDS = {
  course_code:   ["course code", "code", "subject code", "subj code", "subj. code"],
  course_title:  ["course description", "description", "subject", "title", "course title"],
  room:          ["room", "room no", "room no.", "venue", "location"],
  day:           ["day", "days", "day/s"],
  time:          ["time", "time slot", "schedule", "class hours"]
};

function matchHeader(headerLabel, targetField) {
  const lower = headerLabel.toLowerCase().trim();
  // Substring matching handles split-merged columns (e.g., matching "Code" to "course code")
  return TARGET_FIELDS[targetField].some(m => lower === m || lower.includes(m) || m.includes(lower));
}

function buildFieldMap(columns) {
  const fieldMap = {};
  for (const targetField of Object.keys(TARGET_FIELDS)) {
    for (const label of columns) {
      if (matchHeader(label, targetField)) {
        fieldMap[targetField] = label;
        break;
      }
    }
    if (!fieldMap[targetField]) {
      fieldMap[targetField] = null;
    }
  }
  return fieldMap;
}

function readField(row, fieldMap, targetField) {
  const headerLabel = fieldMap[targetField];
  if (!headerLabel) return "";
  return row[headerLabel] ?? "";
}

function isContinuationRow(row, fieldMap) {
  const courseCodeValue = readField(row, fieldMap, "course_code");
  // Simple check + validation against a completely extraneous row
  const isLikelyCourse = /\b[A-Z]{2,5}\s?-?\d{1,4}[A-Z]?\b/i.test(courseCodeValue);
  return courseCodeValue === "" || (!isLikelyCourse && courseCodeValue.length < 4);
}

/**
 * Tokenizes a structured 2D matrix into raw entry objects.
 *
 * @param {Object} structuredData
 * @returns {Array<Object>} — array of raw entry objects
 */
export function tokenize(structuredData) {
  if (!structuredData || !structuredData.headers || !structuredData.rows) {
    return [];
  }

  // Step 4 — Column Isolation
  const fieldMap = buildFieldMap(structuredData.headers);
  console.log("[tokenizer] Field Map:", JSON.stringify(fieldMap));

  // Step 5 — Continuation Row Detection
  const entries = [];

  for (const row of structuredData.rows) {
    if (!isContinuationRow(row, fieldMap)) {
      const entry = {
        course_code: readField(row, fieldMap, "course_code"),
        course_title: readField(row, fieldMap, "course_title"),
        days_raw: readField(row, fieldMap, "day"),
        times_raw: [],
        rooms_raw: []
      };
      
      const t = readField(row, fieldMap, "time");
      const r = readField(row, fieldMap, "room");
      if (t) entry.times_raw.push(t);
      if (r) entry.rooms_raw.push(r);
      
      entries.push(entry);
    } else {
      if (entries.length === 0) continue;
      
      const lastEntry = entries[entries.length - 1];
      const t = readField(row, fieldMap, "time");
      const r = readField(row, fieldMap, "room");
      if (t) lastEntry.times_raw.push(t);
      if (r) lastEntry.rooms_raw.push(r);
    }
  }

  return entries;
}
