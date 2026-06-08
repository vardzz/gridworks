// src/lib/parser/regexTokenizer.js — Structured Data Tokenizer

const MAP = {
  COURSE_CODE: ["course code", "code", "subject code", "subj code", "subj. code"],
  COURSE_TITLE: ["course description", "description", "subject", "title", "course title", "subject title"],
  ROOM: ["room", "room no", "room no.", "venue", "location"],
  DAY: ["day", "days", "day/s"],
  TIME: ["time", "time slot", "schedule", "class hours"],
};

/**
 * Tokenizes a structured 2D object into raw entry objects.
 * Expects structuredData to have { headers: [], rows: [{}] }.
 *
 * @param {Object} structuredData
 * @returns {Array<Object>} — array of raw entry objects
 */
export function tokenize(structuredData) {
  if (!structuredData || !structuredData.headers || !structuredData.rows) {
    return [];
  }

  // Step 1 — Map target columns by matching headers
  const matchedHeaders = {
    COURSE_CODE: null,
    COURSE_TITLE: null,
    ROOM: null,
    DAY: null,
    TIME: null,
  };

  for (const h of structuredData.headers) {
    const lower = h.trim().toLowerCase();
    if (!matchedHeaders.COURSE_CODE && MAP.COURSE_CODE.includes(lower)) {
      matchedHeaders.COURSE_CODE = h;
    } else if (!matchedHeaders.COURSE_TITLE && MAP.COURSE_TITLE.includes(lower)) {
      matchedHeaders.COURSE_TITLE = h;
    } else if (!matchedHeaders.ROOM && MAP.ROOM.includes(lower)) {
      matchedHeaders.ROOM = h;
    } else if (!matchedHeaders.DAY && MAP.DAY.includes(lower)) {
      matchedHeaders.DAY = h;
    } else if (!matchedHeaders.TIME && MAP.TIME.includes(lower)) {
      matchedHeaders.TIME = h;
    }
  }

  // Step 2 — Iterate rows
  const entries = [];
  let currentEntry = null;

  for (const row of structuredData.rows) {
    const courseCodeRaw = matchedHeaders.COURSE_CODE ? row[matchedHeaders.COURSE_CODE] : "";
    const courseCode = courseCodeRaw ? courseCodeRaw.trim() : "";

    if (courseCode) {
      // 2b. NEW ENTRY
      const courseTitleRaw = matchedHeaders.COURSE_TITLE ? row[matchedHeaders.COURSE_TITLE] : "";
      const dayRaw = matchedHeaders.DAY ? row[matchedHeaders.DAY] : "";
      const roomRaw = matchedHeaders.ROOM ? row[matchedHeaders.ROOM] : "";
      const timeRaw = matchedHeaders.TIME ? row[matchedHeaders.TIME] : "";

      currentEntry = {
        course_code: courseCode,
        course_title: courseTitleRaw ? courseTitleRaw.trim() : null,
        days_raw: dayRaw ? dayRaw.trim() : null,
        times_raw: [],
        rooms_raw: [],
      };

      if (timeRaw && timeRaw.trim()) currentEntry.times_raw.push(timeRaw.trim());
      if (roomRaw && roomRaw.trim()) currentEntry.rooms_raw.push(roomRaw.trim());

      entries.push(currentEntry);
    } else if (currentEntry) {
      // 2c. CONTINUATION ROW
      const roomRaw = matchedHeaders.ROOM ? row[matchedHeaders.ROOM] : "";
      const timeRaw = matchedHeaders.TIME ? row[matchedHeaders.TIME] : "";

      if (roomRaw && roomRaw.trim()) currentEntry.rooms_raw.push(roomRaw.trim());
      if (timeRaw && timeRaw.trim()) currentEntry.times_raw.push(timeRaw.trim());
    }
  }

  // Step 3 — Return working list
  return entries;
}
