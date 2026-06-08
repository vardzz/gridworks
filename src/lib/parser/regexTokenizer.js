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
    
    const isCourseCode = MAP.COURSE_CODE.some(m => lower === m || lower.includes(m) || m.includes(lower));
    const isCourseTitle = MAP.COURSE_TITLE.some(m => lower === m || lower.includes(m) || m.includes(lower));
    const isRoom = MAP.ROOM.some(m => lower === m || lower.includes(m));
    const isDay = MAP.DAY.some(m => lower === m || lower.includes(m));
    const isTime = MAP.TIME.some(m => lower === m || lower.includes(m));

    if (!matchedHeaders.COURSE_CODE && isCourseCode) {
      matchedHeaders.COURSE_CODE = h;
    } else if (!matchedHeaders.COURSE_TITLE && isCourseTitle) {
      matchedHeaders.COURSE_TITLE = h;
    } else if (!matchedHeaders.ROOM && isRoom) {
      matchedHeaders.ROOM = h;
    } else if (!matchedHeaders.DAY && isDay) {
      matchedHeaders.DAY = h;
    } else if (!matchedHeaders.TIME && isTime) {
      matchedHeaders.TIME = h;
    }
  }

  // Step 2 — Iterate rows and group into courses/orphans
  const courses = [];
  const orphans = [];

  for (const row of structuredData.rows) {
    const courseCodeRaw = matchedHeaders.COURSE_CODE ? row[matchedHeaders.COURSE_CODE] : "";
    const courseCode = courseCodeRaw ? courseCodeRaw.trim() : "";

    const isLikelyCourse = courseCode && /\b[A-Z]{2,5}\s?-?\d{1,4}[A-Z]?\b/i.test(courseCode);

    if (isLikelyCourse) {
      const courseTitleRaw = matchedHeaders.COURSE_TITLE ? row[matchedHeaders.COURSE_TITLE] : "";
      const dayRaw = matchedHeaders.DAY ? row[matchedHeaders.DAY] : "";
      const roomRaw = matchedHeaders.ROOM ? row[matchedHeaders.ROOM] : "";
      const timeRaw = matchedHeaders.TIME ? row[matchedHeaders.TIME] : "";

      const currentEntry = {
        _y: row._y,
        course_code: courseCode,
        course_title: courseTitleRaw ? courseTitleRaw.trim() : null,
        days_raw: dayRaw ? dayRaw.trim() : null,
        times_raw: [],
        rooms_raw: [],
      };

      if (timeRaw && timeRaw.trim()) currentEntry.times_raw.push({ y: row._y, val: timeRaw.trim() });
      if (roomRaw && roomRaw.trim()) currentEntry.rooms_raw.push({ y: row._y, val: roomRaw.trim() });

      courses.push(currentEntry);
    } else {
      orphans.push(row);
    }
  }

  // Step 3 — Assign orphans to the closest course by Y-distance
  for (const orphan of orphans) {
    if (courses.length === 0) continue;

    let closestCourse = courses[0];
    let minDiff = Math.abs(courses[0]._y - orphan._y);

    for (let i = 1; i < courses.length; i++) {
      const diff = Math.abs(courses[i]._y - orphan._y);
      if (diff < minDiff) {
        minDiff = diff;
        closestCourse = courses[i];
      }
    }

    const roomRaw = matchedHeaders.ROOM ? orphan[matchedHeaders.ROOM] : "";
    const timeRaw = matchedHeaders.TIME ? orphan[matchedHeaders.TIME] : "";

    if (timeRaw && timeRaw.trim()) closestCourse.times_raw.push({ y: orphan._y, val: timeRaw.trim() });
    if (roomRaw && roomRaw.trim()) closestCourse.rooms_raw.push({ y: orphan._y, val: roomRaw.trim() });
  }

  // Step 4 — Sort times and rooms top-to-bottom and strip tracking properties
  for (const course of courses) {
    course.times_raw.sort((a, b) => b.y - a.y); // Y is descending top-to-bottom in PDF space
    course.rooms_raw.sort((a, b) => b.y - a.y);

    course.times_raw = course.times_raw.map(t => t.val);
    course.rooms_raw = course.rooms_raw.map(r => r.val);
    delete course._y;
  }

  return courses;
}
