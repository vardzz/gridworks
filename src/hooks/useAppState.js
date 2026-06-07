// src/hooks/useAppState.js — Central state hook + auto-save to localStorage
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadState,
  saveState,
  isStorageAvailable,
  getDefaultState,
} from "@/lib/storage";

/**
 * Central application state hook.
 *
 * - Loads persisted state from localStorage on mount (client-only).
 * - Debounces auto-saves by 500ms on every mutation.
 * - Exposes granular mutation helpers used by every screen/component.
 * - Tracks hydration, migration, and storage availability status.
 */
export function useAppState() {
  const [state, setState] = useState(getDefaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageError, setStorageError] = useState(null);

  const saveTimer = useRef(null);

  // ── Hydrate from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);

    const { state: loaded, needsMigration: migration } = loadState();
    setState(loaded);
    setNeedsMigration(migration);
    setIsHydrated(true);
  }, []);

  // ── Debounced save helper ───────────────────────────────────────────
  const debouncedSave = useCallback(
    (nextState) => {
      if (!storageAvailable) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const { error } = saveState(nextState);
        if (error) setStorageError(error);
      }, 500);
    },
    [storageAvailable]
  );

  // ── Core mutator — all public helpers go through this ───────────────
  const mutate = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave]
  );

  // ── Public mutation API ─────────────────────────────────────────────

  /** Shallow-merge a patch into preferences. */
  const updatePreferences = useCallback(
    (patch) =>
      mutate((s) => ({
        ...s,
        preferences: { ...s.preferences, ...patch },
      })),
    [mutate]
  );

  /** Replace the entire schedule array. */
  const setSchedule = useCallback(
    (entries) => mutate((s) => ({ ...s, schedule: entries })),
    [mutate]
  );

  /** Replace parse_metadata. */
  const setParseMetadata = useCallback(
    (meta) => mutate((s) => ({ ...s, parse_metadata: meta })),
    [mutate]
  );

  /** Patch a single entry by id. */
  const updateEntry = useCallback(
    (id, patch) =>
      mutate((s) => ({
        ...s,
        schedule: s.schedule.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      })),
    [mutate]
  );

  /** Append a new entry. */
  const addEntry = useCallback(
    (entry) => mutate((s) => ({ ...s, schedule: [...s.schedule, entry] })),
    [mutate]
  );

  /** Remove an entry by id. */
  const removeEntry = useCallback(
    (id) =>
      mutate((s) => ({
        ...s,
        schedule: s.schedule.filter((e) => e.id !== id),
      })),
    [mutate]
  );

  /** Reset to factory defaults and clear storage. */
  const resetState = useCallback(() => {
    const fresh = getDefaultState();
    setState(fresh);
    saveState(fresh);
    setNeedsMigration(false);
    setStorageError(null);
  }, []);

  /** Dismiss migration warning and accept the loaded state as-is. */
  const acceptMigration = useCallback(() => {
    setNeedsMigration(false);
    mutate((s) => ({ ...s, app_version: getDefaultState().app_version }));
  }, [mutate]);

  return {
    // Status
    isHydrated,
    needsMigration,
    storageAvailable,
    storageError,

    // State
    state,

    // Mutators
    updatePreferences,
    setSchedule,
    setParseMetadata,
    updateEntry,
    addEntry,
    removeEntry,
    resetState,
    acceptMigration,
  };
}
