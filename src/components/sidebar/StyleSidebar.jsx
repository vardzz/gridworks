// src/components/sidebar/StyleSidebar.jsx — Collapsible sidebar wrapper
"use client";

import { useState } from "react";
import ThemePicker from "./ThemePicker";
import ColorOverrides from "./ColorOverrides";
import { THEME_PRESETS, AVAILABLE_FONTS } from "@/lib/themes";

/**
 * Collapsible style sidebar on the right side of the canvas.
 * Contains: ThemePicker, ColorOverrides, font selector, paper size toggle.
 *
 * When `isMobileDrawer` is true, the sidebar renders without its own width/border/collapse
 * controls — it fills the parent drawer container instead.
 *
 * @param {Object} props
 * @param {Object} props.prefs — state.preferences
 * @param {function} props.onUpdate — updatePreferences(patch)
 * @param {function} props.onExportPNG
 * @param {function} props.onExportPDF
 * @param {function} props.onReUpload — navigate back to intake
 * @param {function} props.onReset — reset state
 * @param {boolean} [props.isMobileDrawer=false] — true when rendered inside mobile drawer
 */
export default function StyleSidebar({
  prefs,
  onUpdate,
  onExportPNG,
  onExportPDF,
  onReUpload,
  onReset,
  isMobileDrawer = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ── Mobile drawer mode: no collapse, fill parent ──────────────────
  if (isMobileDrawer) {
    const activeTheme = THEME_PRESETS[prefs.theme_id || "minimalist_bureau"];
    const defaultPrimary = activeTheme?.previewColors[0] || "#fafaf8";
    const defaultAccent = activeTheme?.previewColors[3] || "#2d5be3";

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <ThemePicker
            activeThemeId={prefs.theme_id}
            onSelect={(id) => onUpdate({ theme_id: id, primary_color: null, accent_color: null, font_family: null })}
          />
          <ColorOverrides
            primaryColor={prefs.primary_color}
            accentColor={prefs.accent_color}
            defaultPrimary={defaultPrimary}
            defaultAccent={defaultAccent}
            onUpdate={onUpdate}
          />
          {/* Font Selector */}
          <div className="space-y-3 relative">
            <label className="text-xs font-bold text-alabaster-grey-300 uppercase tracking-widest">
              Display Font
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  const menu = document.getElementById("font-dropdown-menu-drawer");
                  menu.classList.toggle("hidden");
                }}
                className="w-full text-left px-4 py-3 text-sm font-semibold border-2 border-alabaster-grey/50 rounded-xl bg-white text-prussian-blue-200 cursor-pointer focus:outline-none focus:border-prussian-blue-200 transition-all shadow-sm hover:shadow flex justify-between items-center"
              >
                {AVAILABLE_FONTS.find(f => f.id === (prefs.font_family || "var(--font-inter)"))?.name || "Inter"}
                <svg className="fill-current h-4 w-4 text-alabaster-grey-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </button>
              <div 
                id="font-dropdown-menu-drawer" 
                className="hidden absolute z-50 mt-2 w-full bg-white border border-alabaster-grey/50 rounded-xl shadow-xl overflow-hidden py-1"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onUpdate({ font_family: font.id });
                      document.getElementById("font-dropdown-menu-drawer").classList.add("hidden");
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 ${
                      (prefs.font_family || "var(--font-inter)") === font.id 
                        ? "text-prussian-blue-700 bg-blue-50/50" 
                        : "text-prussian-blue-200"
                    }`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Paper Size */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-alabaster-grey-300 uppercase tracking-wider">
              Paper Size
            </label>
            <div className="flex gap-2">
              {["A4", "Letter"].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdate({ paper_size: size })}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-colors cursor-pointer min-h-[44px] ${
                    prefs.paper_size === size
                      ? "border-[var(--gw-accent)] bg-blue-50 text-[var(--gw-accent)]"
                      : "border-alabaster-grey text-prussian-blue-700 hover:border-alabaster-grey-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="p-4 border-t border-alabaster-grey space-y-2">
          <button
            onClick={onExportPNG}
            className="w-full inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-3 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[48px]"
          >
            Download Image (PNG)
          </button>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onReUpload}
              className="flex-1 inline-flex items-center justify-center bg-transparent text-prussian-blue-200 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-neutral-200 cursor-pointer min-h-[44px]"
            >
              Re-upload
            </button>
            <button
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center bg-transparent text-red-500 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-red-50 cursor-pointer min-h-[44px]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop mode: collapsible sidebar ─────────────────────────────

  if (isCollapsed) {
    return (
      <div className="w-10 border-l border-alabaster-grey bg-white flex flex-col items-center py-4 gap-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-alabaster-grey-400 hover:text-prussian-blue-700 transition-colors cursor-pointer text-lg"
          title="Expand sidebar"
        >
          ◀
        </button>
      </div>
    );
  }

  const activeTheme = THEME_PRESETS[prefs.theme_id || "minimalist_bureau"];
  const defaultPrimary = activeTheme?.previewColors[0] || "#fafaf8";
  const defaultAccent = activeTheme?.previewColors[3] || "#2d5be3";

  return (
    <div className="w-72 border-l border-alabaster-grey bg-white flex flex-col overflow-hidden shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-alabaster-grey/50">
        <span className="text-base font-bold text-prussian-blue-200 tracking-wide">Style</span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-alabaster-grey-400 hover:text-prussian-blue-700 transition-all cursor-pointer"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Theme Picker */}
        <ThemePicker
          activeThemeId={prefs.theme_id}
          onSelect={(id) => onUpdate({ theme_id: id, primary_color: null, accent_color: null, font_family: null })}
        />

        {/* Color Overrides */}
        <ColorOverrides
          primaryColor={prefs.primary_color}
          accentColor={prefs.accent_color}
          defaultPrimary={defaultPrimary}
          defaultAccent={defaultAccent}
          onUpdate={onUpdate}
        />

        {/* Font Selector */}
        <div className="space-y-3 relative">
          <label className="text-xs font-bold text-alabaster-grey-300 uppercase tracking-widest">
            Display Font
          </label>
          <div className="relative">
            <button
              onClick={() => {
                const menu = document.getElementById("font-dropdown-menu");
                menu.classList.toggle("hidden");
              }}
              className="w-full text-left px-4 py-3 text-sm font-semibold border-2 border-alabaster-grey/50 rounded-xl bg-white text-prussian-blue-200 cursor-pointer focus:outline-none focus:border-prussian-blue-200 transition-all shadow-sm hover:shadow flex justify-between items-center"
            >
              {AVAILABLE_FONTS.find(f => f.id === (prefs.font_family || "var(--font-inter)"))?.name || "Inter"}
              <svg className="fill-current h-4 w-4 text-alabaster-grey-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </button>
            
            {/* Custom Dropdown Menu */}
            <div 
              id="font-dropdown-menu" 
              className="hidden absolute z-50 mt-2 w-full bg-white border border-alabaster-grey/50 rounded-xl shadow-xl overflow-hidden py-1"
            >
              {AVAILABLE_FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    onUpdate({ font_family: font.id });
                    document.getElementById("font-dropdown-menu").classList.add("hidden");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 ${
                    (prefs.font_family || "var(--font-inter)") === font.id 
                      ? "text-prussian-blue-700 bg-blue-50/50" 
                      : "text-prussian-blue-200"
                  }`}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Paper Size */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-alabaster-grey-300 uppercase tracking-wider">
            Paper Size
          </label>
          <div className="flex gap-2">
            {["A4", "Letter"].map((size) => (
              <button
                key={size}
                onClick={() => onUpdate({ paper_size: size })}
                className={`flex-1 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                  prefs.paper_size === size
                    ? "border-[var(--gw-accent)] bg-blue-50 text-[var(--gw-accent)]"
                    : "border-alabaster-grey text-prussian-blue-700 hover:border-alabaster-grey-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="p-4 border-t border-alabaster-grey space-y-2">
        <button
          onClick={onExportPNG}
          className="w-full inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-3 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          Download Image (PNG)
        </button>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onReUpload}
            className="flex-1 inline-flex items-center justify-center bg-transparent text-prussian-blue-200 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-neutral-200 cursor-pointer"
          >
            Re-upload
          </button>
          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center bg-transparent text-red-500 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-red-50 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
