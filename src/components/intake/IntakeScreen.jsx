// src/components/intake/IntakeScreen.jsx — Drop zone + file picker UI
"use client";

import { useState, useRef, useCallback } from "react";

/**
 * File Intake Screen (PRD §8, Screen 1).
 *
 * Features:
 * - Full-area drag-and-drop zone
 * - Click-to-open file picker
 * - File type/size validation
 * - Loading states with OCR progress bar
 * - Consent modal for Gemini image pre-check
 * - Error banners
 * - "Enter manually" link
 *
 * @param {Object} props
 * @param {Object} props.parser — from useParser hook
 * @param {function} props.onParsed — (result) => void — called after successful parse
 * @param {function} props.onManualEntry — () => void — skip to review with blank entry
 */
export default function IntakeScreen({ parser, onParsed, onManualEntry }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const {
    parse,
    isLoading,
    progress,
    error,
    consentNeeded,
    approveConsent,
    declineConsent,
    clearError,
  } = parser;

  const handleFile = useCallback(
    async (file) => {
      clearError();
      const result = await parse(file);
      if (result && !result.error) {
        onParsed(result);
      }
    },
    [parse, onParsed, clearError]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleConsentApprove = useCallback(async () => {
    const result = await approveConsent();
    if (result && !result.error) {
      onParsed(result);
    }
  }, [approveConsent, onParsed]);

  const handleConsentDecline = useCallback(async () => {
    const result = await declineConsent();
    if (result && !result.error) {
      onParsed(result);
    }
  }, [declineConsent, onParsed]);

  // ── Error message mapping ──────────────────────────────────────────
  const errorMessages = {
    unsupported_type: "Gridworks only supports PDF, PNG, and JPEG files.",
    file_too_large: "File too large (max 10 MB). Try a compressed version.",
    not_a_schedule:
      "This doesn't appear to be a class schedule. Try a different file, or enter your schedule manually.",
    extraction_failed:
      "We couldn't read this file. Try a clearer image, or enter your schedule manually.",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12">
      {/* Consent Modal */}
      {consentNeeded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              AI Image Check
            </h3>
            <p className="text-sm text-neutral-600">
              To verify this is a schedule, Gridworks can send the image to
              Google&apos;s AI service. Your text data stays local — only the
              image is sent for this one-time check.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConsentApprove}
                className="flex-1 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Allow
              </button>
              <button
                onClick={handleConsentDecline}
                className="flex-1 py-2.5 text-sm font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Skip AI check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="w-full max-w-xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none">⚠</span>
          <div>
            <p className="text-sm text-red-800 font-medium">
              {errorMessages[error] || "An unexpected error occurred."}
            </p>
            {(error === "not_a_schedule" || error === "extraction_failed") && (
              <button
                onClick={onManualEntry}
                className="text-sm text-red-600 underline hover:text-red-800 mt-1 cursor-pointer"
              >
                Enter your schedule manually →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-xl aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? "border-[var(--gw-accent)] bg-blue-50/50 scale-[1.02]"
            : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50"
        } ${isLoading ? "pointer-events-none opacity-70" : ""}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-3 border-neutral-300 border-t-neutral-700 rounded-full" />
            <p className="text-sm text-neutral-600 font-medium">
              {progress > 0
                ? `Reading your file… ${progress}%`
                : "Reading your file…"}
            </p>
            {/* OCR Progress bar */}
            {progress > 0 && (
              <div className="w-48 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--gw-accent)] transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <div className="text-4xl text-neutral-300">📄</div>
            <p className="text-lg font-medium text-neutral-700">
              Drop your schedule here
            </p>
            <p className="text-sm text-neutral-500">
              or click to browse your files
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Supports PDF, PNG, JPEG • Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Manual entry link */}
      {!isLoading && (
        <button
          onClick={onManualEntry}
          className="mt-6 text-sm text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer underline"
        >
          Enter your schedule manually
        </button>
      )}
    </div>
  );
}
