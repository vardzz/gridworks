// src/lib/parser/normalizer.js — Days/time normalization to canonical format

const DAY_MAP = {
  m: "Monday",
  mo: "Monday",
  mon: "Monday",
  monday: "Monday",
  t: "Tuesday",
  tu: "Tuesday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  w: "Wednesday",
  we: "Wednesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  th: "Thursday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  f: "Friday",
  fr: "Friday",
  fri: "Friday",
  friday: "Friday",
  s: "Saturday",
  sa: "Saturday",
  sat: "Saturday",
  saturday: "Saturday",
  su: "Sunday",
  sun: "Sunday",
  sunday: "Sunday",
};

// Compound shortcodes that must be recognized as multiple days
const COMPOUND_MAP = {
  mwf: ["Monday", "Wednesday", "Friday"],
  mw: ["Monday", "Wednesday"],
  tth: ["Tuesday", "Thursday"],
  "t/th": ["Tuesday", "Thursday"],
  tr: ["Tuesday", "Thursday"],
  mtwthf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  mtwtf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  mtwrf: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
};

/**
 * Normalizes a raw days string or array into canonical full day names.
 * Handles: single letters, abbreviations, compound shortcodes,
 * slash/comma/space-separated lists.
 *
 * @param {string|string[]} rawDayInput
 * @returns {string[]} — deduplicated array of full day names
 */
export function normalizeDays(rawDayInput) {
  if (!rawDayInput) return [];

  // If already an array, normalize each element
  if (Array.isArray(rawDayInput)) {
    const result = [];
    for (const token of rawDayInput) {
      result.push(...normalizeDays(token));
    }
    return [...new Set(result)];
  }

  const raw = rawDayInput.trim().toLowerCase();
  if (!raw) return [];

  // Check compound shortcodes first
  if (COMPOUND_MAP[raw]) {
    return [...COMPOUND_MAP[raw]];
  }

  // Split on common delimiters: slash, comma, space, dash
  const tokens = raw.split(/[\s,/\-]+/).filter(Boolean);

  // If only one token, try to split letter-by-letter patterns like "MWF"
  if (tokens.length === 1 && tokens[0].length > 1) {
    const token = tokens[0];

    // Check compound map
    if (COMPOUND_MAP[token]) {
      return [...COMPOUND_MAP[token]];
    }

    // Try letter-by-letter splitting with "th" awareness
    const letterDays = [];
    let i = 0;
    while (i < token.length) {
      // Check for "th" as Thursday (but not at start if preceded by nothing)
      if (i + 1 < token.length && token[i] === "t" && token[i + 1] === "h") {
        letterDays.push("Thursday");
        i += 2;
      } else if (i + 2 < token.length && token.substring(i, i + 2) === "su") {
        letterDays.push("Sunday");
        i += 2;
      } else {
        const letter = token[i];
        const day = DAY_MAP[letter];
        if (day) letterDays.push(day);
        i++;
      }
    }

    if (letterDays.length > 0) {
      return [...new Set(letterDays)];
    }
  }

  // Standard token-by-token lookup
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

/**
 * Normalizes a 12-hour or 24-hour time string to canonical HH:MM 24-hour format.
 * Handles: "8:00 AM", "08:00am", "1:30PM", "13:30", "8:00", etc.
 *
 * @param {string} timeStr
 * @returns {string|null} — "HH:MM" or null if unparseable
 */
export function normalizeTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;

  const cleaned = timeStr.trim().replace(/\s+/g, "");

  // Try 12-hour format: "8:00AM", "08:00 am", "1:30PM"
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*([apAP][mM]?)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = match12[2];
    const meridiem = match12[3].toLowerCase();

    if (meridiem.startsWith("p") && hours < 12) hours += 12;
    if (meridiem.startsWith("a") && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${mins}`;
  }

  // Try 24-hour format: "13:30", "08:00"
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
