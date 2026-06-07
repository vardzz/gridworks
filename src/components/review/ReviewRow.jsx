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
    `w-full px-2 py-1.5 text-sm bg-transparent border rounded-md outline-none transition-colors focus:ring-1 focus:ring-[var(--gw-accent)] ${
      isWarned(field)
        ? "border-yellow-400 bg-yellow-50/50"
        : "border-[var(--gw-border-color)]"
    }`;

  const toggleDay = (day) => {
    const current = entry.days || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    onChange("days", updated);
  };

  return (
    <tr className="border-b border-[var(--gw-border-color)] hover:bg-[var(--gw-bg-header)]/30 transition-colors">
      {/* Subject Code */}
      <td className="p-2">
        <div className="relative">
          {isWarned("subject_code") && (
            <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-yellow-500 text-xs">⚠</span>
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
                className={`px-2 py-0.5 text-xs rounded-full border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--gw-accent)] text-white border-[var(--gw-accent)]"
                    : "bg-transparent text-[var(--gw-text-secondary)] border-[var(--gw-border-color)] hover:border-[var(--gw-accent)]"
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
