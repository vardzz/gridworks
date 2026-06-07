// src/components/canvas/TimeColumn.jsx — Left-side time labels
"use client";

/**
 * Renders the left column of time labels from startHour to endHour.
 * Each label is positioned at (hour - startHour) * 2 * slotHeight pixels.
 *
 * @param {Object} props
 * @param {number} props.startHour — grid start (default 7)
 * @param {number} props.endHour — grid end (default 21)
 * @param {number} props.slotHeight — px per 30-min slot (default 48)
 */
export default function TimeColumn({
  startHour = 7,
  endHour = 21,
  slotHeight = 48,
}) {
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  const formatHour = (h) => {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  };

  return (
    <div className="relative w-16 shrink-0 border-r border-[var(--gw-border-color)]">
      {/* Spacer for header row */}
      <div className="h-12 border-b border-[var(--gw-border-color)]" />

      {/* Time labels */}
      <div className="relative">
        {hours.map((h) => {
          const top = (h - startHour) * 2 * slotHeight; // 2 slots per hour
          return (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-[var(--gw-text-secondary)] font-body leading-none select-none"
              style={{ top: `${top}px`, transform: "translateY(-50%)" }}
            >
              {formatHour(h)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
