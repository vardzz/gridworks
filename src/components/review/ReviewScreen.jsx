// src/components/review/ReviewScreen.jsx — Editable table of parsed entries
"use client";

import { useState } from "react";
import ReviewRow from "./ReviewRow";
import { getWarnings } from "@/lib/parser/confidenceScorer";
import { sanitizeEntry } from "@/lib/sanitize";

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
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">
            Schedule read successfully — {(confidence * 100).toFixed(0)}%
            confidence
          </span>
        </div>
      );
    } else if (confidence >= 0.7) {
      bannerContent = (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-amber-50 text-amber-800 border border-amber-200">
          <span className="text-lg">⚠</span>
          <span className="text-sm font-medium">
            Most fields were read. Review highlighted fields. (
            {(confidence * 100).toFixed(0)}% confidence)
          </span>
        </div>
      );
    } else {
      bannerContent = (
        <div className="flex items-center gap-2 p-4 rounded-lg mb-6 bg-red-50 text-red-800 border border-red-200">
          <span className="text-lg">⚠</span>
          <span className="text-sm font-medium">
            We had trouble reading this schedule. Please check all fields
            carefully. ({(confidence * 100).toFixed(0)}% confidence)
          </span>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 gap-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--gw-text-primary)] tracking-tight">
          Review Your Schedule
        </h2>
        <p className="text-sm text-[var(--gw-text-secondary)] mt-1">
          {isManualEntry
            ? "Add your classes manually below."
            : "Verify the extracted data. Fix any highlighted fields before building your schedule."}
        </p>
      </div>

      {bannerContent}

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-alabaster-grey shadow-2xl rounded-2xl relative">
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

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center bg-transparent text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-alabaster-grey hover:scale-105 active:scale-95 cursor-pointer"
        >
          ← Start over
        </button>

        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center bg-transparent border-2 border-black text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          + Add row
        </button>

        <button
          onClick={handleConfirm}
          disabled={entries.length === 0}
          className="inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
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
