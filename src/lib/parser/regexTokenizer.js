// src/lib/parser/regexTokenizer.js — Regex field extraction (PRD §9.1 Stage 1)
import { normalizeDays, normalizeTime } from "./normalizer";

// ── Regex patterns from PRD §9.1 ──────────────────────────────────────
const SUBJECT_CODE_RE = /[A-Z]{2,4}\s?\d{3,4}[A-Z]?/g;
const TIME_RANGE_RE =
  /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/g;
const DAYS_RE =
  /\b(MWF|TTh|T\/Th|MW|TR|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|[MTWFS])\b/gi;
const ROOM_RE = /\b[A-Z]+-?\d{3,4}[A-Z]?\b/g;

/**
 * Splits raw text into lines, groups lines into entry blocks,
 * and extracts fields using regex patterns.
 *
 * A new block starts when a subject code pattern is detected on a line.
 *
 * @param {string} rawText — raw extracted text from PDF or OCR
 * @returns {Array<Object>} — array of partial entry objects (no ids yet)
 */
export function tokenize(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText.split(/\n/).filter((l) => l.trim());
  const blocks = [];
  let currentBlock = [];

  for (const line of lines) {
    const hasSubjectCode = SUBJECT_CODE_RE.test(line);
    SUBJECT_CODE_RE.lastIndex = 0; // Reset regex state

    if (hasSubjectCode && currentBlock.length > 0) {
      blocks.push(currentBlock.join(" "));
      currentBlock = [line];
    } else if (hasSubjectCode) {
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join(" "));
  }

  // Parse each block into a partial entry
  const entries = [];

  for (const block of blocks) {
    const entry = extractFieldsFromBlock(block);
    if (entry) entries.push(entry);
  }

  return entries;
}

/**
 * Extracts individual fields from a text block using regex patterns.
 */
function extractFieldsFromBlock(block) {
  // Subject code
  const codeMatch = block.match(/[A-Z]{2,4}\s?\d{3,4}[A-Z]?/);
  const subject_code = codeMatch ? codeMatch[0].replace(/\s+/g, "") : null;

  // Create a copy of the block without the subject code to avoid matching it as room/etc.
  let remainingBlock = block;
  if (codeMatch) {
    remainingBlock = block.replace(codeMatch[0], "");
  }

  // Time range
  const timeMatch = remainingBlock.match(
    /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/
  );
  const start_time = timeMatch ? normalizeTime(timeMatch[1]) : null;
  const end_time = timeMatch ? normalizeTime(timeMatch[2]) : null;

  // Days
  const dayMatches = remainingBlock.match(
    /\b(MWF|TTh|T\/Th|MW|TR|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|[MTWFS])\b/gi
  );
  const days = dayMatches ? normalizeDays(dayMatches) : [];

  // Room
  const roomMatch = remainingBlock.match(
    /\b(?:COMLAB\s*\d|FIELD\d+|VRCCE-\d+|[A-Z]+-?\d{1,4}[A-Z]?)\b/i
  );
  const room = roomMatch ? roomMatch[0] : null;

  // Subject title — heuristic: text between code and time/days, or remainder
  let subject_title = null;
  if (subject_code) {
    const codeIndex = block.indexOf(subject_code);
    const afterCode = block.substring(codeIndex + subject_code.length).trim();
    // Take text up to the first time or day pattern
    const titleEnd = afterCode.search(
      /\d{1,2}:\d{2}|\b(MWF|TTh|MW|Mon|Tue|Wed|Thu|Fri|Sat|Sun|[MTWFS])\b/i
    );
    if (titleEnd > 0) {
      subject_title = afterCode.substring(0, titleEnd).trim();
    } else if (afterCode.length > 0 && afterCode.length < 80) {
      subject_title = afterCode;
    }

    // Strip trailing units if present (two digits at the end of description, e.g. " 2 1" or " 3 0")
    if (subject_title) {
      subject_title = subject_title.replace(/\s+\d\s+\d$/, "").trim();
    }
  }

  // Professor — heuristic: look for patterns like "Prof.", "Dr.", or capitalized names
  const profMatch = remainingBlock.match(
    /(?:Prof\.?|Dr\.?|Engr\.?|Instructor:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  );
  const professor = profMatch ? profMatch[0].trim() : null;

  // Only return if we extracted at least a subject code or time
  if (!subject_code && !start_time) return null;

  return {
    subject_code,
    subject_title: subject_title
      ? subject_title.replace(/[-–—,;]+$/, "").trim()
      : null,
    professor,
    room,
    days,
    start_time,
    end_time,
    color_override: null,
  };
}
