// src/components/canvas/ScheduleCell.jsx — Individual subject block with inline editing
"use client";

import { useRef } from "react";
import { sanitizeString } from "@/lib/sanitize";

// 10-color palette for subject cell backgrounds (cycled by entry index)
const CELL_PALETTE = [
  "#E3F2FD", "#FCE4EC", "#E8F5E9", "#FFF3E0", "#F3E5F5",
  "#E0F7FA", "#FFF8E1", "#EDE7F6", "#E8EAF6", "#FBE9E7",
];

/**
 * A single schedule block rendered inside a day column.
 * All text fields are contentEditable for inline editing (Phase 7).
 *
 * Position is controlled by the parent via the `style` prop (top, height).
 *
 * @param {Object} props
 * @param {Object} props.entry — the schedule entry data
 * @param {Object} props.style — { top, height, width, left } in px
 * @param {number} props.colorIndex — index for palette cycling
 * @param {function} props.onUpdate — (patch) => void
 */
export default function ScheduleCell({ entry, style, colorIndex = 0, onUpdate }) {
  const bgColor = entry.color_override || CELL_PALETTE[colorIndex % CELL_PALETTE.length];

  const handleBlur = (field, maxLength) => (e) => {
    const raw = e.currentTarget.textContent || "";
    const clean = sanitizeString(raw, maxLength);
    if (clean !== (entry[field] || "")) {
      onUpdate({ [field]: clean });
    }
    // Reset DOM to sanitized value
    e.currentTarget.textContent = clean;
  };

  const handleReset = (field) => {
    if (entry._parsed && entry._parsed[field] !== undefined) {
      onUpdate({ [field]: entry._parsed[field] });
    }
  };

  return (
    <div
      className="absolute overflow-hidden flex flex-col gap-0.5 p-2.5 sm:p-3 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] hover:z-20 active-schedule-cell group cursor-pointer"
      style={{
        ...style,
        backgroundColor: bgColor,
        borderColor: "rgba(255,255,255,0.4)",
        borderWidth: "1px",
        borderRadius: "0.75rem", // More rounded like landing page
      }}
    >
      {/* Subject Code */}
      <div className="relative">
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur("subject_code", 12)}
          className="font-bold text-sm text-black outline-none focus:ring-2 focus:ring-[#fca311]/50 focus:bg-white/50 rounded-sm leading-tight truncate transition-colors"
        >
          {entry.subject_code || ""}
        </div>
        {entry._parsed && (
          <button
            onClick={() => handleReset("subject_code")}
            className="absolute -right-1 -top-1 text-[10px] text-[var(--gw-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-[var(--gw-accent)]"
            title="Reset to parsed value"
          >
            ↺
          </button>
        )}
      </div>

      {/* Subject Title */}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur("subject_title", 80)}
        className="text-[11px] font-medium text-black/80 outline-none focus:ring-2 focus:ring-[#fca311]/50 focus:bg-white/50 rounded-sm leading-snug truncate transition-colors"
      >
        {entry.subject_title || ""}
      </div>

      {/* Room + Professor (secondary info) */}
      <div className="text-[10px] text-black/60 font-medium mt-auto flex items-center gap-1 truncate pt-1">
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur("room", 20)}
          className="outline-none focus:ring-2 focus:ring-[#fca311]/50 focus:bg-white/50 rounded-sm transition-colors"
        >
          {entry.room || ""}
        </span>
        {entry.room && entry.professor && <span>•</span>}
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur("professor", 60)}
          className="outline-none focus:ring-2 focus:ring-[#fca311]/50 focus:bg-white/50 rounded-sm truncate transition-colors"
        >
          {entry.professor || ""}
        </span>
      </div>
    </div>
  );
}
