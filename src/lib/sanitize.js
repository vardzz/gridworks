// src/lib/sanitize.js — Input sanitization helpers (PRD §12.3)

/**
 * Strips HTML tags, collapses whitespace, trims, and enforces max length.
 */
export function sanitizeString(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")      // Strip HTML tags
    .replace(/\s+/g, " ")         // Collapse whitespace
    .trim()                       // Trim leading/trailing
    .substring(0, maxLength);     // Enforce max length
}

/**
 * Sanitizes all text fields on a schedule entry.
 * Character limits per PRD §12.3:
 *   subject_code: 12, subject_title: 80, professor: 60, room: 20
 */
export function sanitizeEntry(entry) {
  return {
    ...entry,
    subject_code: sanitizeString(entry.subject_code || entry.course_code || "", 12),
    subject_title: sanitizeString(entry.subject_title || entry.course_title || "", 80),
    professor: sanitizeString(entry.professor || "", 60),
    room: sanitizeString(entry.room || "", 20),
    days: Array.isArray(entry.days) ? entry.days : [],
    start_time: entry.start_time || "",
    end_time: entry.end_time || "",
  };
}
