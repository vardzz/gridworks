// src/lib/parser/normalizer.js — Normalizes raw structured entries into schema objects

const COMPOUND_MAP = {
  "mth":  ["Monday", "Thursday"],
  "mwf":  ["Monday", "Wednesday", "Friday"],
  "tf":   ["Tuesday", "Friday"],
  "tth":  ["Tuesday", "Thursday"],
  "t/th": ["Tuesday", "Thursday"],
  "mw":   ["Monday", "Wednesday"],
  "wf":   ["Wednesday", "Friday"]
};

const SINGLE_MAP = {
  "m":  "Monday",
  "t":  "Tuesday",
  "w":  "Wednesday",
  "th": "Thursday",
  "f":  "Friday",
  "s":  "Saturday",
  "su": "Sunday"
};

const WORD_MAP = {
  "mon": "Monday",  "monday":    "Monday",
  "tue": "Tuesday", "tuesday":   "Tuesday",
  "wed": "Wednesday","wednesday": "Wednesday",
  "thu": "Thursday","thursday":  "Thursday",
  "fri": "Friday",  "friday":    "Friday",
  "sat": "Saturday","saturday":  "Saturday",
  "sun": "Sunday",  "sunday":    "Sunday"
};

export function normalizeDays(daysRaw) {
  if (!daysRaw) return [];

  const lower = daysRaw.toLowerCase().trim();

  // Check compound map first (e.g. "mth", "mwf")
  const noSlashSpace = lower.replace(/\//g,"").replace(/\s/g,"");
  if (COMPOUND_MAP[noSlashSpace]) {
    return COMPOUND_MAP[noSlashSpace];
  }

  // Split by "/" or "," or whitespace into tokens
  const tokens = lower.split(/[\/,\s]+/).filter(Boolean);

  const result = [];
  for (const token of tokens) {
    if (WORD_MAP[token]) { result.push(WORD_MAP[token]); continue; }
    if (SINGLE_MAP[token]) { result.push(SINGLE_MAP[token]); continue; }

    // Greedy character walk for fused codes like "mth" not in compound map
    let i = 0;
    while (i < token.length) {
      const two = token.substring(i, i+2);
      const one = token.substring(i, i+1);
      if (SINGLE_MAP[two]) { result.push(SINGLE_MAP[two]); i += 2; }
      else if (SINGLE_MAP[one]) { result.push(SINGLE_MAP[one]); i += 1; }
      else { i += 1; }
    }
  }

  return [...new Set(result)];
}

function parseTo24h(token) {
  if (!token) return null;
  token = token.trim();

  // Already 24-hour with colon (e.g. "13:00")
  if (/^\d{2}:\d{2}$/.test(token)) {
    return token;
  }

  // Military time no colon (e.g. "1300")
  if (/^\d{3,4}$/.test(token)) {
    const h = parseInt(token.slice(0, -2), 10);
    const m = parseInt(token.slice(-2), 10);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  let lower = token.toLowerCase();

  let meridiem = null;
  if (lower.endsWith("pm") || lower.endsWith(" pm")) {
    meridiem = "pm";
    lower = lower.replace(/\s*pm$/, "").trim();
  } else if (lower.endsWith("am") || lower.endsWith(" am")) {
    meridiem = "am";
    lower = lower.replace(/\s*am$/, "").trim();
  } else if (lower.endsWith("p")) {
    meridiem = "pm";
    lower = lower.slice(0, -1).trim();
  } else if (lower.endsWith("a")) {
    meridiem = "am";
    lower = lower.slice(0, -1).trim();
  }

  let h, m;
  if (lower.includes(":")) {
    const parts = lower.split(":");
    h = Number(parts[0]);
    m = Number(parts[1]);
  } else {
    h = parseInt(lower, 10);
    m = 0;
  }
  
  if (isNaN(h) || isNaN(m)) return null;

  if (meridiem === "pm" && h !== 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;

  return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");
}

function parseTimeRange(timeStr) {
  if (!timeStr) return { start_time: null, end_time: null };

  const parts = timeStr.split(/\s*[-–—]\s*/);
  if (parts.length < 2) return { start_time: null, end_time: null };
  
  return {
    start_time: parseTo24h(parts[0]),
    end_time:   parseTo24h(parts[1])
  };
}

export function normalizeEntries(rawEntries) {
  const output = [];

  for (const entry of rawEntries) {
    const days = normalizeDays(entry.days_raw);
    const N = entry.times_raw.length;
    
    if (N === 0) {
      output.push({
        subject_code: entry.subject_code,
        subject_title: entry.subject_title,
        days: days,
        start_time: null,
        end_time: null,
        room: entry.rooms_raw && entry.rooms_raw.length > 0 ? entry.rooms_raw[0] : null
      });
      continue;
    }

    for (let i = 0; i < N; i++) {
      const { start_time, end_time } = parseTimeRange(entry.times_raw[i] || "");
      const room = entry.rooms_raw[i] !== undefined && entry.rooms_raw[i] !== "" 
                   ? entry.rooms_raw[i] 
                   : (entry.rooms_raw[0] !== undefined && entry.rooms_raw[0] !== "" ? entry.rooms_raw[0] : null);

      output.push({
        subject_code:  entry.subject_code,
        subject_title: entry.subject_title,
        days:         days,
        start_time:   start_time,
        end_time:     end_time,
        room:         room
      });
    }
  }

  return output;
}
