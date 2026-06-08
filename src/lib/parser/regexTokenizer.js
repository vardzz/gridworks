// src/lib/parser/regexTokenizer.js — Tabular structure parser & Regex fallback

import { normalizeDays, normalizeTime } from "./normalizer";

// ── Regex patterns for OCR fallback ──────────────────────────────────────
const SUBJECT_CODE_RE = /\b([A-Z]{2,5}\s?\d{1,4}[A-Z]?)\b/g;
const TIME_RANGE_RE = /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—\/]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/gi;
const DAYS_RE = /\b(MWF|TTh|T\/Th|M\/Th|T\/F|MW|MTh|WTh|TR|TF|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Th|Sa|Su|[MTWFS])\b/gi;
const ROOM_RE = /\b(?:COMLAB\s*\d+|FIELD\s*\d+|VRCCE-?\d+|GK-?\d+|[A-Z]{2,5}\s?-?\d{1,4}[A-Z]?|\d{3,4})\b/gi;

/**
 * Parses raw text into schedule entries.
 * Attempts deterministic tabular parsing first (if tabs exist).
 * Falls back to OCR Token Clustering heuristic if no headers are found.
 *
 * @param {string} rawText — raw extracted text from PDF or OCR
 * @returns {Array<Object>} — array of raw or partial entry objects
 */
export function tokenize(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length > 0) {
    // 1. Column header detection
    const headerLine = lines[0];
    const headers = headerLine.split('\t').map(h => h.trim().toLowerCase());
    
    let COURSE_CODE_INDEX = -1;
    let COURSE_TITLE_INDEX = -1;
    let DAY_INDEX = -1;
    let TIME_INDEX = -1;
    let ROOM_INDEX = -1;

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (h.includes("course code") || h === "code" || h.includes("subject code") || h === "subj code") {
        COURSE_CODE_INDEX = i;
      } else if (h.includes("course description") || h === "description" || h === "subject" || h === "title" || h === "course title") {
        COURSE_TITLE_INDEX = i;
      } else if (h === "day" || h === "days") {
        DAY_INDEX = i;
      } else if (h === "time" || h === "time slot") {
        TIME_INDEX = i;
      } else if (h === "room" || h.includes("room no") || h === "venue") {
        ROOM_INDEX = i;
      }
    }

    if (COURSE_CODE_INDEX !== -1) {
      // Run tabular extraction
      const entries = [];
      let currentEntry = null;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const cells = row.split('\t').map(c => c.trim());

        const courseCode = COURSE_CODE_INDEX !== -1 && cells[COURSE_CODE_INDEX] ? cells[COURSE_CODE_INDEX] : null;

        if (courseCode && /\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/i.test(courseCode)) {
          // New Entry
          currentEntry = {
            course_code: courseCode,
            course_title: COURSE_TITLE_INDEX !== -1 && cells[COURSE_TITLE_INDEX] ? cells[COURSE_TITLE_INDEX] : null,
            days_raw: DAY_INDEX !== -1 && cells[DAY_INDEX] ? cells[DAY_INDEX] : null,
            times_raw: [],
            rooms_raw: []
          };
          
          if (TIME_INDEX !== -1 && cells[TIME_INDEX]) currentEntry.times_raw.push(cells[TIME_INDEX]);
          if (ROOM_INDEX !== -1 && cells[ROOM_INDEX]) currentEntry.rooms_raw.push(cells[ROOM_INDEX]);
          
          entries.push(currentEntry);
        } else if (currentEntry) {
          // Continuation row
          if (TIME_INDEX !== -1 && cells[TIME_INDEX]) currentEntry.times_raw.push(cells[TIME_INDEX]);
          if (ROOM_INDEX !== -1 && cells[ROOM_INDEX]) currentEntry.rooms_raw.push(cells[ROOM_INDEX]);
        }
      }
      return entries;
    }
  }

  // ── OCR Regex Fallback ──────────────────────────────────────────────
  return tokenizeHeuristic(rawText);
}

function tokenizeHeuristic(rawText) {
  const subjects = [];
  let match;
  SUBJECT_CODE_RE.lastIndex = 0;
  
  const roomPrefixes = ["BCH", "COMLAB", "FIELD", "VRCCE", "GK", "ROOM", "LAB"];

  while ((match = SUBJECT_CODE_RE.exec(rawText)) !== null) {
    const code = match[1];
    const after = rawText.substring(match.index + code.length, match.index + code.length + 10);
    if (/^\s*:\s*\d{2}/.test(after)) continue;
    const isRoom = roomPrefixes.some(prefix => code.toUpperCase().startsWith(prefix));
    if (isRoom) continue;
    if (/^\d/.test(code)) continue;

    subjects.push({ code, index: match.index });
  }

  if (subjects.length === 0) return [];

  const clusters = subjects.map((subj, i) => {
    const nextIndex = subjects[i + 1] ? subjects[i + 1].index : rawText.length;
    const block = rawText.substring(subj.index, nextIndex);
    return parseSubjectBlock(subj.code, block);
  });

  return clusters.flat().filter(Boolean);
}

function parseSubjectBlock(subject_code, block) {
  const segments = [];
  let match;
  
  const professor = extractProfessor(block);
  const subject_title = extractTitle(block, subject_code);
  const cleanCode = subject_code.replace(/\s+/g, "");

  TIME_RANGE_RE.lastIndex = 0;
  while ((match = TIME_RANGE_RE.exec(block)) !== null) {
    const timeIndex = match.index;
    const windowStart = Math.max(0, timeIndex - 40);
    const windowEnd = Math.min(block.length, timeIndex + match[0].length + 60);
    const localWindow = block.substring(windowStart, windowEnd);
    
    const roomMatch = localWindow.match(ROOM_RE);
    const room = roomMatch ? roomMatch[0] : null;
    
    const dayMatches = localWindow.match(DAYS_RE);
    const days = dayMatches ? normalizeDays(dayMatches) : [];
    
    segments.push({
      subject_code: cleanCode,
      subject_title,
      professor,
      room,
      days,
      start_time: normalizeTime(match[1]),
      end_time: normalizeTime(match[2]),
      color_override: null
    });
  }

  if (segments.length === 0) {
    const roomMatch = block.match(ROOM_RE);
    const dayMatches = block.match(DAYS_RE);
    return [{
      subject_code: cleanCode,
      subject_title,
      professor,
      room: roomMatch ? roomMatch[0] : null,
      days: dayMatches ? normalizeDays(dayMatches) : [],
      start_time: null,
      end_time: null,
      color_override: null
    }];
  }

  return segments;
}

function extractTitle(block, subject_code) {
  if (!subject_code) return null;
  const codeIndex = block.indexOf(subject_code);
  const afterCode = block.substring(codeIndex + subject_code.length).trim();

  const titleEnd = afterCode.search(
    /\d{1,2}:\d{2}|\b(MWF|TTh|MW|MTh|WTh|TR|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Th|Sa|Su|[MTWFS])\b/i
  );

  let subject_title = null;
  if (titleEnd > 0) {
    subject_title = afterCode.substring(0, titleEnd).trim();
  } else if (afterCode.length > 0 && afterCode.length < 80) {
    subject_title = afterCode;
  }

  if (subject_title) {
    subject_title = subject_title.replace(/\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$/, "").trim();
  }

  return subject_title ? subject_title.replace(/[-–—,;]+$/, "").trim() : null;
}

function extractProfessor(remainingBlock) {
  const profMatch = remainingBlock.match(
    /(?:Prof\.?|Dr\.?|Engr\.?|Instructor:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  );
  return profMatch ? profMatch[0].trim() : null;
}
