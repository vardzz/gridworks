// src/components/canvas/ScheduleGrid.jsx — The weekly grid structure
"use client";

import ScheduleCell from "./ScheduleCell";
import TimeColumn from "./TimeColumn";

// Grid geometry constants (PRD §5.1)
const SLOT_HEIGHT = 48; // px per 30-minute slot
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 14 hours
const GRID_HEIGHT = TOTAL_HOURS * 2 * SLOT_HEIGHT; // 1344px

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Assembles the full weekly grid: TimeColumn + day columns with entries.
 *
 * @param {Object} props
 * @param {Array} props.schedule — array of schedule entries from state
 * @param {function} props.onUpdateEntry — (id, patch) => void
 */
export default function ScheduleGrid({ schedule, onUpdateEntry }) {
  // Determine which days to show based on entries
  const hasWeekend = schedule.some(
    (e) => e.days?.includes("Saturday") || e.days?.includes("Sunday")
  );
  const visibleDays = hasWeekend ? ALL_DAYS : WEEKDAYS;

  // ── Grid lines (horizontal) ──────────────────────────────────────
  const gridLines = [];
  for (let h = 0; h <= TOTAL_HOURS; h++) {
    gridLines.push(
      <div
        key={`line-${h}`}
        className="absolute left-0 right-0 border-t border-[var(--gw-border-color)]"
        style={{ top: `${h * 2 * SLOT_HEIGHT}px`, opacity: 0.4 }}
      />
    );
    // Half-hour line (dashed)
    if (h < TOTAL_HOURS) {
      gridLines.push(
        <div
          key={`half-${h}`}
          className="absolute left-0 right-0 border-t border-dashed border-[var(--gw-border-color)]"
          style={{
            top: `${h * 2 * SLOT_HEIGHT + SLOT_HEIGHT}px`,
            opacity: 0.2,
          }}
        />
      );
    }
  }

  return (
    <div className="schedule-canvas flex bg-[var(--gw-bg-primary)] border border-[var(--gw-border-color)] rounded-lg overflow-hidden shadow-sm">
      <TimeColumn
        startHour={START_HOUR}
        endHour={END_HOUR}
        slotHeight={SLOT_HEIGHT}
      />

      {/* Day columns */}
      {visibleDays.map((day) => {
        const dayEntries = schedule.filter((e) => e.days?.includes(day));
        const layoutEntries = computeOverlaps(dayEntries);

        return (
          <div
            key={day}
            className="flex-1 relative border-l border-[var(--gw-border-color)]"
          >
            {/* Day header */}
            <div className="h-12 flex items-center justify-center border-b border-[var(--gw-border-color)] bg-[var(--gw-bg-header)] sticky top-0 z-10">
              <span className="text-xs font-display font-medium text-[var(--gw-text-primary)] uppercase tracking-wider">
                {day.substring(0, 3)}
              </span>
            </div>

            {/* Grid area */}
            <div className="relative" style={{ height: `${GRID_HEIGHT}px` }}>
              {gridLines}

              {layoutEntries.map((entry, idx) => {
                const [sH, sM] = (entry.start_time || "07:00")
                  .split(":")
                  .map(Number);
                const [eH, eM] = (entry.end_time || "08:00")
                  .split(":")
                  .map(Number);

                const top =
                  ((sH - START_HOUR) * 60 + sM) / 30 * SLOT_HEIGHT;
                const height =
                  ((eH * 60 + eM) - (sH * 60 + sM)) / 30 * SLOT_HEIGHT;

                return (
                  <ScheduleCell
                    key={`${entry.id}-${day}`}
                    entry={entry}
                    style={{
                      top: `${Math.max(0, top)}px`,
                      height: `${Math.max(SLOT_HEIGHT, height)}px`,
                      width: entry._layoutWidth || "calc(100% - 4px)",
                      left: entry._layoutLeft || "2px",
                    }}
                    colorIndex={schedule.indexOf(
                      schedule.find((s) => s.id === entry.id)
                    )}
                    onUpdate={(patch) => onUpdateEntry(entry.id, patch)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Detects overlapping entries and assigns width/left offsets.
 * Entries that overlap share the column width equally.
 */
function computeOverlaps(entries) {
  if (entries.length <= 1) return entries;

  // Sort by start time
  const sorted = [...entries].sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  // Group overlapping entries
  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = sorted[i];

    if (timeToMinutes(curr.start_time) < timeToMinutes(prev.end_time)) {
      currentGroup.push(curr);
    } else {
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  groups.push(currentGroup);

  // Assign layout properties
  const result = [];
  for (const group of groups) {
    const count = group.length;
    group.forEach((entry, idx) => {
      result.push({
        ...entry,
        _layoutWidth: count > 1 ? `calc(${100 / count}% - 4px)` : "calc(100% - 4px)",
        _layoutLeft: count > 1 ? `calc(${(idx * 100) / count}% + 2px)` : "2px",
      });
    });
  }

  return result;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
