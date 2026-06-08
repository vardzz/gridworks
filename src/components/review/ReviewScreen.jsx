// src/components/review/ReviewScreen.jsx — Editable table of parsed entries
"use client";

import { useState } from "react";
import ReviewRow from "./ReviewRow";
import { getWarnings } from "@/lib/parser/confidenceScorer";
import { sanitizeEntry } from "@/lib/sanitize";
import { CANONICAL_DAYS } from "@/constants/defaults";

/**
 * Parse Review Screen (PRD §8, Screen 2).
 *
 * Shows an editable table of extracted schedule entries.
 * Changes update local component state — not global state —
 * until the user clicks "Confirm & Build Schedule".
 *
 * @param {Object} props
 * @param {Array} props.parsedEntries — entries from the parser
 * @param {Object|null} props.parseMetadata — confidence/warning metadata
 * @param {function} props.onConfirm — (entries) => void — commits to global state
 * @param {function} props.onBack — () => void — navigate back to intake
 * @param {boolean} props.isManualEntry — true if user chose "enter manually"
 */
export default function ReviewScreen({
  parsedEntries,
  parseMetadata,
  onConfirm,
  onBack,
  isManualEntry = false,
}) {
  const [entries, setEntries] = useState(() => {
    if (parsedEntries && parsedEntries.length > 0) return [...parsedEntries];
    // Start with one blank row for manual entry
    return [createBlankEntry()];
  });

  const handleUpdate = (id, field, value) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleRemove = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAdd = () => {
    setEntries((prev) => [...prev, createBlankEntry()]);
  };

  const handleConfirm = () => {
    // Sanitize all entries before committing, and snapshot _parsed values
    const sanitized = entries.map((entry) => {
      const clean = sanitizeEntry(entry);
      return {
        ...clean,
        _parsed: { ...clean }, // Snapshot for reset affordance in Phase 7
      };
    });
    onConfirm(sanitized);
  };

  // ── Confidence banner ───────────────────────────────────────────────
  const confidence = parseMetadata?.parse_confidence ?? 1.0;
  let bannerContent = null;

  if (!isManualEntry && parseMetadata) {
    if (confidence >= 0.85) {
      bannerContent = (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200 max-sm:p-3 max-sm:mb-4 max-sm:text-xs">
          <span className="text-lg max-sm:text-base">✓</span>
          <span className="text-sm font-medium max-sm:text-xs">
            Schedule read successfully — {(confidence * 100).toFixed(0)}%
            confidence
          </span>
        </div>
      );
    } else if (confidence >= 0.7) {
      bannerContent = (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-amber-50 text-amber-800 border border-amber-200 max-sm:p-3 max-sm:mb-4 max-sm:text-xs">
          <span className="text-lg max-sm:text-base">⚠</span>
          <span className="text-sm font-medium max-sm:text-xs">
            Most fields were read. Review highlighted fields. (
            {(confidence * 100).toFixed(0)}% confidence)
          </span>
        </div>
      );
    } else {
      bannerContent = (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-red-50 text-red-800 border border-red-200 max-sm:p-3 max-sm:mb-4 max-sm:text-xs">
          <span className="text-lg max-sm:text-base">⚠</span>
          <span className="text-sm font-medium max-sm:text-xs">
            We had trouble reading this schedule. Please check all fields
            carefully. ({(confidence * 100).toFixed(0)}% confidence)
          </span>
        </div>
      );
    }
  }

  // ── Helper: toggle day for mobile card ────────────────────────────
  const toggleDay = (entryId, day) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const current = e.days || [];
        const updated = current.includes(day)
          ? current.filter((d) => d !== day)
          : [...current, day];
        return { ...e, days: updated };
      })
    );
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 gap-4 max-sm:p-4 max-sm:gap-3">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--gw-text-primary)] tracking-tight max-sm:text-xl">
          Review Your Schedule
        </h2>
        <p className="text-sm text-[var(--gw-text-secondary)] mt-1 max-sm:text-xs max-sm:mt-0.5">
          {isManualEntry
            ? "Add your classes manually below."
            : "Verify the extracted data. Fix any highlighted fields before building your schedule."}
        </p>
      </div>

      {bannerContent}

      {/* ═══ Desktop Table (hidden below md) ═══ */}
      <div className="flex-1 overflow-auto bg-white border border-alabaster-grey shadow-2xl rounded-2xl relative hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-alabaster-grey/30 border-b border-alabaster-grey sticky top-0 z-10 backdrop-blur-md">
            <tr className="h-14">
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-28 align-middle">
                Code
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] align-middle">
                Title
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] align-middle">
                Professor
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-28 align-middle">
                Room
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-64 align-middle">
                Days
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-28 align-middle">
                Start
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-28 align-middle">
                End
              </th>
              <th className="px-4 font-bold text-black uppercase tracking-widest text-[10px] w-16 text-center align-middle">
                Del
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <ReviewRow
                key={entry.id}
                entry={entry}
                warnings={getWarnings(entry)}
                onChange={(field, value) => handleUpdate(entry.id, field, value)}
                onRemove={() => handleRemove(entry.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Mobile Card Layout (visible below md) ═══ */}
      <div className="flex-1 overflow-auto space-y-3 md:hidden">
        {entries.map((entry) => {
          const warnings = getWarnings(entry);
          const hasWarnings = warnings.length > 0;

          return (
            <div
              key={entry.id}
              className="bg-white border border-alabaster-grey/50 rounded-xl shadow-sm p-4 space-y-3 relative transition-all duration-200"
            >
              {/* Warning badge */}
              {hasWarnings && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-[#fca311]/15 border border-[#fca311]/30 rounded-full text-[10px] font-bold text-[#fca311] tracking-wide">
                  ⚠ Review {warnings.length} field{warnings.length > 1 ? "s" : ""}
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer text-lg"
                title="Remove entry"
              >
                ×
              </button>

              {/* Code + Title header */}
              <div className="pr-8">
                <input
                  className={`w-full text-base font-bold text-black bg-transparent border-b outline-none transition-all placeholder:text-alabaster-grey-300 py-1 ${
                    warnings.includes("subject_code")
                      ? "border-[#fca311] bg-[#fca311]/5"
                      : "border-transparent focus:border-[#fca311]"
                  }`}
                  value={entry.subject_code || ""}
                  onChange={(e) => handleUpdate(entry.id, "subject_code", e.target.value)}
                  placeholder="CS101"
                  maxLength={12}
                />
                <input
                  className={`w-full text-sm text-black/80 bg-transparent border-b outline-none transition-all placeholder:text-alabaster-grey-300 py-1 mt-1 ${
                    warnings.includes("subject_title")
                      ? "border-[#fca311] bg-[#fca311]/5"
                      : "border-transparent focus:border-[#fca311]"
                  }`}
                  value={entry.subject_title || ""}
                  onChange={(e) => handleUpdate(entry.id, "subject_title", e.target.value)}
                  placeholder="Introduction to..."
                  maxLength={80}
                />
              </div>

              {/* Professor + Room in 2-col grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-alabaster-grey-300 uppercase tracking-widest block mb-0.5">Professor</label>
                  <input
                    className={`w-full text-sm text-black bg-transparent border-b outline-none transition-all placeholder:text-alabaster-grey-300 py-1 ${
                      warnings.includes("professor")
                        ? "border-[#fca311] bg-[#fca311]/5"
                        : "border-transparent focus:border-[#fca311]"
                    }`}
                    value={entry.professor || ""}
                    onChange={(e) => handleUpdate(entry.id, "professor", e.target.value)}
                    placeholder="Prof. Name"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-alabaster-grey-300 uppercase tracking-widest block mb-0.5">Room</label>
                  <input
                    className={`w-full text-sm text-black bg-transparent border-b outline-none transition-all placeholder:text-alabaster-grey-300 py-1 ${
                      warnings.includes("room")
                        ? "border-[#fca311] bg-[#fca311]/5"
                        : "border-transparent focus:border-[#fca311]"
                    }`}
                    value={entry.room || ""}
                    onChange={(e) => handleUpdate(entry.id, "room", e.target.value)}
                    placeholder="GK-401"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Days — Pill Toggles */}
              <div>
                <label className="text-[10px] font-bold text-alabaster-grey-300 uppercase tracking-widest block mb-1.5">Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {CANONICAL_DAYS.map((day) => {
                    const isActive = (entry.days || []).includes(day);
                    const abbr = day.substring(0, 3);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(entry.id, day)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all shadow-sm cursor-pointer min-h-[36px] ${
                          isActive
                            ? "bg-[#0d1b2a] text-white border-[#0d1b2a] scale-105 shadow-md"
                            : "bg-white text-alabaster-grey-400 border-alabaster-grey hover:text-black hover:border-black"
                        }`}
                      >
                        {abbr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start / End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-alabaster-grey-300 uppercase tracking-widest block mb-0.5">Start</label>
                  <input
                    type="time"
                    className={`w-full text-sm text-black bg-transparent border-b outline-none transition-all py-1 ${
                      warnings.includes("start_time")
                        ? "border-[#fca311] bg-[#fca311]/5"
                        : "border-transparent focus:border-[#fca311]"
                    }`}
                    value={entry.start_time || ""}
                    onChange={(e) => handleUpdate(entry.id, "start_time", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-alabaster-grey-300 uppercase tracking-widest block mb-0.5">End</label>
                  <input
                    type="time"
                    className={`w-full text-sm text-black bg-transparent border-b outline-none transition-all py-1 ${
                      warnings.includes("end_time")
                        ? "border-[#fca311] bg-[#fca311]/5"
                        : "border-transparent focus:border-[#fca311]"
                    }`}
                    value={entry.end_time || ""}
                    onChange={(e) => handleUpdate(entry.id, "end_time", e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 max-md:flex-col max-md:gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center bg-transparent text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-alabaster-grey hover:scale-105 active:scale-95 cursor-pointer max-md:w-full max-md:order-3 min-h-[48px]"
        >
          ← Start over
        </button>

        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center bg-transparent border-2 border-black text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer max-md:w-full max-md:order-2 min-h-[48px]"
        >
          + Add row
        </button>

        <button
          onClick={handleConfirm}
          disabled={entries.length === 0}
          className="inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md max-md:w-full max-md:order-1 min-h-[48px]"
        >
          Confirm & Build Schedule
        </button>
      </div>
    </div>
  );
}

/** Creates a blank entry with a new UUID. */
function createBlankEntry() {
  return {
    id: crypto.randomUUID(),
    subject_code: "",
    subject_title: "",
    professor: "",
    room: "",
    days: [],
    start_time: "",
    end_time: "",
    color_override: null,
  };
}
