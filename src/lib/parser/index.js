// src/lib/parser/index.js — Main parseFile() orchestrator (PRD §9 full pipeline)
import { extractTextFromPDF } from "./pdfExtractor";
import { extractTextFromImage } from "./ocrExtractor";
import { tokenize } from "./regexTokenizer";
import { scoreDocument } from "./confidenceScorer";
import { preCheckIsSchedule, extractWithLLM } from "./llmFallback";
import { sanitizeEntry } from "@/lib/sanitize";

/**
 * Full parsing pipeline orchestrator.
 *
 * Pipeline order:
 *   1. Validate MIME type
 *   2. (Image only) Pre-check if it's a schedule via Gemini
 *   3. Extract raw text (PDF → pdf.js, Image → Tesseract.js)
 *   4. Empty PDF detection → fallback to OCR
 *   5. Regex tokenization
 *   6. Confidence scoring
 *   7. LLM fallback if confidence < 0.7
 *   8. Assign UUIDs and sanitize
 *
 * @param {File} file
 * @param {Object} options
 * @param {function} options.onProgress — OCR progress callback (0-100)
 * @param {boolean} options.skipLLM — skip LLM fallback
 * @param {boolean} options.skipPreCheck — skip Gemini image pre-check
 * @returns {Promise<Object>} — { entries, confidence, rawText, sourceType, error }
 */
export async function parseFile(file, options = {}) {
  const { onProgress, skipLLM = false, skipPreCheck = false } = options;

  // ── 1. Validate MIME type ─────────────────────────────────────────
  const validTypes = ["application/pdf", "image/png", "image/jpeg"];
  if (!validTypes.includes(file.type)) {
    return {
      entries: [],
      confidence: 0,
      rawText: "",
      sourceType: null,
      error: "unsupported_type",
    };
  }

  // File size guard: 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return {
      entries: [],
      confidence: 0,
      rawText: "",
      sourceType: null,
      error: "file_too_large",
    };
  }

  const isImage = file.type.startsWith("image/");
  const sourceType = isImage ? "image" : "pdf";

  // ── 2. Image pre-check ────────────────────────────────────────────
  if (isImage && !skipPreCheck) {
    const check = await preCheckIsSchedule(file);
    if (!check.isSchedule || (check.confidence !== undefined && check.confidence < 0.75)) {
      return {
        entries: [],
        confidence: 0,
        rawText: "",
        sourceType,
        error: "not_a_schedule",
      };
    }
  }

  // ── 3. Extract raw text ───────────────────────────────────────────
  let rawText = "";

  if (isImage) {
    rawText = await extractTextFromImage(file, onProgress);
  } else {
    rawText = await extractTextFromPDF(file);
  }

  // ── 4. Empty PDF detection — fallback to OCR ──────────────────────
  if (!isImage) {
    // Heuristic Vector Validation: Check for actual valid anchors
    const timeAnchorMatches = rawText.match(/((?:1[0-2]|0?[1-9]):[0-5][0-9])/g);
    const subjectMatches = rawText.match(/\b[A-Z]{2,5}\s?\d{1,4}[A-Z]?\b/g);
    const hasValidText = (timeAnchorMatches && timeAnchorMatches.length > 0) || 
                         (subjectMatches && subjectMatches.length > 0);
    
    const isJunkBytecode = rawText.includes("") || rawText.replace(/\s+/g, "").length < 20;

    if (!hasValidText || isJunkBytecode || (rawText.trim().length < 50 && file.size > 100 * 1024)) {
      console.warn("Pre-flight failed: Image-based or unreadable PDF detected. Routing to OCR.");
      rawText = await extractTextFromImage(file, onProgress);
    }
  }

  // Check for total extraction failure
  if (!rawText || rawText.trim().length < 10) {
    return {
      entries: [],
      confidence: 0,
      rawText,
      sourceType,
      error: "extraction_failed",
    };
  }

  // ── 5. LLM Extraction / Regex Tokenization ─────────────────────────
  let entries = [];
  let confidence = 0;
  const hasGeminiKey = !!process.env.NEXT_PUBLIC_GEMINI_KEY;

  if (hasGeminiKey && !skipLLM) {
    try {
      const llmEntries = await extractWithLLM(rawText);
      if (llmEntries && llmEntries.length > 0) {
        entries = llmEntries;
        confidence = 1.0; // 100% confidence level
      } else {
        // Fallback to regex if LLM returned empty array
        entries = tokenize(rawText);
        confidence = scoreDocument(entries);
      }
    } catch (e) {
      console.warn("Gemini extraction failed, falling back to regex parser:", e);
      entries = tokenize(rawText);
      confidence = scoreDocument(entries);
    }
  } else {
    entries = tokenize(rawText);
    confidence = scoreDocument(entries);
  }

  // ── 8. Assign IDs, sanitize ───────────────────────────────────────
  const finalEntries = entries.map((entry) => {
    const sanitized = sanitizeEntry(entry);
    return {
      ...sanitized,
      id: crypto.randomUUID(),
      color_override: entry.color_override || null,
    };
  });

  return {
    entries: finalEntries,
    confidence,
    rawText,
    sourceType,
    error: null,
  };
}
