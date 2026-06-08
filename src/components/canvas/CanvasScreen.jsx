// src/components/canvas/CanvasScreen.jsx — Main canvas layout wrapper
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ScheduleGrid from "./ScheduleGrid";
import StyleSidebar from "@/components/sidebar/StyleSidebar";
import ExportOverlay from "@/components/export/ExportOverlay";
import { useExport } from "@/hooks/useExport";
import { Palette } from "lucide-react";

/**
 * Canvas Editor (PRD §8, Screen 3).
 *
 * Assembles the schedule grid, style sidebar, and export overlay.
 * Applies the active theme via data-theme attribute and inline style overrides.
 *
 * On screens < lg (1024px), the sidebar converts to a slide-in drawer
 * triggered by a floating action button.
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);

  const prefs = state.preferences;

  // Build inline style overrides for user color/font selections
  const canvasOverrides = {};
  if (prefs.primary_color) canvasOverrides["--gw-bg-primary"] = prefs.primary_color;
  if (prefs.accent_color) canvasOverrides["--gw-accent"] = prefs.accent_color;
  if (prefs.font_family) {
    canvasOverrides["--gw-font-display"] = prefs.font_family;
    canvasOverrides["fontFamily"] = prefs.font_family;
  }

  // Drawer close with animation
  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 250);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div 
      className="flex h-screen overflow-hidden bg-neutral-100"
      data-theme={prefs.theme_id || "minimalist_bureau"}
      style={{ ...canvasOverrides, fontFamily: prefs.font_family || "var(--gw-font-display)" }}
    >
      {/* Main canvas area */}
      <div className="flex-1 overflow-auto p-6 max-sm:p-3">
        {/* Mobile banner */}
        <div className="block md:hidden mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Gridworks is best experienced on a larger screen. You can still export
          your schedule.
        </div>

        {/* Theme-scoped canvas wrapper — horizontally scrollable on mobile */}
        <div className="overflow-x-auto max-lg:-mx-3 max-lg:px-3">
          <div
            ref={canvasRef}
            className="w-full max-w-[1200px] mx-auto"
          >
            <ScheduleGrid
              schedule={state.schedule}
              onUpdateEntry={updateEntry}
              isExporting={isExporting}
            />
          </div>
        </div>
      </div>

      {/* ═══ Desktop Style Sidebar (visible lg and up) ═══ */}
      <div className="hidden lg:block h-full">
        <StyleSidebar
          prefs={prefs}
          onUpdate={updatePreferences}
          onExportPNG={() => setShowExport(true)}
          onExportPDF={() => setShowExport(true)}
          onEditSchedule={() => setScreen("review")}
          onReUpload={() => setScreen("intake")}
          onReset={resetState}
        />
      </div>

      {/* ═══ Mobile FAB (visible below lg) ═══ */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#fca311] shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95 cursor-pointer"
          title="Open style panel"
        >
          <Palette className="text-black" size={22} />
        </button>
      )}

      {/* ═══ Mobile Drawer Overlay (below lg) ═══ */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 drawer-backdrop ${drawerClosing ? "animate-fade-out" : "animate-fade-in"}`}
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <div 
            className={`relative w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col ${
              drawerClosing ? "animate-slide-out-right" : "animate-slide-in-right"
            }`}
          >
            {/* Drawer header with close */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-alabaster-grey/50">
              <span className="text-base font-bold text-prussian-blue-200 tracking-wide">Style</span>
              <button
                onClick={closeDrawer}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 text-alabaster-grey-400 hover:text-prussian-blue-700 transition-all cursor-pointer"
                title="Close drawer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Sidebar content — reuse StyleSidebar in drawer mode */}
            <StyleSidebar
              prefs={prefs}
              onUpdate={updatePreferences}
              onExportPNG={() => { closeDrawer(); setShowExport(true); }}
              onExportPDF={() => { closeDrawer(); setShowExport(true); }}
              onEditSchedule={() => { closeDrawer(); setScreen("review"); }}
              onReUpload={() => setScreen("intake")}
              onReset={resetState}
              isMobileDrawer
            />
          </div>
        </div>
      )}

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
