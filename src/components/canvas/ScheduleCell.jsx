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
export default function ScheduleCell({ entry, style, colorIndex = 0, onUpdate, currentDay }) {
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

  const handleDragStart = (e) => {
    // Basic DND payload
    e.dataTransfer.setData("application/json", JSON.stringify({
      id: entry.id,
      originalDay: currentDay,
      offsetY: e.nativeEvent.offsetY || 0,
    }));
    // Optional: make it slightly transparent while dragging
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent drag
    
    const startY = e.clientY;
    const initialHeight = parseFloat(style.height) || 48; // 48 is SLOT_HEIGHT
    
    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(48, initialHeight + deltaY); // minimum 30 min (48px)
      
      // Calculate new end time
      // 48px = 30 minutes. 
      // new duration in minutes = (newHeight / 48) * 30
      const totalMinutes = (newHeight / 48) * 30;
      const snappedMinutes = Math.round(totalMinutes / 30) * 30;
      
      if (snappedMinutes > 0) {
        // Compute new end time from start time
        const [sH, sM] = (entry.start_time || "07:00").split(":").map(Number);
        const endTotal = (sH * 60 + sM) + snappedMinutes;
        const eH = Math.floor(endTotal / 60);
        const eM = endTotal % 60;
        const newEndTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
        
        // We trigger an update if it changed
        if (newEndTime !== entry.end_time) {
          onUpdate({ end_time: newEndTime });
        }
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="absolute overflow-hidden flex flex-col gap-0.5 p-2.5 sm:p-3 transition-shadow duration-300 shadow-sm hover:shadow-xl hover:z-20 active-schedule-cell group cursor-grab active:cursor-grabbing"
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
          className="font-bold text-sm text-black outline-none focus:ring-2 focus:ring-[var(--gw-accent)] focus:bg-white/50 rounded-sm leading-tight truncate transition-colors"
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
        className="text-[11px] font-medium text-black/80 outline-none focus:ring-2 focus:ring-[var(--gw-accent)] focus:bg-white/50 rounded-sm leading-snug line-clamp-3 break-words transition-colors"
      >
        {entry.subject_title || ""}
      </div>

      {/* Room + Professor (secondary info) */}
      <div className="text-[10px] text-black/60 font-medium mt-auto flex flex-col items-start gap-0.5 truncate pt-1">
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur("professor", 60)}
          className="outline-none focus:ring-2 focus:ring-[var(--gw-accent)] focus:bg-white/50 rounded-sm truncate transition-colors w-full"
        >
          {entry.professor || ""}
        </span>
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur("room", 20)}
          className="outline-none focus:ring-2 focus:ring-[var(--gw-accent)] focus:bg-white/50 rounded-sm transition-colors w-full opacity-80"
        >
          {entry.room || ""}
        </span>
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/10 transition-colors z-30"
        onMouseDown={handleResizeStart}
        onTouchStart={(e) => {
          // mobile support can be added similarly if requested
          // for now we rely on the mouse event handler
        }}
      />
    </div>
  );
}
