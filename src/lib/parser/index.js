// src/lib/parser/index.js — Main parseFile() orchestrator

import { extractTextFromPDF } from "./pdfExtractor";
import { extractTextFromImage } from "./ocrExtractor";
import { tokenize } from "./regexTokenizer";
import { normalizeEntries } from "./normalizer";
import { scoreDocument } from "./confidenceScorer";
import { preCheckIsRegistrationForm } from "./llmFallback";
import { sanitizeEntry } from "@/lib/sanitize";

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
  let rawLines = [];
  let isOCR = isImage;

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
    if (rawText) {
      rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    }
  } else {
    try {
      rawLines = await extractTextFromPDF(file);
    } catch (error) {
      if (error.code === "IMAGE_BASED_PDF") {
        console.warn("Pre-flight failed: Image-based PDF detected. Routing to OCR.");
        try {
          const rawText = await extractTextFromImage(file, onProgress);
          if (rawText) {
            rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
            isOCR = true;
          }
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

  if (!rawLines || rawLines.length === 0) {
    console.error("[parser] Extracted raw lines are empty");
    return { entries: [], confidence: 0, error: "extraction_failed" };
  }

  console.log(`[parser] Extracted ${rawLines.length} lines`);

  // ── 5. Tokenize ───────────────────────────────────────────────────
  const rawEntries = tokenize(rawLines, isOCR);

  // ── 6. Normalize ──────────────────────────────────────────────────
  const finalEntries = normalizeEntries(rawEntries);

  console.log("[parser] Raw entries:", rawEntries.length);
  console.log("[parser] Final entries:", finalEntries.length);

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

