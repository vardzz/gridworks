// src/lib/parser/regexTokenizer.js — Regex field extraction (PRD §9.1 Stage 1)
import { normalizeDays, normalizeTime } from "./normalizer";

// ── Regex patterns from PRD §9.1 ──────────────────────────────────────
const SUBJECT_CODE_RE = /\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/g;
const TIME_RANGE_RE = /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/gi;
const DAYS_RE = /\b(MWF|TTh|T\/Th|MW|MTh|WTh|TR|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Th|Sa|Su|[MTWFS])\b/gi;
const ROOM_RE = /\b(?:COMLAB\s*\d|FIELD\d+|VRCCE-\d+|[A-Z]+-?\d{1,4}[A-Z]?)\b/gi;

/**
 * Parses raw text into schedule entries using Token Clustering Maps 
 * and Micro-Segment Parsing.
 *
 * @param {string} rawText — raw extracted text from PDF or OCR
 * @returns {Array<Object>} — array of partial entry objects
 */
export function tokenize(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  // 1. Identify all anchors (Subject Codes)
  const subjects = [];
  let match;
  SUBJECT_CODE_RE.lastIndex = 0;
  while ((match = SUBJECT_CODE_RE.exec(rawText)) !== null) {
    subjects.push({ code: match[0], index: match.index });
  }

  if (subjects.length === 0) return [];

  // 2. Proximity Indexing
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

  // 3. Sequential Pairing & Micro-Segment Parsing
  TIME_RANGE_RE.lastIndex = 0;
  while ((match = TIME_RANGE_RE.exec(block)) !== null) {
    const timeIndex = match.index;
    
    // Create bounding window (40 chars before, 60 after)
    const windowStart = Math.max(0, timeIndex - 40);
    const windowEnd = Math.min(block.length, timeIndex + match[0].length + 60);
    const localWindow = block.substring(windowStart, windowEnd);
    
    // Local Matching strictly within window
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

  // If no time matches, bind loose metadata to the subject
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
    subject_title = subject_title.replace(/\s+\d\s+\d$/, "").trim();
  }

  return subject_title ? subject_title.replace(/[-–—,;]+$/, "").trim() : null;
}

function extractProfessor(remainingBlock) {
  const profMatch = remainingBlock.match(
    /(?:Prof\.?|Dr\.?|Engr\.?|Instructor:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  );
  return profMatch ? profMatch[0].trim() : null;
}
