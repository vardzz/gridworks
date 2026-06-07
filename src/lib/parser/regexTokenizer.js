// src/lib/parser/regexTokenizer.js — Regex field extraction (PRD §9.1 Stage 1)
import { normalizeDays, normalizeTime } from "./normalizer";

// ── Regex patterns from PRD §9.1 ──────────────────────────────────────
const SUBJECT_CODE_RE = /\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/g;
const TIME_RANGE_RE =
  /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/g;
const DAYS_RE =
  /\b(MWF|TTh|T\/Th|MW|MTh|WTh|TR|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Th|Sa|Su|[MTWFS])\b/gi;
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
    const trimmed = line.trim();
    const codeIndex = trimmed.search(SUBJECT_CODE_RE);
    const hasSubjectCode = codeIndex >= 0 && codeIndex < 6;
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
    if (entry) {
      if (Array.isArray(entry)) {
        entries.push(...entry);
      } else {
        entries.push(entry);
      }
    }
  }

  return entries;
}

/**
 * Extracts individual fields from a text block using regex patterns.
 */
function extractFieldsFromBlock(block) {
  // Subject code
  const codeMatch = block.match(/\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/);
  const subject_code = codeMatch ? codeMatch[0].replace(/\s+/g, "") : null;

  // Create a copy of the block without the subject code to avoid matching it as room/etc.
  let remainingBlock = block;
  if (codeMatch) {
    remainingBlock = block.replace(codeMatch[0], "");
  }

  // Find all time ranges in this block
  const timeMatches = [...remainingBlock.matchAll(
    /(\d{1,2}:\d{2}\s*[APap][Mm]?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*[APap][Mm]?)/gi
  )];

  if (timeMatches.length === 0) {
    if (!subject_code) return null;
    return {
      subject_code,
      subject_title: extractTitle(block, subject_code),
      professor: extractProfessor(remainingBlock),
      room: null,
      days: [],
      start_time: null,
      end_time: null,
      color_override: null,
    };
  }

  // Find all room matches
  const roomMatches = [...remainingBlock.matchAll(
    /\b(?:COMLAB\s*\d|FIELD\d+|VRCCE-\d+|[A-Z]+-?\d{1,4}[A-Z]?)\b/gi
  )];
  const rooms = roomMatches.map((m) => m[0]);

  // Extract days from the block segment BEFORE the first time match (avoids section codes like 1CS-F)
  const firstTimeIndex = timeMatches[0].index;
  const daysBlock = remainingBlock.substring(0, firstTimeIndex);

  const dayMatches = daysBlock.match(
    /\b(MWF|TTh|T\/Th|MW|MTh|WTh|TR|MTWTHF|MTWTF|MTWRF|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Th|Sa|Su|[MTWFS])\b/gi
  );
  const days = dayMatches ? normalizeDays(dayMatches) : [];

  const professor = extractProfessor(remainingBlock);
  const subject_title = extractTitle(block, subject_code);

  // If multiple time slots exist, split them into separate schedule entries
  if (timeMatches.length > 1) {
    const splitEntries = [];
    for (let i = 0; i < timeMatches.length; i++) {
      const start_time = normalizeTime(timeMatches[i][1]);
      const end_time = normalizeTime(timeMatches[i][2]);

      // Pair day i with time i if available, otherwise reuse the first day/room
      const slotDays = days.length > i ? [days[i]] : (days.length > 0 ? [days[0]] : []);
      const slotRoom = rooms.length > i ? rooms[i] : (rooms.length > 0 ? rooms[0] : null);

      splitEntries.push({
        subject_code,
        subject_title,
        professor,
        room: slotRoom,
        days: slotDays,
        start_time,
        end_time,
        color_override: null,
      });
    }
    return splitEntries;
  }

  // Single time range case
  const start_time = normalizeTime(timeMatches[0][1]);
  const end_time = normalizeTime(timeMatches[0][2]);
  const room = rooms.length > 0 ? rooms[0] : null;

  return {
    subject_code,
    subject_title,
    professor,
    room,
    days,
    start_time,
    end_time,
    color_override: null,
  };
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
