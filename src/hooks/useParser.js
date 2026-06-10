// src/hooks/useParser.js — Orchestrates the full parsing pipeline
"use client";

import { useState, useCallback, useRef } from "react";
import { parseFile } from "@/lib/parser";

/**
 * React hook wrapping the parseFile orchestrator.
 * Manages loading, progress, error, and consent state for the UI.
 *
 * Usage:
 *   const { parse, isLoading, progress, error, consentNeeded, approveConsent } = useParser();
 *   // Drop handler: parse(file)
 */
export function useParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [consentNeeded, setConsentNeeded] = useState(false);

  // Ref to hold the pending file while waiting for consent
  const pendingFile = useRef(null);

  /**
   * Run the full parsing pipeline on a file.
   * For image files, triggers a consent prompt before the Gemini pre-check.
   */
  const parse = useCallback(async (file, options = {}) => {
    setError(null);
    setResult(null);
    setProgress(0);
    setCourseCount(0);

    const isImage = file.type.startsWith("image/");

    // If image and consent not yet given, pause for consent
    if (isImage && !options.skipPreCheck && !options.consentGiven) {
      pendingFile.current = file;
      setConsentNeeded(true);
      return null;
    }

    setIsLoading(true);
    setConsentNeeded(false);

    try {
      const parseResult = await parseFile(file, {
        onProgress: (payload) => {
          if (payload?.type === 'percent') {
            setProgress(payload.value);
          } else if (payload?.type === 'courseCount') {
            setCourseCount(payload.value);
          } else {
            setProgress(payload); // fallback for older code if any
          }
        },
        skipLLM: options.skipLLM || false,
        skipPreCheck: options.skipPreCheck || false,
      });

      if (parseResult.error) {
        setError(parseResult.error);
        return null;
      }

      setResult(parseResult);
      return parseResult;
    } catch (err) {
      setError("extraction_failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Called when user approves the consent prompt.
   * Resumes parsing with Gemini pre-check enabled.
   */
  const approveConsent = useCallback(async () => {
    const file = pendingFile.current;
    if (!file) return null;

    pendingFile.current = null;
    setConsentNeeded(false);

    return parse(file, { consentGiven: true });
  }, [parse]);

  /**
   * Called when user declines consent — skips the Gemini pre-check
   * and proceeds with local-only parsing.
   */
  const declineConsent = useCallback(async () => {
    const file = pendingFile.current;
    if (!file) return null;

    pendingFile.current = null;
    setConsentNeeded(false);

    return parse(file, { consentGiven: true, skipPreCheck: true, skipLLM: true });
  }, [parse]);

  /** Clears the current error state. */
  const clearError = useCallback(() => setError(null), []);

  return {
    parse,
    isLoading,
    progress,
    courseCount,
    error,
    result,
    consentNeeded,
    approveConsent,
    declineConsent,
    clearError,
  };
}
