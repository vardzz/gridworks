// src/lib/parser/confidenceScorer.js — Score entries, produce warnings list (PRD §9.1 Stage 2)

const REQUIRED_FIELDS = ["subject_code", "days", "start_time", "end_time"];
const OPTIONAL_FIELDS = ["subject_title", "professor", "room"];

/**
 * Scores a single entry based on how many required/optional fields are present.
 * Required fields = 80% of score, optional fields = 20%.
 *
 * @param {Object} entry
 * @returns {number} — 0.0 to 1.0
 */
export function scoreEntry(entry) {
  let requiredHits = 0;
  for (const field of REQUIRED_FIELDS) {
    if (isFieldPresent(entry, field)) requiredHits++;
  }

  let optionalHits = 0;
  for (const field of OPTIONAL_FIELDS) {
    if (isFieldPresent(entry, field)) optionalHits++;
  }

  const requiredScore = (requiredHits / REQUIRED_FIELDS.length) * 0.8;
  const optionalScore = (optionalHits / OPTIONAL_FIELDS.length) * 0.2;

  return requiredScore + optionalScore;
}

/**
 * Returns the mean confidence score across all entries.
 *
 * @param {Array<Object>} entries
 * @returns {number} — 0.0 to 1.0, or 0 if empty
 */
export function scoreDocument(entries) {
  if (!entries || entries.length === 0) return 0;

  const total = entries.reduce((sum, entry) => sum + scoreEntry(entry), 0);
  return total / entries.length;
}

/**
 * Returns an array of field names that are null, empty, or missing.
 * Used by the review screen to highlight uncertain fields with ⚠.
 *
 * @param {Object} entry
 * @returns {string[]}
 */
export function getWarnings(entry) {
  const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
  return allFields.filter((field) => !isFieldPresent(entry, field));
}

/**
 * Checks whether a field has a meaningful value.
 */
function isFieldPresent(entry, field) {
  const value = entry[field];
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}
