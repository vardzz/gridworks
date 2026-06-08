// src/components/review/ReviewRow.jsx — Single editable row component
"use client";

import { CANONICAL_DAYS } from "@/constants/defaults";

/**
 * A single table row in the review screen.
 * Each field is a controlled input. Days are pill toggles.
 * Fields listed in `warnings` get a yellow border and ⚠ icon.
 *
 * @param {Object} props
 * @param {Object} props.entry — the schedule entry data
 * @param {string[]} props.warnings — field names that are uncertain
 * @param {function} props.onChange — (field, value) => void
 * @param {function} props.onRemove — () => void
 */
export default function ReviewRow({ entry, warnings = [], onChange, onRemove }) {
  const isWarned = (field) => warnings.includes(field);

  const inputClass = (field) =>
    `w-full px-3 py-2 text-sm font-medium text-black bg-transparent border border-transparent rounded-lg hover:border-alabaster-grey hover:bg-white focus:bg-white focus:border-[#fca311] focus:ring-4 focus:ring-[#fca311]/20 outline-none transition-all placeholder:text-alabaster-grey-300 ${
      isWarned(field)
        ? "!border-[#fca311] !bg-[#fca311]/10"
        : ""
    }`;

  const toggleDay = (day) => {
    const current = entry.days || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    onChange("days", updated);
  };

  return (
    <tr className="border-b border-alabaster-grey/50 hover:bg-alabaster-grey/10 transition-colors">
      {/* Subject Code */}
      <td className="p-2">
        <div className="relative">
          {isWarned("subject_code") && (
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-[#fca311] text-xs font-bold">!</span>
          )}
          <input
            className={inputClass("subject_code")}
            value={entry.subject_code || ""}
            onChange={(e) => onChange("subject_code", e.target.value)}
            placeholder="CS101"
            maxLength={12}
          />
        </div>
      </td>

      {/* Title */}
      <td className="p-2">
        <input
          className={inputClass("subject_title")}
          value={entry.subject_title || ""}
          onChange={(e) => onChange("subject_title", e.target.value)}
          placeholder="Introduction to..."
          maxLength={80}
        />
      </td>

      {/* Professor */}
      <td className="p-2">
        <input
          className={inputClass("professor")}
          value={entry.professor || ""}
          onChange={(e) => onChange("professor", e.target.value)}
          placeholder="Prof. Name"
          maxLength={60}
        />
      </td>

      {/* Room */}
      <td className="p-2">
        <input
          className={inputClass("room")}
          value={entry.room || ""}
          onChange={(e) => onChange("room", e.target.value)}
          placeholder="GK-401"
          maxLength={20}
        />
      </td>

      {/* Days — Pill Toggles */}
      <td className="p-2">
        <div className="flex flex-wrap gap-1">
          {CANONICAL_DAYS.map((day) => {
            const isActive = (entry.days || []).includes(day);
            const abbr = day.substring(0, 3);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all shadow-sm cursor-pointer ${
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
      </td>

      {/* Start Time */}
      <td className="p-2">
        <input
          type="time"
          className={inputClass("start_time")}
          value={entry.start_time || ""}
          onChange={(e) => onChange("start_time", e.target.value)}
        />
      </td>

      {/* End Time */}
      <td className="p-2">
        <input
          type="time"
          className={inputClass("end_time")}
          value={entry.end_time || ""}
          onChange={(e) => onChange("end_time", e.target.value)}
        />
      </td>

      {/* Delete */}
      <td className="p-2 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none cursor-pointer"
          title="Remove entry"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
