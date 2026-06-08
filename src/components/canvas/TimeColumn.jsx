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
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push({ hour: h, minute: 0 });
    slots.push({ hour: h, minute: 30 });
  }
  slots.push({ hour: endHour, minute: 0 });

  const formatTime = (h, m) => {
    const period = h < 12 ? "AM" : "PM";
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    return m === 0 ? `${displayHour}:00 ${period}` : `${displayHour}:30 ${period}`;
  };

  return (
    <div className="relative w-16 shrink-0 border-r border-[var(--gw-border-color)]">
      {/* Spacer for header row */}
      <div className="h-14 border-b border-[var(--gw-border-color)] transition-colors duration-500" />

      {/* Time labels */}
      <div className="relative">
        {slots.map(({ hour, minute }) => {
          const top = (hour - startHour) * 2 * slotHeight + (minute === 30 ? slotHeight : 0);
          return (
            <div
              key={`${hour}-${minute}`}
              className="absolute right-3 text-[10px] font-bold text-[var(--gw-text-secondary)] tracking-tight leading-none select-none transition-colors duration-500"
              style={{ top: `${top}px`, transform: "translateY(-50%)" }}
            >
              {formatTime(hour, minute)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
