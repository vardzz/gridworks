// src/lib/parser/normalizer.js — Normalizes raw structured entries into schema objects

const DAY_MAP_2 = { th: "Thursday", su: "Sunday" };
const DAY_MAP_1 = {
  m: "Monday", t: "Tuesday", w: "Wednesday",
  f: "Friday", s: "Saturday"
};

const COMPOUND_MAP = {
  mth: ["Monday", "Thursday"],
  mwf: ["Monday", "Wednesday", "Friday"],
  tf:  ["Tuesday", "Friday"],
  tth: ["Tuesday", "Thursday"],
  wf:  ["Wednesday", "Friday"],
  mw:  ["Monday", "Wednesday"]
};

const WORD_MAP = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday",
  sunday: "Sunday",
  mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday"
};

function tokenizeDays(daysRaw) {
  const s = daysRaw.replace(/\//g, " ").replace(/,/g, " ").replace(/-/g, " ");
  return s.split(/\s+/).filter(Boolean);
}

function mapToken(token) {
  const lower = token.toLowerCase();

  if (WORD_MAP[lower]) return [WORD_MAP[lower]];
  
  for (const [key, val] of Object.entries(COMPOUND_MAP)) {
    if (lower === key) return val;
  }

  // Character-by-character greedy match
  const result = [];
  let i = 0;
  while (i < token.length) {
    const two = token.substring(i, i + 2).toLowerCase();
    const one = token.substring(i, i + 1).toLowerCase();
    
    if (DAY_MAP_2[two]) {
      result.push(DAY_MAP_2[two]);
      i += 2;
    } else if (DAY_MAP_1[one]) {
      result.push(DAY_MAP_1[one]);
      i += 1;
    } else {
      i += 1; // unrecognized character, skip
    }
  }
  return result;
}

// Step 7 — Day Normalization
export function normalizeDays(daysRaw) {
  if (!daysRaw) return [];
  const tokens = tokenizeDays(daysRaw);
  const days = [];
  for (const token of tokens) {
    days.push(...mapToken(token));
  }
  return [...new Set(days)];
}

// Step 6 — Time Parsing
function parseTo24h(token) {
  if (!token) return null;
  // Robust regex to extract hours, minutes, and optional am/pm
  const match = token.match(/(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toLowerCase() : null;
  
  if (isNaN(h) || isNaN(m)) return null;

  if (meridiem === "pm" && h !== 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Step 8 — Multi-Slot Split
export function normalizeEntries(rawEntries) {
  const output = [];

  for (const entry of rawEntries) {
    const N = entry.times_raw.length;
    
    if (N === 0) {
      output.push({
        subject_code: entry.subject_code,
        subject_title: entry.subject_title,
        days: normalizeDays(entry.days_raw),
        start_time: null,
        end_time: null,
        room: entry.rooms_raw.length > 0 ? entry.rooms_raw[0] : null
      });
      continue;
    }

    for (let i = 0; i < N; i++) {
      let timeStr = entry.times_raw[i] || "";
      // Strip trailing slashes, commas, or extra whitespace that would break 'pm' detection
      timeStr = timeStr.replace(/[\/,]/g, '').trim();
      
      const roomStr = (i < entry.rooms_raw.length) ? entry.rooms_raw[i] : (entry.rooms_raw[0] || null);
      
      const parts = timeStr.split(/\s*[-–—]\s*|\s+to\s+/i);
      let start = null;
      let end = null;
      if (parts.length === 2) {
        start = parseTo24h(parts[0]);
        end = parseTo24h(parts[1]);
      }
      
      output.push({
        subject_code: entry.subject_code,
        subject_title: entry.subject_title,
        days: normalizeDays(entry.days_raw),
        start_time: start,
        end_time: end,
        room: roomStr
      });
    }
  }

  return output;
}
