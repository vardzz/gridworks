// src/lib/parser/normalizer.js — Normalizes raw structured entries into schema objects

const DAY_MAP = {
  m: "Monday", mo: "Monday", mon: "Monday", monday: "Monday",
  t: "Tuesday", tu: "Tuesday", tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
  w: "Wednesday", we: "Wednesday", wed: "Wednesday", wednesday: "Wednesday",
  th: "Thursday", thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
  f: "Friday", fr: "Friday", fri: "Friday", friday: "Friday",
  s: "Saturday", sa: "Saturday", sat: "Saturday", saturday: "Saturday",
  su: "Sunday", sun: "Sunday", sunday: "Sunday",
};

const COMPOUND_MAP = {
  mwf: ["Monday", "Wednesday", "Friday"],
  mw: ["Monday", "Wednesday"],
  tth: ["Tuesday", "Thursday"],
  mth: ["Monday", "Thursday"],
  wth: ["Wednesday", "Thursday"],
  "t/th": ["Tuesday", "Thursday"],
  tr: ["Tuesday", "Thursday"],
  tf: ["Tuesday", "Friday"],
  wf: ["Wednesday", "Friday"],
  mtwthf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  mtwtf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  mtwrf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
};

export function normalizeDays(rawDayInput) {
  if (!rawDayInput) return [];
  if (Array.isArray(rawDayInput)) {
    const result = [];
    for (const token of rawDayInput) result.push(...normalizeDays(token));
    return [...new Set(result)];
  }

  const raw = rawDayInput.trim().toLowerCase();
  if (!raw) return [];

  if (COMPOUND_MAP[raw]) return [...COMPOUND_MAP[raw]];

  // Split on slash, comma, space, dash
  const tokens = raw.split(/[\s,/\-]+/).filter(Boolean);

  if (tokens.length === 1 && tokens[0].length > 1) {
    const token = tokens[0];
    if (COMPOUND_MAP[token]) return [...COMPOUND_MAP[token]];

    const letterDays = [];
    let i = 0;
    while (i < token.length) {
      if (i + 1 < token.length && token[i] === "t" && token[i + 1] === "h") {
        letterDays.push("Thursday");
        i += 2;
      } else if (i + 1 < token.length && token[i] === "s" && token[i + 1] === "u") {
        letterDays.push("Sunday");
        i += 2;
      } else {
        const letter = token[i];
        const day = DAY_MAP[letter];
        if (day) letterDays.push(day);
        i++;
      }
    }
    if (letterDays.length > 0) return [...new Set(letterDays)];
  }

  const result = [];
  for (const token of tokens) {
    const day = DAY_MAP[token];
    if (day) {
      result.push(day);
    } else if (COMPOUND_MAP[token]) {
      result.push(...COMPOUND_MAP[token]);
    }
  }

  return [...new Set(result)];
}

function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  // Clean spaces and extraneous chars like slashes from the PDF cell splitting
  const cleaned = timeStr.trim().replace(/[\/\s]+/g, "");

  // match "8:00am", "1:30PM"
  const match = cleaned.match(/^(\d{1,2}):(\d{2})([apAP][mM]?)$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2];
    const meridiem = match[3].toLowerCase();

    if (meridiem.startsWith("p") && hours !== 12) hours += 12;
    if (meridiem.startsWith("a") && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${mins}`;
  }

  // match "13:30"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = match24[2];
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, "0")}:${mins}`;
    }
  }

  return null;
}

export function normalizeEntries(rawEntries) {
  const result = [];

  for (const raw of rawEntries) {
    const baseEntry = {
      course_code: raw.course_code || null,
      course_title: raw.course_title || null,
      days: raw.days_raw ? normalizeDays(raw.days_raw) : [],
    };

    if (!raw.times_raw || raw.times_raw.length === 0) {
      result.push({
        ...baseEntry,
        start_time: null,
        end_time: null,
        room: raw.rooms_raw?.[0] || null
      });
      continue;
    }

    for (let i = 0; i < raw.times_raw.length; i++) {
      const timeStr = raw.times_raw[i];
      let start_time = null;
      let end_time = null;

      // split on " - ", "–", "—", " to "
      const parts = timeStr.split(/\s*[-–—]\s*|\s+to\s+/i);
      if (parts.length === 2) {
        start_time = parseTime(parts[0]);
        end_time = parseTime(parts[1]);
      } else {
        start_time = null;
        end_time = null;
      }

      result.push({
        ...baseEntry,
        start_time,
        end_time,
        room: raw.rooms_raw?.[i] || raw.rooms_raw?.[0] || null
      });
    }
  }

  return result;
}
