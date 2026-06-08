// src/components/canvas/CanvasScreen.jsx — Main canvas layout wrapper
"use client";

import { useRef, useState } from "react";
import ScheduleGrid from "./ScheduleGrid";
import StyleSidebar from "@/components/sidebar/StyleSidebar";
import ExportOverlay from "@/components/export/ExportOverlay";
import { useExport } from "@/hooks/useExport";

/**
 * Canvas Editor (PRD §8, Screen 3).
 *
 * Assembles the schedule grid, style sidebar, and export overlay.
 * Applies the active theme via data-theme attribute and inline style overrides.
 *
 * @param {Object} props
 * @param {Object} props.state — full app state
 * @param {function} props.updatePreferences
 * @param {function} props.updateEntry
 * @param {function} props.resetState
 * @param {function} props.setScreen — navigate between screens
 */
export default function CanvasScreen({
  state,
  updatePreferences,
  updateEntry,
  resetState,
  setScreen,
}) {
  const canvasRef = useRef(null);
  const {
    exportPNG,
    exportPDF,
    isExporting,
    showMobileModal,
    closeMobileModal,
  } = useExport(canvasRef);

  const [showExport, setShowExport] = useState(false);

  const prefs = state.preferences;

  // Build inline style overrides for user color/font selections
  const canvasOverrides = {};
  if (prefs.primary_color) canvasOverrides["--gw-bg-primary"] = prefs.primary_color;
  if (prefs.accent_color) canvasOverrides["--gw-accent"] = prefs.accent_color;
  if (prefs.font_family) canvasOverrides["--gw-font-display"] = prefs.font_family;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Main canvas area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Mobile banner */}
        <div className="block md:hidden mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Gridworks is best experienced on a larger screen. You can still export
          your schedule.
        </div>

        {/* Theme-scoped canvas wrapper */}
        <div
          ref={canvasRef}
          data-theme={prefs.theme_id || "minimalist_bureau"}
          className="w-full max-w-[1200px] mx-auto font-display"
          style={canvasOverrides}
        >
          <ScheduleGrid
            schedule={state.schedule}
            onUpdateEntry={updateEntry}
          />
        </div>
      </div>

      {/* Style sidebar */}
      <StyleSidebar
        prefs={prefs}
        onUpdate={updatePreferences}
        onExportPNG={() => setShowExport(true)}
        onExportPDF={() => setShowExport(true)}
        onReUpload={() => setScreen("intake")}
        onReset={resetState}
      />

      {/* Export overlay */}
      <ExportOverlay
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
        isExporting={isExporting}
        showMobileModal={showMobileModal}
        onCloseMobileModal={closeMobileModal}
      />
    </div>
  );
}
