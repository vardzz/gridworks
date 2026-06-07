// src/components/sidebar/ThemePicker.jsx — 4 theme cards
"use client";

import { THEME_PRESETS } from "@/lib/themes";

/**
 * Renders 4 theme selection cards. Clicking a card updates the active theme.
 *
 * @param {Object} props
 * @param {string} props.activeThemeId — current theme_id from preferences
 * @param {function} props.onSelect — (themeId) => void
 */
export default function ThemePicker({ activeThemeId, onSelect }) {
  const themes = Object.values(THEME_PRESETS);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-alabaster-grey-300 uppercase tracking-wider">
        Theme
      </label>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer hover:shadow-sm ${
                isActive
                  ? "border-[var(--gw-accent)] shadow-md"
                  : "border-alabaster-grey hover:border-alabaster-grey-400"
              }`}
            >
              {/* Color swatch strip */}
              <div className="flex gap-1 mb-2">
                {theme.previewColors.map((color, i) => (
                  <div
                    key={i}
                    className="h-4 flex-1 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-xs font-medium text-prussian-blue-200 truncate">
                {theme.name}
              </div>
              {isActive && (
                <div className="text-[10px] text-[var(--gw-accent)] mt-0.5">
                  Active ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
