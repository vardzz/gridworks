// src/lib/storage.js — localStorage read/write/check helpers
import { APP_VERSION, DEFAULT_PREFERENCES } from "@/constants/defaults";

const STORAGE_KEY = "gw_state_v1";

/**
 * Tests whether localStorage is available in the current browser context.
 * Returns false in incognito/private browsing modes or when storage is disabled.
 */
export function isStorageAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__gw_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the default app state used on first launch or after a reset.
 * Matches PRD §3.1 and §11.3 exactly.
 */
export function getDefaultState() {
  return {
    app_version: APP_VERSION,
    preferences: {
      theme_mode: "light",
      layout_type: "weekly_grid",
      theme_id: "minimalist_bureau",
      primary_color: null,
      accent_color: null,
      font_family: "Inter",
      paper_size: "A4",
    },
    schedule: [],
    parse_metadata: null,
  };
}

/**
 * Reads the persisted state from localStorage.
 * Returns { state, needsMigration } — safe against SSR, parse failures, and missing keys.
 */
export function loadState() {
  if (typeof window === "undefined") {
    return { state: getDefaultState(), needsMigration: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: getDefaultState(), needsMigration: false };
    }

    const saved = JSON.parse(raw);

    if (saved.app_version !== APP_VERSION) {
      return { state: saved, needsMigration: true };
    }

    return { state: saved, needsMigration: false };
  } catch {
    console.error("[Gridworks] Failed to parse saved state — loading defaults.");
    return { state: getDefaultState(), needsMigration: false };
  }
}

/**
 * Serializes and writes the full app state to localStorage.
 * Returns { error: null } on success or { error: string } on failure.
 */
export function saveState(state) {
  if (typeof window === "undefined") return { error: null };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { error: null };
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return { error: "quota_exceeded" };
    }
    return { error: e.message || "unknown_error" };
  }
}

/**
 * Clears the entire Gridworks state from localStorage.
 */
export function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore — storage may be unavailable
  }
}
