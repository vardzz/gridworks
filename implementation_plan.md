# Gridworks — Claude Opus Implementation Blueprint (Phases 2-10)

This document provides deterministic, foolproof recipes for generating the production code for Gridworks. It strictly adheres to a 100% Client-Side architecture using Next.js App Router, Tailwind CSS v4, and vanilla JS web workers.

---

## PHASE 2: Central Storage & State Layer

### 🎯 Phase Objective
Establish a unified global state hook that reads/writes the application's schedule and user preferences to `localStorage` safely within Next.js SSR boundaries, handling initial hydration and version migration.

### 🗂️ Target Files
- `src/lib/storage.js`
- `src/hooks/useAppState.js`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/lib/storage.js`**
```javascript
import { DEFAULT_PREFERENCES } from "../constants/defaults";

const CURRENT_VERSION = "1.0.0";
const STORAGE_KEY = "gw_state_v1";

export function isStorageAvailable() {
  try {
    const test = "__test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

export function loadState() {
  if (typeof window === "undefined") return { state: getDefaultState(), needsMigration: false };
  
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: getDefaultState(), needsMigration: false };
    
    const saved = JSON.parse(raw);
    if (saved.app_version !== CURRENT_VERSION) {
      return { state: saved, needsMigration: true };
    }
    return { state: saved, needsMigration: false };
  } catch (error) {
    console.error("Failed to parse localStorage", error);
    return { state: getDefaultState(), needsMigration: false };
  }
}

export function saveState(state) {
  if (typeof window === "undefined") return { error: null };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { error: null };
  } catch (e) {
    if (e.name === "QuotaExceededError") return { error: "quota_exceeded" };
    return { error: e.message };
  }
}

export function getDefaultState() {
  return {
    app_version: CURRENT_VERSION,
    preferences: { ...DEFAULT_PREFERENCES },
    schedule: [],
    parse_metadata: null
  };
}
```

**`src/hooks/useAppState.js`**
```javascript
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { loadState, saveState, isStorageAvailable, getDefaultState } from "../lib/storage";

export function useAppState() {
  const [state, setState] = useState(getDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageError, setStorageError] = useState(null);
  
  const saveTimeout = useRef(null);

  useEffect(() => {
    setStorageAvailable(isStorageAvailable());
    const { state: loadedState, needsMigration: loadedMigration } = loadState();
    setState(loadedState);
    setNeedsMigration(loadedMigration);
    setIsHydrated(true);
  }, []);

  const mutateState = useCallback((updater) => {
    setState((prev) => {
      const nextState = updater(prev);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const { error } = saveState(nextState);
        if (error) setStorageError(error);
      }, 500);
      return nextState;
    });
  }, []);

  const updatePreferences = (patch) => mutateState(s => ({ ...s, preferences: { ...s.preferences, ...patch } }));
  const setSchedule = (entries) => mutateState(s => ({ ...s, schedule: entries }));
  const setParseMetadata = (meta) => mutateState(s => ({ ...s, parse_metadata: meta }));
  
  const updateEntry = (id, patch) => mutateState(s => ({
    ...s,
    schedule: s.schedule.map(entry => entry.id === id ? { ...entry, ...patch } : entry)
  }));
  const addEntry = (entry) => mutateState(s => ({ ...s, schedule: [...s.schedule, entry] }));
  const removeEntry = (id) => mutateState(s => ({ ...s, schedule: s.schedule.filter(e => e.id !== id) }));
  
  const resetState = () => mutateState(() => getDefaultState());

  return {
    isHydrated, state, needsMigration, storageAvailable, storageError,
    updatePreferences, setSchedule, setParseMetadata, updateEntry, addEntry, removeEntry, resetState
  };
}
```

### 🔗 Integration Points
- Exposes `state` to be injected directly into the `CanvasScreen` to drive UI.
- Auto-saves debounced state updates, enabling phase 6 and 7 (inline editing / theme switching) to automatically persist without manual "save" buttons.

### 🧪 Claude Verification Step
- Ensure the hook uses `"use client";` at the very top.
- Verify that `loadState()` avoids server-side `localStorage` reference errors by checking `typeof window === "undefined"`.

---

## PHASE 3: Automated File Parsing Engine Pipeline

### 🎯 Phase Objective
Construct the core client-side parsing pipeline to handle multi-format ingestion (PDF vector text, Image OCR) and regex tokenization, supplemented by Gemini 2.0 Flash fallback for complex edge cases.

### 🗂️ Target Files
- `src/lib/parser/pdfExtractor.js`
- `src/lib/parser/ocrExtractor.js`
- `src/lib/parser/regexTokenizer.js`
- `src/lib/parser/normalizer.js`
- `src/lib/parser/llmFallback.js`
- `src/hooks/useParser.js`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/lib/parser/pdfExtractor.js`**
```javascript
import * as pdfjsLib from "pdfjs-dist";
// Link to public worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}
```

**`src/lib/parser/ocrExtractor.js`**
```javascript
export async function extractTextFromImage(file, onProgress) {
  const Tesseract = await import("tesseract.js");
  const objectUrl = URL.createObjectURL(file);
  try {
    const result = await Tesseract.recognize(objectUrl, "eng", {
      logger: m => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    return result.data.text;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
```

**`src/lib/parser/normalizer.js`**
```javascript
export function normalizeDays(rawDayStr) {
  if (!rawDayStr) return [];
  const map = {
    m: "Monday", mon: "Monday",
    t: "Tuesday", tue: "Tuesday", th: "Thursday", thu: "Thursday", thurs: "Thursday",
    w: "Wednesday", wed: "Wednesday",
    f: "Friday", fri: "Friday",
    s: "Saturday", sat: "Saturday",
    su: "Sunday", sun: "Sunday"
  };
  // Split on common dividers or uppercase letter sequences (e.g. MWF)
  const tokens = rawDayStr.match(/[A-Z][a-z]*|th/gi) || [];
  const normalized = tokens.map(t => map[t.toLowerCase()]).filter(Boolean);
  return Array.from(new Set(normalized)); // Deduplicate
}

export function normalizeTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([ap]m?)/i);
  if (!match) return null;
  let [, hours, mins, meridiem] = match;
  hours = parseInt(hours, 10);
  if (meridiem.toLowerCase().startsWith('p') && hours < 12) hours += 12;
  if (meridiem.toLowerCase().startsWith('a') && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${mins}`;
}
```

**`src/lib/parser/llmFallback.js`**
```javascript
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const KEY = process.env.NEXT_PUBLIC_GEMINI_KEY;

export async function preCheckIsSchedule(file) {
  if (!KEY) return { isSchedule: true }; // Default to true if no key
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const res = await fetch(`${API_URL}?key=${KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Does this image contain a university class schedule? Reply with only {\"isSchedule\": true} or {\"isSchedule\": false}" },
            { inlineData: { mimeType: file.type, data: base64 } }
          ]
        }]
      })
    });
    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
  } catch (e) {
    return { isSchedule: true };
  }
}

export async function extractWithLLM(rawText) {
  if (!KEY) throw new Error("No Gemini key");
  const res = await fetch(`${API_URL}?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Extract all class schedule entries from the text below. Return ONLY a valid JSON array of objects with keys: subject_code, subject_title, professor, room, days (array of full day names), start_time (HH:MM 24h), end_time (HH:MM 24h). Fields not found should be null. Do not use markdown.\n\nTEXT:\n${rawText}` }]
      }]
    })
  });
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
  return JSON.parse(text);
}
```

### 🔗 Integration Points
- `useParser.js` will orchestrate these functions: reading `file.type`, triggering OCR/PDF, calling LLM fallback if tokenization yields low confidence (<0.7), and finally mapping outputs to `useAppState().setSchedule()`.

### 🧪 Claude Verification Step
- Ensure Tesseract.js is dynamically imported to avoid bloating the initial JS bundle.
- Ensure `pdf.worker.min.mjs` path matches the public directory location.

---

## PHASE 4: The Data Review Screen Interface

### 🎯 Phase Objective
Render an interactive spreadsheet-style view that allows users to manually correct OCR/PDF extraction mistakes before rendering the visual canvas.

### 🗂️ Target Files
- `src/components/review/ReviewScreen.jsx`
- `src/components/review/ReviewRow.jsx`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/components/review/ReviewScreen.jsx`**
```jsx
"use client";
import { useState } from "react";
import ReviewRow from "./ReviewRow";

export default function ReviewScreen({ parsedEntries, onConfirm, onBack, parseMetadata }) {
  const [entries, setEntries] = useState(parsedEntries || []);

  const handleUpdate = (id, field, value) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleAdd = () => {
    setEntries([...entries, { id: crypto.randomUUID(), subject_code: "", days: [], start_time: "", end_time: "" }]);
  };

  const confidenceScore = parseMetadata?.parse_confidence || 1.0;
  const bannerColor = confidenceScore >= 0.85 ? "bg-green-100 text-green-800" : confidenceScore >= 0.7 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6">
      {parseMetadata && (
        <div className={`p-4 rounded-md mb-6 ${bannerColor}`}>
          Confidence Score: {(confidenceScore * 100).toFixed(0)}%. Review highlighted fields.
        </div>
      )}
      <div className="flex-1 overflow-auto border rounded-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-gw-header border-b">
            <tr>
              <th className="p-3">Code</th><th>Title</th><th>Professor</th><th>Room</th><th>Days</th><th>Start</th><th>End</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <ReviewRow key={entry.id} entry={entry} onChange={(f, v) => handleUpdate(entry.id, f, v)} onRemove={() => setEntries(prev => prev.filter(e => e.id !== entry.id))} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gw-muted hover:text-gw-text">← Start over</button>
        <button onClick={handleAdd} className="px-4 py-2 border rounded-md">Add row</button>
        <button onClick={() => onConfirm(entries)} className="px-6 py-2 bg-gw-text text-gw-bg-primary rounded-md font-medium">Confirm & Build</button>
      </div>
    </div>
  );
}
```

### 🔗 Integration Points
- Receives output from `useParser.js`.
- On clicking "Confirm", passes the validated data to `useAppState().setSchedule()` and navigates the global app router string to `'canvas'`.

### 🧪 Claude Verification Step
- Ensure `ReviewRow.jsx` manages day selection via pill toggles modifying an array, not a string input.

---

## PHASE 5: The Schedule Canvas Core Grid

### 🎯 Phase Objective
Calculate vertical coordinate geometry mapping HH:MM strings to absolute pixel positions within an unbreakable HTML grid.

### 🗂️ Target Files
- `src/components/canvas/CanvasScreen.jsx`
- `src/components/canvas/ScheduleGrid.jsx`
- `src/components/canvas/ScheduleCell.jsx`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/components/canvas/ScheduleGrid.jsx`**
```jsx
import ScheduleCell from "./ScheduleCell";
import TimeColumn from "./TimeColumn";

// 48px = 30 mins, 96px = 1 hour. Day starts at 07:00.
const SLOT_HEIGHT = 48; 
const START_HOUR = 7;

export default function ScheduleGrid({ schedule, onUpdateEntry }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // Calculate overlaps inside each day column
  const getOverlaps = (dayEntries) => {
    // Implement overlap mapping logic here returning width percentages and left offsets
    return dayEntries.map(e => ({ ...e, width: "100%", left: "0%" }));
  };

  return (
    <div className="schedule-canvas relative flex bg-gw-bg-cell border border-gw-border rounded-gw-cell overflow-hidden min-h-[1344px]">
      <TimeColumn startHour={START_HOUR} slotHeight={SLOT_HEIGHT} />
      {days.map(day => {
        const dayEntries = schedule.filter(e => e.days.includes(day));
        const layoutEntries = getOverlaps(dayEntries);
        return (
          <div key={day} className="flex-1 relative border-l border-gw-border bg-gw-bg-primary/50">
            <div className="h-12 bg-gw-header flex items-center justify-center border-b border-gw-border font-display text-sm">
              {day}
            </div>
            <div className="relative w-full h-full">
              {layoutEntries.map((entry, idx) => {
                const [sH, sM] = entry.start_time.split(":").map(Number);
                const [eH, eM] = entry.end_time.split(":").map(Number);
                const top = ((sH - START_HOUR) * 60 + sM) / 30 * SLOT_HEIGHT;
                const height = ((eH * 60 + eM) - (sH * 60 + sM)) / 30 * SLOT_HEIGHT;
                return (
                  <ScheduleCell 
                    key={`${entry.id}-${day}`} entry={entry} 
                    style={{ top: `${top}px`, height: `${height}px`, width: entry.width, left: entry.left }}
                    colorIndex={idx} onUpdate={(patch) => onUpdateEntry(entry.id, patch)}
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
```

### 🔗 Integration Points
- Uses CSS variables (`bg-gw-bg-cell`, `border-gw-border`) which are strictly controlled by the Theme Injector in Phase 6.

### 🧪 Claude Verification Step
- Ensure absolute positioning calculates exact pixel alignments.

---

## PHASE 6: Style Customizer Sidebar & Token Injector

### 🎯 Phase Objective
Bind user aesthetic preferences to the Canvas wrapper via Tailwind v4 native CSS variable injection and `data-theme` attributes.

### 🗂️ Target Files
- `src/components/sidebar/StyleSidebar.jsx`
- `src/components/canvas/CanvasScreen.jsx`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/components/canvas/CanvasScreen.jsx`**
```jsx
"use client";
import { useRef } from "react";
import ScheduleGrid from "./ScheduleGrid";
import StyleSidebar from "../sidebar/StyleSidebar";
import ExportOverlay from "../export/ExportOverlay";
import { useExport } from "../../hooks/useExport";

export default function CanvasScreen({ state, updatePreferences, updateEntry }) {
  const canvasRef = useRef(null);
  const { exportPNG, exportPDF } = useExport(canvasRef);

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        {/* TOKEN INJECTOR WRAPPER */}
        <div 
          ref={canvasRef}
          data-theme={state.preferences.theme_id}
          className="w-full max-w-[1200px]"
          style={{
            ...(state.preferences.primary_color && { '--gw-bg-primary': state.preferences.primary_color }),
            ...(state.preferences.accent_color && { '--gw-accent': state.preferences.accent_color }),
            ...(state.preferences.font_family && { '--gw-font-display': state.preferences.font_family })
          }}
        >
          <ScheduleGrid schedule={state.schedule} onUpdateEntry={updateEntry} />
        </div>
      </div>
      <StyleSidebar prefs={state.preferences} onUpdate={updatePreferences} onExportPNG={exportPNG} onExportPDF={exportPDF} />
    </div>
  );
}
```

### 🔗 Integration Points
- Translates `useAppState().state.preferences` into active DOM CSS variables modifying Tailwind utilities.

### 🧪 Claude Verification Step
- Ensure `style={{}}` object merges user override colors, bypassing `data-theme` defaults dynamically without React re-mount faults.

---

## PHASE 7: Direct Inline Canvas Overrides

### 🎯 Phase Objective
Wrap cell text inside `contentEditable` primitives that blur into the `updateEntry` hook safely, allowing manual string overrides inside the SVG grid.

### 🗂️ Target Files
- `src/components/canvas/ScheduleCell.jsx`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/components/canvas/ScheduleCell.jsx`**
```jsx
"use client";
import { useRef } from "react";
import { sanitizeString } from "../../lib/sanitize";

export default function ScheduleCell({ entry, style, colorIndex, onUpdate }) {
  const handleBlur = (field, maxLength) => (e) => {
    const rawValue = e.currentTarget.textContent;
    const cleanValue = sanitizeString(rawValue, maxLength);
    if (cleanValue !== entry[field]) {
      onUpdate({ [field]: cleanValue });
    }
    e.currentTarget.textContent = cleanValue; // Reset view to sanitized
  };

  const palette = ["#FAD0C4", "#FFD1FF", "#BFF098", "#C2E9FB", "#A1C4FD"];
  const bgColor = entry.color_override || palette[colorIndex % palette.length];

  return (
    <div 
      className="absolute p-2 overflow-hidden flex flex-col gap-1 rounded-gw-cell border border-gw-border"
      style={{ ...style, backgroundColor: `var(--color-gw-cell, ${bgColor})` }}
    >
      <div 
        contentEditable 
        suppressContentEditableWarning
        onBlur={handleBlur("subject_code", 12)}
        className="font-display font-bold text-sm text-gw-text outline-none focus:ring-1 focus:ring-gw-accent"
      >
        {entry.subject_code}
      </div>
      <div 
        contentEditable 
        suppressContentEditableWarning
        onBlur={handleBlur("subject_title", 80)}
        className="font-body text-xs text-gw-text truncate outline-none focus:ring-1 focus:ring-gw-accent"
      >
        {entry.subject_title}
      </div>
      <div className="font-body text-[10px] text-gw-muted mt-auto">
        <span contentEditable suppressContentEditableWarning onBlur={handleBlur("room", 20)} className="outline-none">{entry.room}</span> • 
        <span contentEditable suppressContentEditableWarning onBlur={handleBlur("professor", 60)} className="outline-none ml-1">{entry.professor}</span>
      </div>
    </div>
  );
}
```

### 🔗 Integration Points
- Connected directly to `useAppState().updateEntry` via prop drilling.
- Implements `sanitizeString()` from Phase 9 immediately to prevent HTML injection into the DOM tree.

### 🧪 Claude Verification Step
- Ensure `suppressContentEditableWarning` is present to silence React warnings on `contentEditable` nodes with children.

---

## PHASE 8: Dual-Format Document Export Core

### 🎯 Phase Objective
Trigger highly localized `window.print()` isolated frames and DOM-to-Canvas PNG encoding.

### 🗂️ Target Files
- `src/hooks/useExport.js`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/hooks/useExport.js`**
```javascript
"use client";
import { useCallback } from "react";
import * as htmlToImage from 'html-to-image';

export function useExport(ref) {
  const exportPNG = useCallback(async () => {
    if (!ref.current) return;
    await document.fonts.ready; // Crucial for layout stability
    
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, {
        pixelRatio: Math.max(2, window.devicePixelRatio * 2), // HD multiplier
        backgroundColor: "var(--gw-bg-primary)"
      });
      const link = document.createElement('a');
      link.download = `Gridworks_Schedule_${new Date().getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  }, [ref]);

  const exportPDF = useCallback(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || 'ontouchstart' in window;
    if (isMobile) {
      return { showMobileModal: true };
    } else {
      window.print();
      return { showMobileModal: false };
    }
  }, []);

  return { exportPNG, exportPDF };
}
```

### 🔗 Integration Points
- Relies on `@media print` rules initialized in `globals.css` (Phase 1) which hide everything on the `<body>` except elements possessing the `.schedule-canvas` class tree.

### 🧪 Claude Verification Step
- Verify `await document.fonts.ready` is invoked. Without it, Google WebFonts won't render onto the canvas payload resulting in system-font fallbacks in the generated PNG.

---

## PHASE 9: Error Boundaries & Input Sanitization

### 🎯 Phase Objective
Mitigate DOM injection risks from OCR text mutations and safeguard local state constraints.

### 🗂️ Target Files
- `src/lib/sanitize.js`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/lib/sanitize.js`**
```javascript
export function sanitizeString(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  // Strip all HTML injection
  const noHtml = value.replace(/<[^>]*>?/gm, "");
  // Trim spaces and newlines
  const trimmed = noHtml.replace(/\s+/g, " ").trim();
  // Enforce rigid max length slice
  return trimmed.substring(0, maxLength);
}

export function sanitizeEntry(entry) {
  return {
    ...entry,
    subject_code: sanitizeString(entry.subject_code, 12),
    subject_title: sanitizeString(entry.subject_title, 80),
    professor: sanitizeString(entry.professor, 60),
    room: sanitizeString(entry.room, 20),
    days: Array.isArray(entry.days) ? entry.days : [],
  };
}
```

### 🔗 Integration Points
- Called in `regexTokenizer.js`, `ReviewScreen.jsx` before committing to state, and `ScheduleCell.jsx` on blur triggers.

### 🧪 Claude Verification Step
- Verify regex strips HTML brackets robustly `/<[^>]*>?/gm`.

---

## PHASE 10: Landing Page Assembly

### 🎯 Phase Objective
A statically generated compositional Next.js layout acting as the marketing portal pointing seamlessly into the client-side Single Page Application route.

### 🗂️ Target Files
- `src/app/page.jsx`

### 💾 Full Code Blocks / Architectural Blueprints

**`src/app/page.jsx`**
```jsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b">
        <div className="font-display font-bold text-xl tracking-tight">Gridworks</div>
        <Link href="/app" className="text-sm font-medium hover:text-gw-accent flex items-center gap-1">
          Try Gridworks <ArrowRight size={16} />
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-5xl md:text-6xl font-display font-bold max-w-3xl leading-tight tracking-tighter mb-6">
          Drop your registration form.<br />Get a beautiful schedule.
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-10">
          Gridworks reads your university schedule PDF and renders it as a print-ready, styled grid instantly in your browser.
        </p>
        <Link href="/app" className="bg-black text-white px-8 py-4 rounded-md font-medium text-lg hover:bg-neutral-800 transition shadow-lg">
          Try Gridworks for free →
        </Link>
        
        {/* Placeholder for Hero Preview Image */}
        <div className="mt-20 w-full max-w-5xl aspect-video bg-neutral-100 border rounded-xl overflow-hidden shadow-2xl flex items-center justify-center text-neutral-400">
          [ Hero Preview of Canvas ]
        </div>
      </main>
      
      <footer className="py-8 text-center text-sm text-neutral-500 border-t mt-auto">
        Built with Next.js • Gridworks Open Source 2026
      </footer>
    </div>
  );
}
```

### 🔗 Integration Points
- Exists outside the `<AppRouter>` state memory. Clicking the `/app` link will trigger the hydration sequence constructed in Phase 2 natively.

### 🧪 Claude Verification Step
- Ensure Lucide React icons are installed in `package.json`.
- Ensure standard `next/link` is utilized for CSR navigation transitions.
