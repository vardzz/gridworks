const COMPOUND_DAYS = {
  'mth':    ['Monday', 'Thursday'],
  'mwf':    ['Monday', 'Wednesday', 'Friday'],
  'tf':     ['Tuesday', 'Friday'],
  'tth':    ['Tuesday', 'Thursday'],
  'ttf':    ['Tuesday', 'Thursday', 'Friday'],
  'mw':     ['Monday', 'Wednesday'],
  'wf':     ['Wednesday', 'Friday'],
  'ww':     ['Wednesday'],          // W / W → deduplicated
  'sasa':   ['Saturday'],           // Sa / Sa → deduplicated
  'susu':   ['Sunday'],             // Su / Su → deduplicated
  'ss':     ['Saturday'],           // S / S
  'mtwthf': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};
 
// Single token map — greedy two-char match first, then one-char
const SINGLE_DAYS_2 = {
  'th': 'Thursday',
  'sa': 'Saturday',
  'su': 'Sunday',
};
 
const SINGLE_DAYS_1 = {
  'm': 'Monday',
  't': 'Tuesday',
  'w': 'Wednesday',
  'f': 'Friday',
  's': 'Saturday',
};
 
const WORD_DAYS = {
  'mon':  'Monday',    'monday':    'Monday',
  'tue':  'Tuesday',   'tuesday':   'Tuesday',
  'wed':  'Wednesday', 'wednesday': 'Wednesday',
  'thu':  'Thursday',  'thursday':  'Thursday',
  'fri':  'Friday',    'friday':    'Friday',
  'sat':  'Saturday',  'saturday':  'Saturday',
  'sun':  'Sunday',    'sunday':    'Sunday',
};
 
/**
 * Converts a raw day string from the registration form into an array
 * of full day name strings.
 *
 * @param {string|null} raw — e.g. "MTh", "W / W", "M / Th", "Sa / Sa"
 * @returns {string[]} — e.g. ["Monday","Thursday"], ["Wednesday"], ["Saturday"]
 */
export function normalizeDays(raw) {
  if (!raw || typeof raw !== 'string') return [];
 
  // Step 1: lowercase, remove dots, trim
  const lower = raw.toLowerCase().replace(/\./g, '').trim();
 
  // Step 2: build compound lookup key — strip spaces, slashes, commas
  const compoundKey = lower.replace(/[\s\/,]+/g, '');
  if (COMPOUND_DAYS[compoundKey]) {
    return COMPOUND_DAYS[compoundKey];
  }
 
  // Step 3: split into individual tokens on / , or whitespace
  const tokens = lower.split(/[\/,\s]+/).filter(Boolean);
  const result = [];
 
  for (const token of tokens) {
    // Try full word match (e.g. "monday", "mon", "sat")
    if (WORD_DAYS[token]) {
      result.push(WORD_DAYS[token]);
      continue;
    }
 
    // Greedy character walk — match 2-char tokens before 1-char
    // Handles fused codes like "mth" that didn't match compound map
    let i = 0;
    while (i < token.length) {
      const two = token.slice(i, i + 2);
      const one = token.slice(i, i + 1);
 
      if (SINGLE_DAYS_2[two]) {
        result.push(SINGLE_DAYS_2[two]);
        i += 2;
      } else if (SINGLE_DAYS_1[one]) {
        result.push(SINGLE_DAYS_1[one]);
        i += 1;
      } else {
        i += 1; // unrecognized character, skip
      }
    }
  }
 
  // Step 4: deduplicate while preserving order
  // This collapses "W / W" → ["Wednesday","Wednesday"] → ["Wednesday"]
  // and "Sa / Sa" → ["Saturday","Saturday"] → ["Saturday"]
  return [...new Set(result)];
}
 
// ─────────────────────────────────────────────────────────────────────────────
// TIME NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Converts a single time token to 24-hour HH:MM format.
 * Handles: "1:00pm", "10:00am", "1:00 PM", "10:00 AM", "13:00", "1300"
 *
 * @param {string} token — a single time string (not a range)
 * @returns {string|null} — "HH:MM" or null if unparseable
 */
export function parseTo24h(token) {
  if (!token || typeof token !== 'string') return null;
 
  // Strip all internal whitespace so "10:00 AM" becomes "10:00am"
  let t = token.trim().toLowerCase().replace(/\s+/g, '');
 
  // Already 24h with colon: "13:00"
  if (/^\d{2}:\d{2}$/.test(t)) return t;
 
  // Military time no colon: "1300", "0830"
  if (/^\d{3,4}$/.test(t)) {
    const h = parseInt(t.slice(0, -2), 10);
    const m = parseInt(t.slice(-2), 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
 
  // Extract and remove meridiem suffix
  let meridiem = null;
  if (t.endsWith('pm'))      { meridiem = 'pm'; t = t.slice(0, -2); }
  else if (t.endsWith('am')) { meridiem = 'am'; t = t.slice(0, -2); }
  else if (t.endsWith('p'))  { meridiem = 'pm'; t = t.slice(0, -1); }
  else if (t.endsWith('a'))  { meridiem = 'am'; t = t.slice(0, -1); }
 
  // Parse hours and minutes
  const colonIdx = t.indexOf(':');
  let h, m;
  if (colonIdx !== -1) {
    h = parseInt(t.slice(0, colonIdx), 10);
    m = parseInt(t.slice(colonIdx + 1), 10);
  } else {
    h = parseInt(t, 10);
    m = 0;
  }
 
  if (isNaN(h)) return null;
  if (isNaN(m)) m = 0;
 
  // No meridiem detected — infer from hour value
  // Hours 1-7 with no meridiem are almost certainly PM (afternoon classes)
  // Hours 8-12 with no meridiem are almost certainly AM (morning classes)
  if (meridiem === null) {
    meridiem = (h >= 1 && h <= 7) ? 'pm' : 'am';
  }
 
  // Convert to 24h
  if (meridiem === 'pm' && h !== 12) h += 12;
  if (meridiem === 'am' && h === 12) h = 0;  // midnight edge case
 
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
 
/**
 * Splits a time range string into start and end 24h times.
 * Handles: "1:00pm - 2:30pm", "10:00am - 1:00pm", "7:00am-9:00am"
 *
 * @param {string} timeStr — a single time range string
 * @returns {{ start_time: string|null, end_time: string|null }}
 */
export function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { start_time: null, end_time: null };
  }
 
  // Split on any dash variant with optional surrounding whitespace
  // Handles: " - ", "-", "–" (en-dash), "—" (em-dash)
  const parts = timeStr.split(/\s*[-–—]\s*/);
 
  if (parts.length < 2) {
    return { start_time: null, end_time: null };
  }
 
  return {
    start_time: parseTo24h(parts[0].trim()),
    end_time:   parseTo24h(parts[1].trim()),
  };
}
 
// ─────────────────────────────────────────────────────────────────────────────
// MULTI-SLOT SPLITTING
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Detects the inline multi-slot separator from time and room values.
 * Checks that the separator appears in BOTH values before trusting it.
 *
 * From the registration form, the separator is always " / " (space-slash-space).
 * A bare "/" without spaces is part of a room name like "VRCCS-2" — ignore it.
 *
 * @param {string} timeValue
 * @param {string} roomValue
 * @returns {string|null} — the separator string, or null if single slot
 */
function detectInlineSeparator(timeValue, roomValue) {
  // Only " / " (with spaces) is a valid multi-slot separator
  // Never split on bare "/" — that appears inside room names like "VRCCS-2"
  const SEPARATOR = ' / ';
 
  const timeHasIt = timeValue?.includes(SEPARATOR);
  const roomHasIt = roomValue?.includes(SEPARATOR);
 
  // Strongest signal: separator in BOTH time and room
  if (timeHasIt && roomHasIt) return SEPARATOR;
 
  // Acceptable: separator in time only (room may be single for both slots)
  if (timeHasIt) return SEPARATOR;
 
  return null;
}
 
/**
 * Splits a raw entry with multiple time slots into separate output entries.
 *
 * @param {object} rawEntry — { course_code, course_title, days_raw, times_raw[], rooms_raw[] }
 * @returns {object[]} — array of normalized output entries, one per time slot
 */
function splitAndNormalizeEntry(rawEntry) {
  const days = normalizeDays(rawEntry.days_raw);
  const output = [];
 
  // times_raw and rooms_raw are arrays built by the tokenizer.
  // Each item may itself be a multi-slot string needing further splitting.
  // Flatten all time strings into individual slot strings first.
 
  const allTimeSlots = [];
  const allRoomSlots = [];
 
  for (let i = 0; i < rawEntry.times_raw.length; i++) {
    const timeVal = rawEntry.times_raw[i] ?? '';
    const roomVal = rawEntry.rooms_raw[i] ?? rawEntry.rooms_raw[0] ?? '';
 
    const sep = detectInlineSeparator(timeVal, roomVal);
 
    if (sep) {
      // Split both by the separator and pair by index
      const timeParts = timeVal.split(sep).map(s => s.trim()).filter(Boolean);
      const roomParts = roomVal.split(sep).map(s => s.trim()).filter(Boolean);
 
      timeParts.forEach((t, idx) => {
        allTimeSlots.push(t);
        // Pair with room at same index; fall back to first room if not enough rooms
        allRoomSlots.push(roomParts[idx] ?? roomParts[0] ?? '');
      });
    } else {
      allTimeSlots.push(timeVal);
      allRoomSlots.push(roomVal);
    }
  }
 
  // Build one output entry per slot
  for (let i = 0; i < allTimeSlots.length; i++) {
    const { start_time, end_time } = parseTimeRange(allTimeSlots[i]);
    const room = allRoomSlots[i] ?? null;
 
    output.push({
      course_code:  rawEntry.course_code  ?? null,
      course_title: rawEntry.course_title ?? null,
      days,
      start_time,
      end_time,
      room: room || null,
    });
  }
 
  // Edge case: entry had no time data at all
  if (output.length === 0) {
    output.push({
      course_code:  rawEntry.course_code  ?? null,
      course_title: rawEntry.course_title ?? null,
      days,
      start_time:   null,
      end_time:     null,
      room:         rawEntry.rooms_raw[0] ?? null,
    });
  }
 
  return output;
}