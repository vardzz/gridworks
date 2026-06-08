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
const GRID_PT = 24; // Padding Top
const GRID_PB = 24; // Padding Bottom

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Assembles the full weekly grid: TimeColumn + day columns with entries.
 *
 * @param {Object} props
 * @param {Array} props.schedule — array of schedule entries from state
 * @param {function} props.onUpdateEntry — (id, patch) => void
 */
export default function ScheduleGrid({ schedule, onUpdateEntry, isExporting }) {
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
        style={{ top: `${h * 2 * SLOT_HEIGHT + GRID_PT}px`, opacity: 0.4 }}
      />
    );
    // Half-hour line (dashed)
    if (h < TOTAL_HOURS) {
      gridLines.push(
        <div
          key={`half-${h}`}
          className="absolute left-0 right-0 border-t border-dashed border-[var(--gw-border-color)]"
          style={{
            top: `${h * 2 * SLOT_HEIGHT + SLOT_HEIGHT + GRID_PT}px`,
            opacity: 0.2,
          }}
        />
      );
    }
  }

  return (
    <div 
      className="schedule-canvas flex min-w-[700px] bg-[var(--gw-bg-primary)] border-2 rounded-2xl overflow-hidden shadow-2xl relative transition-colors duration-500"
      style={{ borderColor: "var(--gw-accent, var(--gw-border-color))" }}
    >
      {/* Export Watermark (Tiled Background) */}
      <div 
        className={`absolute inset-0 z-0 pointer-events-none ${isExporting ? 'opacity-[0.03]' : 'opacity-0'}`}
        style={{ 
          backgroundImage: "url('/gridworks-logo.png')", 
          backgroundRepeat: "repeat", 
          backgroundSize: "100px 100px",
          backgroundPosition: "center"
        }}
      />

      <TimeColumn
        startHour={START_HOUR}
        endHour={END_HOUR}
        slotHeight={SLOT_HEIGHT}
        paddingTop={GRID_PT}
      />

      {/* Day columns */}
      {visibleDays.map((day) => {
        const dayEntries = schedule.filter((e) => e.days?.includes(day));
        const layoutEntries = computeOverlaps(dayEntries);

        return (
          <div
            key={day}
            className="flex-1 relative border-l border-[var(--gw-border-color)] group/col hover:bg-[var(--gw-text-primary)]/[0.03] transition-colors duration-300"
          >
            {/* Day header */}
            <div className="h-14 flex items-center justify-center border-b border-[var(--gw-border-color)] bg-[var(--gw-bg-header)]/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-500">
              <span className="text-[11px] font-bold text-[var(--gw-text-primary)] uppercase tracking-widest">
                {day.substring(0, 3)}
              </span>
            </div>

            {/* Grid area */}
            <div className="relative" style={{ height: `${GRID_HEIGHT + GRID_PT + GRID_PB}px` }}>
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
                      top: `${Math.max(0, top) + GRID_PT}px`,
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
  if (entries.length === 0) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = [...entries].sort((a, b) => {
    const startDiff = timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(b.end_time) - timeToMinutes(a.end_time);
  });

  // Group into connected clusters (where entries transitively overlap)
  const clusters = [];
  for (const entry of sorted) {
    let placedInCluster = false;
    for (const cluster of clusters) {
      const overlaps = cluster.some((e) => {
        const startA = timeToMinutes(e.start_time);
        const endA = timeToMinutes(e.end_time);
        const startB = timeToMinutes(entry.start_time);
        const endB = timeToMinutes(entry.end_time);
        return startB < endA && startA < endB;
      });
      if (overlaps) {
        cluster.push(entry);
        placedInCluster = true;
        break;
      }
    }
    if (!placedInCluster) {
      clusters.push([entry]);
    }
  }

  const result = [];

  // Assign column indices for each cluster
  for (const cluster of clusters) {
    const columns = []; // columns[colIdx] = array of entries

    const clusterSorted = [...cluster].sort((a, b) => {
      return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });

    for (const entry of clusterSorted) {
      let colIdx = 0;
      let placed = false;

      while (colIdx < columns.length) {
        const hasOverlap = columns[colIdx].some((e) => {
          const startA = timeToMinutes(e.start_time);
          const endA = timeToMinutes(e.end_time);
          const startB = timeToMinutes(entry.start_time);
          const endB = timeToMinutes(entry.end_time);
          return startB < endA && startA < endB;
        });

        if (!hasOverlap) {
          columns[colIdx].push(entry);
          entry._colIdx = colIdx;
          placed = true;
          break;
        }
        colIdx++;
      }

      if (!placed) {
        columns.push([entry]);
        entry._colIdx = columns.length - 1;
      }
    }

    const totalCols = columns.length;
    for (const entry of cluster) {
      const colIdx = entry._colIdx;
      entry._layoutWidth =
        totalCols > 1 ? `calc(${100 / totalCols}% - 4px)` : "calc(100% - 4px)";
      entry._layoutLeft =
        totalCols > 1 ? `calc(${(colIdx * 100) / totalCols}% + 2px)` : "2px";
      result.push(entry);
    }
  }

  return result;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
