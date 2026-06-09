// src/lib/parser/index.js — Main parseFile() orchestrator

import { extractTextFromImage } from "./ocrExtractor";
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

  // ── 3 & 4. Extraction via Next.js Backend API (pdf2json) ────────────────
  let rawEntries = [];
  
  if (isImage) {
    const rawText = await extractTextFromImage(file, onProgress);
    if (rawText) {
      // Legacy image handling (if needed, but usually image uploads will fail the new backend unless supported)
      rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      // Fallback local tokenization for OCR could go here if we retained it, 
      // but the prompt mandates API migration.
    }
  } else {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
         console.error("API Extraction failed:", result.error);
         return { entries: [], confidence: 0, error: "extraction_failed" };
      }
      
      rawEntries = result.data;
    } catch (error) {
      console.error("Network or API extraction failed:", error);
      return { entries: [], confidence: 0, error: "extraction_failed" };
    }
  }

  if (!rawEntries || rawEntries.length === 0) {
    console.error("[parser] Extracted entries are empty");
    return { entries: [], confidence: 0, error: "extraction_failed" };
  }

  // ── 6. Normalize (Legacy fallback, though API returns mostly clean data) ──
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

