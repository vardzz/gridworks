// src/app/app/page.jsx — Main app tool page (screen router)
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Zap, Settings, Grid as GridIcon, FileCheck, Rocket, UploadCloud, Calendar, Table, Layout, Image as ImageIcon, Edit3, Monitor } from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useParser } from "@/hooks/useParser";

// Dynamic imports to avoid SSR issues with pdfjs-dist/tesseract.js
const IntakeScreen = dynamic(
  () => import("@/components/intake/IntakeScreen"),
  { ssr: false }
);
const ReviewScreen = dynamic(
  () => import("@/components/review/ReviewScreen"),
  { ssr: false }
);
const CanvasScreen = dynamic(
  () => import("@/components/canvas/CanvasScreen"),
  { ssr: false }
);

/**
 * App Tool Page — Screen Router (PRD §8).
 *
 * Manages which screen is active: 'intake', 'review', or 'canvas'.
 * Passes useAppState and useParser down as props.
 * Shows persistent banners for migration and storage warnings.
 */
export default function AppPage() {
  const appState = useAppState();
  const parser = useParser();

  const {
    isHydrated,
    state,
    needsMigration,
    storageAvailable,
    storageError,
    updatePreferences,
    setSchedule,
    setParseMetadata,
    updateEntry,
    resetState,
    acceptMigration,
  } = appState;

  // Start on canvas if schedule exists, otherwise intake
  const [screen, setScreen] = useState(() =>
    state.schedule?.length > 0 ? "canvas" : "intake"
  );

  // Parse result state for passing between intake → review
  const [parseResult, setParseResult] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  // ── Screen navigation handlers ──────────────────────────────────────

  const handleParsed = useCallback((result) => {
    setParseResult(result);
    setIsManualEntry(false);
    setScreen("review");
  }, []);

  const handleManualEntry = useCallback(() => {
    setParseResult(null);
    setIsManualEntry(true);
    setScreen("review");
  }, []);

  const handleReviewConfirm = useCallback(
    (entries) => {
      setSchedule(entries);
      if (parseResult) {
        setParseMetadata({
          source_type: parseResult.sourceType || "manual",
          parse_confidence: parseResult.confidence || 1.0,
          parse_warnings: [],
          parsed_at: new Date().toISOString(),
        });
      } else {
        setParseMetadata({
          source_type: "manual",
          parse_confidence: 1.0,
          parse_warnings: [],
          parsed_at: new Date().toISOString(),
        });
      }
      setScreen("canvas");
    },
    [setSchedule, setParseMetadata, parseResult]
  );

  const handleBackToIntake = useCallback(() => {
    setParseResult(null);
    setIsManualEntry(false);
    setScreen("intake");
  }, []);

  // ── Wait for hydration ─────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-alabaster-grey-400 border-t-prussian-blue-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      {/* Floating Background Icons */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-[5%] left-[8%] text-prussian-blue-300 animate-drift-1"><Zap size={80} strokeWidth={1} /></div>
        <div className="absolute top-[35%] right-[6%] text-[#fca311] animate-drift-2"><Settings size={100} strokeWidth={1} /></div>
        <div className="absolute bottom-[10%] left-[12%] text-alabaster-grey-900 animate-drift-3"><GridIcon size={120} strokeWidth={1} /></div>
        <div className="absolute bottom-[15%] right-[10%] text-prussian-blue-300 animate-drift-1" style={{animationDelay: '-2s'}}><FileCheck size={70} strokeWidth={1.5} /></div>
        <div className="absolute top-[55%] left-[5%] text-alabaster-grey-900 animate-drift-2" style={{animationDelay: '-5s'}}><Rocket size={90} strokeWidth={1} /></div>
        <div className="absolute top-[15%] right-[15%] text-prussian-blue-300 animate-drift-3" style={{animationDelay: '-1s'}}><UploadCloud size={60} strokeWidth={1} /></div>
        <div className="absolute bottom-[45%] right-[5%] text-[#fca311] animate-drift-1" style={{animationDelay: '-3s'}}><Calendar size={110} strokeWidth={1} /></div>
        <div className="absolute bottom-[5%] left-[30%] text-prussian-blue-300 animate-drift-2" style={{animationDelay: '-4s'}}><Table size={85} strokeWidth={1.2} /></div>
        <div className="absolute top-[15%] left-[20%] text-alabaster-grey-900 animate-drift-1" style={{animationDelay: '-6s'}}><Layout size={75} strokeWidth={1} /></div>
        <div className="absolute bottom-[5%] right-[30%] text-[#fca311] animate-drift-3" style={{animationDelay: '-2.5s'}}><ImageIcon size={65} strokeWidth={1.5} /></div>
        <div className="absolute top-[5%] right-[35%] text-alabaster-grey-900 animate-drift-2" style={{animationDelay: '-4.5s'}}><Edit3 size={95} strokeWidth={1} /></div>
        <div className="absolute top-[30%] left-[5%] text-prussian-blue-300 animate-drift-1" style={{animationDelay: '-1.5s'}}><Monitor size={70} strokeWidth={1.2} /></div>
      </div>

      {/* Persistent banners */}
      {needsMigration && (
        <div className="relative z-10 px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-sm">
          <span className="text-amber-800">
            Your saved schedule was created with an older version of Gridworks.
            It may display incorrectly.
          </span>
          <div className="flex gap-3">
            <button
              onClick={acceptMigration}
              className="text-amber-700 font-medium hover:underline cursor-pointer"
            >
              Keep anyway
            </button>
            <button
              onClick={() => {
                resetState();
                setScreen("intake");
              }}
              className="text-amber-700 font-medium hover:underline cursor-pointer"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {!storageAvailable && (
        <div className="relative z-10 px-4 py-2 bg-alabaster-grey-800 border-b text-xs text-prussian-blue-700 text-center">
          Your schedule won&apos;t be saved between sessions in this browser
          mode.
        </div>
      )}

      {storageError === "quota_exceeded" && (
        <div className="relative z-10 px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 text-center">
          Couldn&apos;t save your schedule. Try clearing unused browser data.
        </div>
      )}

      {/* Screen router */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {screen === "intake" && (
          <IntakeScreen
            parser={parser}
            onParsed={handleParsed}
            onManualEntry={handleManualEntry}
          />
        )}

        {screen === "review" && (
          <ReviewScreen
            parsedEntries={parseResult?.entries || []}
            parseMetadata={
              parseResult
                ? {
                    parse_confidence: parseResult.confidence,
                    parse_warnings: [],
                  }
                : null
            }
            isManualEntry={isManualEntry}
            onConfirm={handleReviewConfirm}
            onBack={handleBackToIntake}
          />
        )}

        {screen === "canvas" && (
          <CanvasScreen
            state={state}
            updatePreferences={updatePreferences}
            updateEntry={updateEntry}
            resetState={() => {
              resetState();
              setScreen("intake");
            }}
            setScreen={setScreen}
          />
        )}
      </div>
    </div>
  );
}
