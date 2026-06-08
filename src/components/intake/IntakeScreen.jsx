// src/components/intake/IntakeScreen.jsx — Drop zone + file picker UI
"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-12 max-sm:p-4">
      {/* Consent Modal */}
      {consentNeeded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-4 max-sm:mx-2 max-sm:p-6 max-sm:rounded-2xl">
            <h3 className="text-lg font-semibold text-prussian-blue max-sm:text-base">
              AI Image Check
            </h3>
            <p className="text-sm text-prussian-blue-700 max-sm:text-xs max-sm:leading-relaxed">
              To verify this is a schedule, Gridworks can send the image to
              Google&apos;s AI service. Your text data stays local — only the
              image is sent for this one-time check.
            </p>
            <div className="flex gap-3 max-sm:flex-col">
              <button
                onClick={handleConsentApprove}
                className="flex-1 inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[48px]"
              >
                Allow
              </button>
              <button
                onClick={handleConsentDecline}
                className="flex-1 inline-flex items-center justify-center bg-transparent border-2 border-black text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[48px]"
              >
                Skip AI check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="w-full max-w-xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 max-sm:mb-4 max-sm:p-3">
          <span className="text-red-500 text-lg leading-none max-sm:text-base">⚠</span>
          <div>
            <p className="text-sm text-red-800 font-medium max-sm:text-xs">
              {errorMessages[error] || "An unexpected error occurred."}
            </p>
            {(error === "not_a_schedule" || error === "extraction_failed") && (
              <button
                onClick={onManualEntry}
                className="text-sm text-red-600 underline hover:text-red-800 mt-1 cursor-pointer max-sm:text-xs"
              >
                Enter your schedule manually →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div className="w-full max-w-xl aspect-[4/3] max-sm:aspect-auto max-sm:min-h-[260px] flex flex-col relative group cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`w-full h-full bg-white border border-alabaster-grey shadow-2xl rounded-2xl p-2 max-sm:p-1.5 flex flex-col relative overflow-hidden transition-all duration-300 ${isDragging ? "scale-[1.02] shadow-2xl" : ""} ${isLoading ? "pointer-events-none opacity-70" : ""}`}>
          
          <div className={`border-2 border-dashed rounded-xl h-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 max-sm:py-8 ${isDragging ? "border-prussian-blue-300 bg-prussian-blue/5" : "border-alabaster-grey-900 bg-alabaster-grey/20 group-hover:border-prussian-blue-300"}`}>
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="animate-spin w-8 h-8 border-3 border-alabaster-grey-400 border-t-prussian-blue-700 rounded-full" />
                <p className="text-sm text-prussian-blue-700 font-medium max-sm:text-xs">
                  {progress > 0
                    ? `Reading your file… ${progress}%`
                    : "Reading your file…"}
                </p>
                {/* OCR Progress bar */}
                {progress > 0 && (
                  <div className="w-48 h-1.5 bg-neutral-200 rounded-full overflow-hidden max-sm:w-36">
                    <div
                      className="h-full bg-[#fca311] transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className={`w-20 h-20 max-sm:w-14 max-sm:h-14 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 max-sm:mb-4 transition-all duration-500 relative z-10 ${isDragging ? "-translate-y-2 shadow-xl" : "group-hover:-translate-y-2 group-hover:shadow-xl"}`}>
                  <UploadCloud className={`transition-colors size-8 max-sm:size-6 ${isDragging ? "text-[#fca311]" : "text-prussian-blue-600 group-hover:text-[#fca311]"}`} />
                </div>
                <h4 className="text-2xl max-sm:text-lg font-bold text-black mb-2 text-center">Upload Schedule PDF</h4>
                {/* Desktop: drag & drop messaging / Mobile: tap emphasis */}
                <p className="text-base max-sm:text-sm text-prussian-blue-600 font-medium text-center max-w-[280px] max-sm:max-w-[220px]">
                  {isDragging ? "Drop your schedule here" : (
                    <>
                      <span className="hidden sm:inline">Drag and drop your university schedule here</span>
                      <span className="sm:hidden">Tap to select your schedule file</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-prussian-blue-400 mt-6 max-sm:mt-4 z-10 text-center">
                  Supports PDF, PNG, JPEG • Max 10 MB
                </p>
                
                {/* Floating Document Mock 1 — hidden on mobile (no drag-and-drop) */}
                <div className={`absolute top-8 left-8 md:top-12 md:left-12 w-12 h-16 bg-white shadow-lg rounded border border-alabaster-grey flex flex-col items-center justify-center -rotate-12 transition-all duration-700 delay-100 z-0 hidden sm:flex ${isDragging ? "opacity-100 translate-y-2" : "opacity-0 group-hover:opacity-100 group-hover:translate-y-2"}`}>
                  <FileText className="text-[#fca311]" size={20} />
                </div>
                {/* Floating Document Mock 2 — hidden on mobile */}
                <div className={`absolute bottom-8 right-8 md:bottom-12 md:right-12 w-10 h-14 bg-white shadow-lg rounded border border-alabaster-grey flex flex-col items-center justify-center rotate-12 transition-all duration-700 delay-200 z-0 hidden sm:flex ${isDragging ? "opacity-100 -translate-y-2" : "opacity-0 group-hover:opacity-100 group-hover:-translate-y-2"}`}>
                  <FileText className="text-prussian-blue-300" size={16} />
                </div>
              </>
            )}
          </div>
        </div>
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
          className="mt-6 max-sm:mt-4 inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[48px]"
        >
          Enter your schedule manually
        </button>
      )}
    </div>
  );
}
