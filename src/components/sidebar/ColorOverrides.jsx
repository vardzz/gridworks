// src/components/sidebar/ColorOverrides.jsx — Primary/accent color inputs
"use client";

/**
 * Two color picker inputs for overriding Primary and Accent colors.
 * A "Reset" link next to each clears the override back to null.
 *
 * @param {Object} props
 * @param {string|null} props.primaryColor
 * @param {string|null} props.accentColor
 * @param {string|null} props.defaultPrimary
 * @param {string|null} props.defaultAccent
 * @param {function} props.onUpdate — (patch) => void
 */
export default function ColorOverrides({ primaryColor, accentColor, defaultPrimary, defaultAccent, onUpdate }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-alabaster-grey-300 uppercase tracking-wider">
        Color Overrides
      </label>

      {/* Primary Color */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-prussian-blue-700 mb-1 block">Primary</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor || defaultPrimary}
              onInput={(e) => onUpdate({ primary_color: e.target.value })}
              onChange={(e) => onUpdate({ primary_color: e.target.value })}
              className="w-8 h-8 rounded border border-alabaster-grey cursor-pointer"
            />
            <span className="text-xs text-alabaster-grey-300 font-mono">
              {primaryColor || "Theme default"}
            </span>
          </div>
        </div>
        {primaryColor && (
          <button
            onClick={() => onUpdate({ primary_color: null })}
            className="text-xs text-alabaster-grey-400 hover:text-prussian-blue-700 cursor-pointer mt-4"
          >
            Reset
          </button>
        )}
      </div>

      {/* Accent Color */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-prussian-blue-700 mb-1 block">Accent</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor || defaultAccent}
              onInput={(e) => onUpdate({ accent_color: e.target.value })}
              onChange={(e) => onUpdate({ accent_color: e.target.value })}
              className="w-8 h-8 rounded border border-alabaster-grey cursor-pointer"
            />
            <span className="text-xs text-alabaster-grey-300 font-mono">
              {accentColor || "Theme default"}
            </span>
          </div>
        </div>
        {accentColor && (
          <button
            onClick={() => onUpdate({ accent_color: null })}
            className="text-xs text-alabaster-grey-400 hover:text-prussian-blue-700 cursor-pointer mt-4"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
