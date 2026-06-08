// src/components/sidebar/StyleSidebar.jsx — Collapsible sidebar wrapper
"use client";

import { useState } from "react";
import ThemePicker from "./ThemePicker";
import ColorOverrides from "./ColorOverrides";
import { AVAILABLE_FONTS } from "@/lib/themes";

/**
 * Collapsible style sidebar on the right side of the canvas.
 * Contains: ThemePicker, ColorOverrides, font selector, paper size toggle.
 *
 * @param {Object} props
 * @param {Object} props.prefs — state.preferences
 * @param {function} props.onUpdate — updatePreferences(patch)
 * @param {function} props.onExportPNG
 * @param {function} props.onExportPDF
 * @param {function} props.onReUpload — navigate back to intake
 * @param {function} props.onReset — reset state
 */
export default function StyleSidebar({
  prefs,
  onUpdate,
  onExportPNG,
  onExportPDF,
  onReUpload,
  onReset,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <div className="w-72 border-l border-alabaster-grey bg-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-alabaster-grey">
        <span className="text-sm font-semibold text-prussian-blue-200">Style</span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-alabaster-grey-400 hover:text-prussian-blue-700 transition-colors cursor-pointer text-sm"
          title="Collapse sidebar"
        >
          ▶
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Theme Picker */}
        <ThemePicker
          activeThemeId={prefs.theme_id}
          onSelect={(id) => onUpdate({ theme_id: id })}
        />

        {/* Color Overrides */}
        <ColorOverrides
          primaryColor={prefs.primary_color}
          accentColor={prefs.accent_color}
          onUpdate={onUpdate}
        />

        {/* Font Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-alabaster-grey-300 uppercase tracking-wider">
            Display Font
          </label>
          <select
            value={prefs.font_family || "Inter"}
            onChange={(e) => onUpdate({ font_family: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-alabaster-grey rounded-lg bg-white cursor-pointer"
          >
            {AVAILABLE_FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.name}
              </option>
            ))}
          </select>
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
          className="w-full inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          Export PNG (HD)
        </button>
        <button
          onClick={onExportPDF}
          className="w-full inline-flex items-center justify-center bg-transparent border-2 border-black text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          Export PDF
        </button>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onReUpload}
            className="flex-1 py-2 text-xs text-alabaster-grey-300 hover:text-prussian-blue-700 transition-colors cursor-pointer"
          >
            Re-upload
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-2 text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
