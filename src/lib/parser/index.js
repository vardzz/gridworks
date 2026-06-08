// src/lib/parser/index.js — Main parseFile() orchestrator

import { extractTextFromPDF } from "./pdfExtractor";
import { extractTextFromImage } from "./ocrExtractor";
import { tokenize } from "./regexTokenizer";
import { normalizeEntries } from "./normalizer";
import { scoreDocument } from "./confidenceScorer";
import { preCheckIsRegistrationForm } from "./llmFallback";
import { sanitizeEntry } from "@/lib/sanitize";

/**
 * Converts raw plaintext from OCR into a pseudo-2D structured object.
 * Treats each line as a row, splitting by tabs or 2+ spaces.
 * 
 * @param {string} rawText 
 * @returns {Object} { headers: string[], rows: Object[] }
 */
function convertOCRToStructuredData(rawText) {
  if (!rawText) return { headers: [], rows: [] };
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(/\t|\s{2,}/).map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/\t|\s{2,}/).map(c => c.trim());
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = cells[j] || "";
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Full parsing pipeline orchestrator.
 *
 * @param {File} file
 * @param {Object} options
 * @param {function} options.onProgress — OCR progress callback (0-100)
 * @param {boolean} options.skipPreCheck — skip Gemini image pre-check
 * @returns {Promise<Object>} — { entries, confidence, error }
 */
export async function parseFile(file, options = {}) {
  const { onProgress, skipPreCheck = false } = options;

  // ── 1. Validate MIME type ─────────────────────────────────────────
  const validTypes = ["application/pdf", "image/png", "image/jpeg"];
  if (!validTypes.includes(file.type)) {
    return { entries: [], confidence: 0, error: "unsupported_type" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { entries: [], confidence: 0, error: "file_too_large" };
  }

  const isImage = file.type.startsWith("image/");
  let structuredData = null;

  // ── 2. Image pre-check ────────────────────────────────────────────
  if (isImage && !skipPreCheck) {
    const check = await preCheckIsRegistrationForm(file);
    if (!check.isValid) {
      return { entries: [], confidence: 0, error: "not_a_registration_form" };
    }
  }

  // ── 3 & 4. Extraction ─────────────────────────────────────────────
  if (isImage) {
    const rawText = await extractTextFromImage(file, onProgress);
    structuredData = convertOCRToStructuredData(rawText);
  } else {
    try {
      structuredData = await extractTextFromPDF(file);
    } catch (error) {
      if (error.code === "IMAGE_BASED_PDF") {
        console.warn("Pre-flight failed: Image-based PDF detected. Routing to OCR.");
        try {
          const rawText = await extractTextFromImage(file, onProgress);
          structuredData = convertOCRToStructuredData(rawText);
        } catch (err) {
          console.error("OCR failed on PDF:", err);
          return { entries: [], confidence: 0, error: "extraction_failed" };
        }
      } else {
        console.error("PDF extraction failed:", error);
        return { entries: [], confidence: 0, error: "extraction_failed" };
      }
    }
  }

  if (!structuredData || !structuredData.rows || structuredData.rows.length === 0) {
    return { entries: [], confidence: 0, error: "extraction_failed" };
  }

  // ── 5. Tokenize ───────────────────────────────────────────────────
  const rawEntries = tokenize(structuredData);

  // ── 6. Normalize ──────────────────────────────────────────────────
  const finalEntries = normalizeEntries(rawEntries);

  // ── 7 & 8. Assign IDs and sanitize ────────────────────────────────
  const sanitizedEntries = finalEntries.map((entry) => {
    const sanitized = sanitizeEntry(entry);
    return {
      ...sanitized,
      id: crypto.randomUUID(),
      color_override: null,
    };
  });

  // ── 9. Score ──────────────────────────────────────────────────────
  const confidence = scoreDocument(sanitizedEntries);

  // ── 10. Return ────────────────────────────────────────────────────
  return {
    entries: sanitizedEntries,
    confidence,
    error: null,
  };
}
