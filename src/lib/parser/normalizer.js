// src/lib/parser/normalizer.js — Normalizes raw structured entries into schema objects

const COMPOUND_DAYS = {
  'mth': ['Monday','Thursday'],   'mwf': ['Monday','Wednesday','Friday'],
  'tf':  ['Tuesday','Friday'],    'tth': ['Tuesday','Thursday'],
  'ttf': ['Tuesday','Thursday','Friday'],
  't/th':['Tuesday','Thursday'],  'm/th':['Monday','Thursday'],
  't/f': ['Tuesday','Friday'],    'm/w': ['Monday','Wednesday'],
  'mw':  ['Monday','Wednesday'],  'wf':  ['Wednesday','Friday'],
  'w/w': ['Wednesday'],           // same day twice = once
  'mtwthf': ['Monday','Tuesday','Wednesday','Thursday','Friday'],
};

const SINGLE_DAYS = {
  'm': 'Monday',  't': 'Tuesday',  'w': 'Wednesday',
  'th': 'Thursday', 'f': 'Friday', 's': 'Saturday', 'su': 'Sunday'
};

const WORD_DAYS = {
  'mon':'Monday',  'monday':'Monday',
  'tue':'Tuesday', 'tuesday':'Tuesday',
  'wed':'Wednesday','wednesday':'Wednesday',
  'thu':'Thursday','thursday':'Thursday',
  'fri':'Friday',  'friday':'Friday',
  'sat':'Saturday','saturday':'Saturday',
  'sun':'Sunday',  'sunday':'Sunday'
};

export function normalizeDays(raw) {
  if (!raw) return null;

  // Normalize: lowercase, remove dots, collapse whitespace
  const lower = raw.toLowerCase().replace(/\./g, '').trim();

  // Check compound map first (handles "MTh", "MWF", "T/Th", "M/Th")
  const compoundKey = lower.replace(/[\s\/]/g, '');
  if (COMPOUND_DAYS[compoundKey]) return COMPOUND_DAYS[compoundKey];

  // Split on / , whitespace into tokens
  const tokens = lower.split(/[\/,\s]+/).filter(Boolean);
  const result = [];

  for (const token of tokens) {
    if (WORD_DAYS[token]) {
      result.push(WORD_DAYS[token]);
      continue;
    }

    // Greedy character walk: match "th" and "su" before single letters
    let i = 0;
    while (i < token.length) {
      const two = token.slice(i, i + 2);
      const one = token.slice(i, i + 1);
      if (SINGLE_DAYS[two]) {
        result.push(SINGLE_DAYS[two]);
        i += 2;
      } else if (SINGLE_DAYS[one]) {
        result.push(SINGLE_DAYS[one]);
        i += 1;
      } else {
        i += 1; // unrecognized, skip
      }
    }
  }

  // Deduplicate while preserving order
  return [...new Set(result)];
}

function parseTo24h(token) {
  if (!token || typeof token !== 'string') return null;
  let t = token.trim().toLowerCase().replace(/\s+/g, '');

  // Already 24h with colon: "13:00"
  if (/^\d{2}:\d{2}$/.test(t)) return t;

  // Military time no colon: "1300"
  if (/^\d{3,4}$/.test(t)) {
    const h = parseInt(t.slice(0, -2), 10);
    const m = parseInt(t.slice(-2), 10);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  // Extract meridiem
  let meridiem = null;
  if (t.endsWith('pm')) { meridiem = 'pm'; t = t.slice(0,-2); }
  else if (t.endsWith('am')) { meridiem = 'am'; t = t.slice(0,-2); }
  else if (t.endsWith('p'))  { meridiem = 'pm'; t = t.slice(0,-1); }
  else if (t.endsWith('a'))  { meridiem = 'am'; t = t.slice(0,-1); }

  const parts = t.split(':');
  let h = parseInt(parts[0], 10);
  let m = parts[1] !== undefined ? parseInt(parts[1], 10) : 0;
  if (isNaN(h) || isNaN(m)) return null;

  // No meridiem + hour < 8 → assume PM (afternoon classes)
  // No meridiem + hour >= 8 → assume AM (morning classes)
  if (meridiem === null) meridiem = h < 8 ? 'pm' : 'am';

  if (meridiem === 'pm' && h !== 12) h += 12;
  if (meridiem === 'am' && h === 12) h = 0;

  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { start_time: null, end_time: null };
  }
  // Split on any dash variant surrounded by optional whitespace
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
        course_code: entry.course_code,
        course_title: entry.course_title,
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
        course_code:  entry.course_code,
        course_title: entry.course_title,
        days:         days,
        start_time:   start_time,
        end_time:     end_time,
        room:         room
      });
    }
  }

  return output;
}
