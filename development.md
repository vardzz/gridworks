# Gridworks — Development Guide

**Version:** 2.0.0
**Stack:** Next.js
**AI Model:** Google Gemini 2.0 Flash (free via Google AI Studio)
**Reference PRD:** gridworks-prd.md v1.1.0

---

## §0 — Framework Decision: Next.js

This guide uses **Next.js with the App Router**. Two pages are used: `app/page.jsx` (landing), `app/app/page.jsx` (the tool). The "Try Gridworks" button is a `<Link href="/app">`.

---

## §1 — AI Model: Google Gemini 2.0 Flash

All AI calls in this project use **Gemini 2.0 Flash** via the Google AI Studio REST API.

**Why this model:**

- Free tier available at Google AI Studio (aistudio.google.com)
- Supports image input — needed for the pre-check feature
- Fast response time — suitable for the UX flow
- Returns clean JSON when prompted correctly

**API setup:**

- Get a free API key from aistudio.google.com
- Store it as `NEXT_PUBLIC_GEMINI_KEY` in your `.env.local` file
- Base URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Authentication: pass key as query param `?key=YOUR_KEY`

**Request format:** POST with a `contents` array. For text-only, one part with `text`. For image input, two parts: one `inlineData` (base64 image) and one `text` (the prompt).

**Response format:** `response.candidates[0].content.parts[0].text` — always a string. If you asked for JSON, parse that string.

**The two AI functions you need to build** (both go in `src/lib/parser/llmFallback.js`):

1. `preCheckIsSchedule(file)` — takes an image file, sends it to Gemini with a yes/no prompt, returns `{ isSchedule: boolean }`. Use `gemini-2.0-flash` model. Convert the image to base64 before sending. If the API call fails for any reason, default to `{ isSchedule: true }` so the user isn't blocked.

2. `extractWithLLM(rawText)` — takes raw extracted text, sends it to Gemini with a structured extraction prompt, returns a parsed schedule array. The prompt must tell Gemini to return ONLY a JSON array with no markdown fences, no explanation. Parse the response string with `JSON.parse()`. Wrap in try/catch — if parsing fails, throw so the orchestrator can fall back to regex results.

**Important note on the `preCheckIsSchedule` function:** This is the only function that sends image data outside the user's device. You must show a consent prompt the first time this triggers (see Phase 3).

---

## §2 — Project Structure

```
gridworks/
├── app/                          (Next.js App Router)
│   ├── layout.jsx                Root layout — fonts, global CSS, metadata
│   ├── page.jsx                  Landing page
│   └── app/
│       └── page.jsx              Main app tool page
├── components/
│   ├── landing/
│   │   ├── Navbar.jsx            Logo + "Try Gridworks" CTA
│   │   ├── Hero.jsx              Headline, subtext, CTA button
│   │   ├── HowItWorks.jsx        3-step process section
│   │   ├── ThemePreview.jsx      Visual preview of the 4 themes
│   │   └── Footer.jsx            Simple footer
│   ├── intake/
│   │   ├── IntakeScreen.jsx      Drop zone + file picker UI
│   │   └── FileValidator.jsx     Type/size check logic as a hook or util
│   ├── review/
│   │   ├── ReviewScreen.jsx      Editable table of parsed entries
│   │   └── ReviewRow.jsx         Single editable row component
│   ├── canvas/
│   │   ├── CanvasScreen.jsx      Main canvas layout wrapper
│   │   ├── ScheduleGrid.jsx      The weekly grid structure
│   │   ├── ScheduleCell.jsx      Individual subject block
│   │   └── TimeColumn.jsx        Left-side time labels
│   ├── sidebar/
│   │   ├── StyleSidebar.jsx      Collapsible sidebar wrapper
│   │   ├── ThemePicker.jsx       4 theme cards
│   │   └── ColorOverrides.jsx    Primary/accent color inputs
│   ├── export/
│   │   └── ExportOverlay.jsx     PDF + PNG export buttons and mobile modal
│   └── ui/                       shadcn/ui components live here
├── hooks/
│   ├── useAppState.js            Central state + auto-save to localStorage
│   ├── useExport.js              PNG and PDF export logic
│   └── useParser.js              Orchestrates the full parsing pipeline
├── lib/
│   ├── parser/
│   │   ├── index.js              Main parseFile() orchestrator
│   │   ├── pdfExtractor.js       pdf.js text extraction
│   │   ├── ocrExtractor.js       Tesseract.js OCR
│   │   ├── regexTokenizer.js     Regex field extraction
│   │   ├── confidenceScorer.js   Score entries, produce warnings list
│   │   ├── normalizer.js         Days/time normalization to canonical format
│   │   └── llmFallback.js        Gemini pre-check + Gemini extraction
│   ├── themes.js                 Token bundles for all 4 themes
│   ├── storage.js                localStorage read/write/check helpers
│   └── sanitize.js               Input sanitization helpers
├── constants/
│   └── defaults.js               Default state, version string, storage keys
├── styles/
│   └── globals.css               Tailwind import + all CSS token definitions
└── .env.local                    NEXT_PUBLIC_GEMINI_KEY=your_key
```

---

## Phase 1 — Project Setup

**Goal:** Running dev server, all dependencies installed, folder structure created, fonts loaded.

### 1.1 Initialize

Create the Next.js project with App Router and Tailwind included. During setup: yes to TypeScript is optional (JS is fine), yes to Tailwind, yes to App Router, no to `src/` directory (keep flat).

### 1.2 Install dependencies

These are the packages you need before writing any feature code:

- `pdfjs-dist` — PDF text extraction
- `tesseract.js` — in-browser OCR
- `html-to-image` — DOM to PNG export
- `clsx` and `tailwind-merge` — Tailwind class utilities
- `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `@radix-ui/react-slot` — headless UI primitives
- Run `npx shadcn@latest init` after Tailwind is configured

After installing `pdfjs-dist`, copy `node_modules/pdfjs-dist/build/pdf.worker.min.js` into your `public/` folder. This is required for pdf.js to work in the browser.

### 1.3 Google Fonts

Load these four fonts in `app/layout.jsx` using Next.js's `next/font/google`:

- `IBM Plex Mono` (weights 400, 500) — for Minimalist Bureau theme
- `DM Sans` (weights 400, 500) — for Pastel Planner theme
- `Space Mono` (weight 400) — for Neon Cyberpunk theme
- `Inter` (weights 400, 500) — for High Density theme and body text fallback

Apply them as CSS variables on `<html>` so themes can reference them.

### 1.4 CSS token layer

In `styles/globals.css`, after the Tailwind import directives, define the `:root` token block with the default theme tokens (Minimalist Bureau values from PRD §10.1). Then define all four `[data-theme="..."]` blocks from PRD §10.

### 1.5 Environment file

Create `.env.local` at the project root. Add `NEXT_PUBLIC_GEMINI_KEY=`. Add `.env.local` to `.gitignore` immediately.

**Exit condition:** `npm run dev` loads a blank page with no console errors. All imports resolve.

---

## Phase 2 — State Layer & Storage

**Goal:** A single hook that owns all app state, auto-saves to localStorage, and handles versioning.

### 2.1 `constants/defaults.js`

Define and export three things:

- `DEFAULT_STATE` — the full initial state object matching PRD §3.1 schema exactly. `schedule` is an empty array, `parse_metadata` is null, `preferences` uses Minimalist Bureau as default theme.
- `CURRENT_VERSION` — string `"1.0.0"`
- `STORAGE_KEYS` — object with all three keys: `STATE` = `"gw_state_v1"`, `THEME_OVERRIDE` = `"gw_theme_override"`, `ONBOARDING` = `"gw_onboarding_seen"`

### 2.2 `lib/storage.js`

Three exported functions:

- `loadState()` — reads `gw_state_v1` from localStorage, parses JSON, returns `{ state, needsMigration }`. If nothing is stored, return default state with `needsMigration: false`. If `app_version` doesn't match `CURRENT_VERSION`, return the saved state with `needsMigration: true`. Wrap everything in try/catch.

- `saveState(state)` — serializes state to JSON and writes to `gw_state_v1`. Returns `{ error: null }` on success or `{ error: 'quota_exceeded' }` if a `QuotaExceededError` is caught.

- `isStorageAvailable()` — tries a test write/read/delete. Returns boolean. Catches all errors.

### 2.3 `hooks/useAppState.js`

This is the central hook. It:

- Calls `loadState()` on mount to get initial state
- Holds state in `useState`
- Auto-saves to localStorage on every state change, debounced 500ms (use `useRef` for the timer)
- Checks `isStorageAvailable()` once and stores the result
- Exposes these mutation functions: `updatePreferences(patch)`, `setSchedule(entries)`, `setParseMetadata(meta)`, `updateEntry(id, patch)`, `addEntry(entry)`, `removeEntry(id)`, `resetState()`
- Returns all mutation functions plus `{ state, needsMigration, storageAvailable, storageError }`

### 2.4 `app/app/page.jsx` — screen router

The app tool page uses a string state variable to track which screen is active: `'intake'`, `'review'`, or `'canvas'`. Import `useAppState` here. Pass `appState` and `setScreen` down as props. Render the correct screen component based on the active screen string. Also render persistent banners here: migration warning (if `needsMigration`) and storage unavailable warning (if `!storageAvailable`).

**Exit condition:** Drop some dummy data into state in the browser console, refresh — it persists. Open in incognito — the storage warning shows.

---

## Phase 3 — File Intake & Parsing Engine

**Goal:** A working drop zone that accepts files and runs the full parsing pipeline, producing a list of schedule entries with confidence scores.

### 3.1 `lib/parser/pdfExtractor.js`

Single exported async function `extractTextFromPDF(file)`. Uses `pdfjs-dist`. Must set `GlobalWorkerOptions.workerSrc` to `/pdf.worker.min.js` (the file you copied to `public/`). Loops through all pages, concatenates text content from each page's items. Returns a single string.

### 3.2 `lib/parser/ocrExtractor.js`

Single exported async function `extractTextFromImage(file, onProgress)`. Uses `tesseract.js`. Creates an object URL from the file, passes it to `Tesseract.recognize()` with language `'eng'`. The `onProgress` callback receives a number 0–100 derived from Tesseract's logger `progress` field (only when status is `'recognizing text'`). Revokes the object URL after completion. Returns the extracted text string.

**Important:** Dynamically import Tesseract (`await import('tesseract.js')`) so it doesn't bloat the initial bundle. It only loads when an image file is actually dropped.

### 3.3 `lib/parser/normalizer.js`

Two exported functions:

- `normalizeDays(rawDayTokens)` — takes an array of raw day strings and returns an array of canonical full day names. Must handle: single letters (`M`, `T`, `W`, `F`, `S`), abbreviations (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`), compound shortcodes (`MWF` → Monday/Wednesday/Friday, `TTh` or `T/Th` → Tuesday/Thursday, `MW` → Monday/Wednesday). Deduplicate the result.

- `normalizeTime(timeStr)` — converts any 12-hour time string with AM/PM to 24-hour `HH:MM` format. Handles missing spaces between time and meridiem, lowercase am/pm.

### 3.4 `lib/parser/regexTokenizer.js`

Single exported function `tokenize(rawText)`. Splits raw text into lines, groups lines into entry blocks (a new block starts when a subject code pattern is detected), and for each block extracts: `subject_code`, `subject_title`, `professor`, `room`, `days` (via `normalizeDays`), `start_time` and `end_time` (via `normalizeTime`). Returns an array of partial entry objects. Fields that cannot be extracted are set to `null`. Do not assign IDs here — that happens in the orchestrator.

### 3.5 `lib/parser/confidenceScorer.js`

Two exported functions:

- `scoreEntry(entry)` — required fields are `subject_code`, `days`, `start_time`, `end_time`. Optional fields are `subject_title`, `professor`, `room`. Required fields count for 80% of the score, optional for 20%. Returns a number 0.0–1.0.

- `scoreDocument(entries)` — returns the mean `scoreEntry` across all entries. Returns 0 if the array is empty.

- `getWarnings(entry)` — returns an array of field name strings for any field that is null or empty. Used by the review screen to highlight uncertain fields.

### 3.6 `lib/parser/llmFallback.js`

Two exported async functions. Both call the Gemini 2.0 Flash API using `NEXT_PUBLIC_GEMINI_KEY` from `process.env`.

**`preCheckIsSchedule(file)`**

- Converts the image file to base64
- Sends a multimodal request to Gemini (image + text prompt)
- Prompt asks: does this image contain a university class schedule? Reply with only `{"isSchedule": true}` or `{"isSchedule": false}`
- Parses the response JSON
- On any failure (network, parse error), returns `{ isSchedule: true }` as safe default
- This function should only be called after the user sees a consent notice

**`extractWithLLM(rawText)`**

- Sends text-only request to Gemini
- Prompt instructs: extract all schedule entries from the text, return ONLY a valid JSON array with fields: `subject_code`, `subject_title`, `professor`, `room`, `days` (array of full day names), `start_time` (HH:MM 24h), `end_time` (HH:MM 24h), null for unknowns, no markdown
- Parses the response string with `JSON.parse()`
- Throws on API error or JSON parse failure so the orchestrator can handle it

### 3.7 `lib/parser/index.js` — the orchestrator

Single exported async function `parseFile(file, options)`. Options: `{ onProgress, skipLLM, skipPreCheck }`.

The pipeline in order:

1. Validate MIME type — throw with a typed error if not PDF or image
2. If image and `skipPreCheck` is false — call `preCheckIsSchedule`. If result is `{ isSchedule: false }` — return with `error: 'not_a_schedule'`
3. Extract raw text: PDF → `extractTextFromPDF`; image → `extractTextFromImage` with `onProgress`
4. Empty PDF detection: if text length < 50 and file size > 100KB → re-run extraction with `extractTextFromImage`
5. Run `tokenize(rawText)` → entries
6. Run `scoreDocument(entries)` → confidence
7. If confidence < 0.7 and `skipLLM` is false → try `extractWithLLM(rawText)`, catch silently, use whichever result scored higher
8. Assign `crypto.randomUUID()` as `id` to each entry, add `color_override: null`
9. Run `sanitizeEntry` on each entry
10. Return `{ entries, confidence, rawText, sourceType, error: null }`

### 3.8 `hooks/useParser.js`

A React hook that wraps `parseFile`. Manages loading state, progress (0–100), error state, and the consent prompt flag. Exposes: `parse(file)`, `isLoading`, `progress`, `error`, `consentNeeded`, `approveConsent()`. The consent flag is set when an image file is dropped and `preCheckIsSchedule` would be triggered. The UI blocks the API call until `approveConsent()` is called.

### 3.9 `components/intake/IntakeScreen.jsx`

Visual and interaction requirements:

- Full-area drop zone with `onDragOver` / `onDrop` handlers
- Click-to-open hidden `<input type="file">` with `accept=".pdf,image/png,image/jpeg"`
- Show file type and size limit as helper text below the zone
- Loading state: spinner + "Reading your file…" text
- For image files, show OCR progress bar (0–100%) from `useParser`
- Consent modal: if `consentNeeded` is true, show a modal explaining that the image will be sent to Google's AI to help identify the schedule. Two buttons: "Allow" (calls `approveConsent()` then continues) and "Skip AI / Enter manually"
- Error states for: unsupported file type, too large, `not_a_schedule`, `extraction_failed`
- "Enter your schedule manually" text link that navigates to the review screen with an empty single row

On successful parse, call `setSchedule(entries)`, `setParseMetadata(...)`, then navigate to `'review'` screen.

**Exit condition:** Drop a PDF — text extracted and logged. Drop an image — OCR progress bar animates. Drop a non-schedule image — consent modal appears, then "not a schedule" error shows. Drop a `.docx` — type error shows.

---

## Phase 4 — Parse Review Screen

**Goal:** An editable table that shows extracted entries, highlights uncertain fields, and lets users correct data before committing to the canvas.

### 4.1 `components/review/ReviewScreen.jsx`

Layout: confidence banner at the top, editable table in the middle, action buttons at the bottom.

**Confidence banner:**

- Green background if overall confidence ≥ 0.85: "Schedule read successfully"
- Yellow background if 0.7–0.84: "Most fields were read. Review highlighted fields."
- Red background if < 0.7: "We had trouble reading this schedule. Please check all fields carefully."
- Do not show the banner at all if the user came from manual entry

**Table columns:** Subject Code, Title, Professor, Room, Days, Start Time, End Time, Delete

**Table behavior:**

- Every cell except Days is a plain `<input>` element
- Days column renders as a row of 7 pill toggles (Mon/Tue/Wed/Thu/Fri/Sat/Sun). Clicking a pill toggles that day on/off in the entry's `days` array
- Cells corresponding to fields in `getWarnings(entry)` get a yellow border and a `⚠` icon
- Changes update local component state (not global state — don't commit until "Confirm")
- "Add row" button appends a blank entry with a new UUID
- Delete button removes the row from local state

**Bottom actions:**

- "Confirm & Build Schedule" — runs `sanitizeEntry` on all rows, calls `setSchedule()` and `setParseMetadata()`, navigates to `'canvas'`
- "← Start over" — navigates back to `'intake'`

### 4.2 `components/review/ReviewRow.jsx`

A single table row. Receives `entry`, `warnings[]`, and `onChange(field, value)` as props. Renders each field as a controlled input. Days rendered as pill toggles. Visually marks warned fields.

**Exit condition:** After parsing a file, review table shows correct data. Editing a cell updates the row. Days pills toggle correctly. Confirming navigates to canvas with updated state in `useAppState`.

---

## Phase 5 — Schedule Canvas & Grid

**Goal:** A weekly grid that renders schedule entries with correct vertical time-based positioning.

### 5.1 Grid geometry decisions — make these before building

- Time range: 07:00 to 21:00 (14 hours)
- Slot height: 48px per 30-minute slot → total grid height = 1344px
- Day columns: derived from the unique days present in `state.schedule`. If all entries are weekdays, show Monday–Friday. If any weekend day exists, expand to include it.
- The grid must be wrapped in a `div` with `className="schedule-canvas"` for print CSS targeting.

### 5.2 `components/canvas/TimeColumn.jsx`

Renders the left column of time labels. One label per hour from 07:00 to 21:00. Each label is absolutely positioned at `top = (hour - 7) * 96px` (96px = 2 slots × 48px). Format times as `7 AM`, `8 AM`, etc.

### 5.3 `components/canvas/ScheduleCell.jsx`

Receives a single schedule entry as a prop plus its column index (for color cycling).

Position logic: `top = ((startHour - 7) * 60 + startMinute) / 30 * 48px`, `height = durationMinutes / 30 * 48px`.

Displays: subject code (primary text, `--gw-font-display`), subject title (secondary, truncated with ellipsis), room + professor (small, `--gw-text-secondary`).

Background color: use `color_override` if set, otherwise cycle through a palette of 10 preset colors by entry index. Store the 10-color palette in `lib/themes.js`.

Collision handling: if two entries overlap in the same day column, render each at 50% column width side by side. Detect collisions by sorting entries by start time and checking time range overlap between any two entries in the same day.

### 5.4 `components/canvas/ScheduleGrid.jsx`

Assembles `TimeColumn` + day columns. Each day column is `position: relative`. Entries for that day are rendered as absolutely positioned `ScheduleCell` components. Grid lines are thin borders on the day column cells or a CSS background-image repeating gradient.

### 5.5 `components/canvas/CanvasScreen.jsx`

The full canvas layout. Contains: top toolbar (re-upload button, export button), the collapsible `StyleSidebar` on the right, and `ScheduleGrid` in the main area. Pass a `ref` to `ScheduleGrid`'s root element — this ref is used by the export hook. Apply `data-theme` attribute from `state.preferences.theme_id` to the canvas wrapper.

**Exit condition:** State from Phase 4 renders as a correct grid. Cells are at the right vertical position. No overlapping entries obscure each other.

---

## Phase 6 — Theme System & Style Sidebar

**Goal:** Theme switching applies instantly. Users can pick a theme and override individual colors.

### 6.1 `lib/themes.js`

Export a `THEMES` object keyed by theme ID. Each theme entry contains:

- `id`, `name`, `description`
- `tokens` object with all 11 `--gw-*` variable values (from PRD §10)
- `previewColors` array of 3–4 hex values for the theme picker card swatch

Also export `CELL_PALETTE` — array of 10 hex colors used for subject cell backgrounds when no `color_override` is set.

### 6.2 Theme injection

In `CanvasScreen.jsx`, apply the active theme's tokens as inline CSS custom properties on the canvas wrapper element using a `style` prop that maps each token to its value. This scopes the theme to the canvas only — the rest of the app UI (navbar, sidebar chrome) stays neutral. Color overrides from `preferences.primary_color` and `preferences.accent_color` are applied on top as additional inline style properties, overwriting `--gw-accent`.

### 6.3 `components/sidebar/ThemePicker.jsx`

Four cards, one per theme. Each card shows:

- Theme name
- A small color swatch strip using `previewColors` from `THEMES`
- Active state: thicker border or checkmark indicator
- Clicking calls `updatePreferences({ theme_id: id })`

### 6.4 `components/sidebar/ColorOverrides.jsx`

Two `<input type="color">` pickers labeled "Primary" and "Accent". Values are bound to `preferences.primary_color` and `preferences.accent_color`. A "Reset" link next to each clears the override back to `null`.

### 6.5 `components/sidebar/StyleSidebar.jsx`

Collapsible panel on the right side of the canvas. On desktop, it's always visible as a fixed-width right panel. On smaller screens, it collapses to an icon strip. Contains `ThemePicker`, `ColorOverrides`, font selector dropdown, and paper size toggle.

**Exit condition:** Switching themes changes canvas appearance with no flicker. Color overrides stack on top of the theme. Font selector changes `--gw-font-display`.

---

## Phase 7 — Inline Canvas Editing

**Goal:** Every text field in the canvas is directly editable in place.

### 7.1 `EditableField` component (inside `ScheduleCell.jsx`)

A `<span contentEditable>` wrapper. Rules:

- Updates state via `onBlur`, not `onInput` — prevents re-render thrashing while typing
- Sanitizes the value (strip HTML, apply char limits from PRD §12.3) before calling `updateEntry`
- On hover, shows a small reset `↺` icon button
- The reset icon calls `updateEntry` with the original parsed value from `entry._parsed[field]`

### 7.2 Preserving original parsed values

When the review screen confirms entries into global state, add a `_parsed` shadow key to each entry that is a snapshot of the entry object at confirmation time. This is how the reset affordance knows what to restore. `_parsed` is never rendered.

**Exit condition:** Click any text in a cell → it becomes editable. Tab works between fields. Click away → state updates and re-renders. Reset icon restores parsed value.

---

## Phase 8 — Export Engine

**Goal:** PDF and PNG exports produce correctly named, high-resolution files.

### 8.1 `hooks/useExport.js`

Receives the canvas `ref`. Exposes two functions:

**`exportPNG()`**

- Uses `html-to-image`'s `toPng()` function
- Must call `document.fonts.ready` before calling `toPng()` to ensure fonts are loaded
- Set `pixelRatio` to `Math.max(2, window.devicePixelRatio * 2)`
- Resolve the canvas element's `getBoundingClientRect()` to get explicit pixel dimensions
- Filename: `Gridworks_Schedule_${new Date().getFullYear()}.png`
- Creates a temporary `<a>` element, sets `download` and `href`, clicks it, removes it

**`exportPDF()`**

- Detects mobile: check `navigator.userAgent` for `Mobi|Android` or `'ontouchstart' in window`
- Desktop: calls `window.print()`, returns `{ showMobileModal: false }`
- Mobile: returns `{ showMobileModal: true }` without printing

### 8.2 Print CSS

In `styles/globals.css`, add a `@media print` block. It must:

- Set `@page` to `A4 portrait` with `margin: 0`
- Hide everything on the page except `.schedule-canvas`
- Set `.schedule-canvas` to `width: 100%; height: auto; break-inside: avoid`

### 8.3 `components/export/ExportOverlay.jsx`

A modal/overlay triggered from the canvas toolbar. Contains:

- "Export as PDF" button — calls `exportPDF()`. If `showMobileModal: true`, shows instructions: "On mobile, use your browser's Share → Print menu and select Save as PDF."
- "Export as PNG (HD)" button — calls `exportPNG()`, shows a loading spinner during generation
- Close button

**Exit condition:** PNG downloads with correct filename. PDF print dialog opens on desktop showing only the schedule canvas. Mobile shows the instructions modal.

---

## Phase 9 — Error Handling

**Goal:** Every error case from PRD §12 has a user-facing response. No state leads to a dead end.

### 9.1 `lib/sanitize.js`

Export `sanitizeEntry(entry)` and `sanitizeString(value, maxLength)`. Character limits per PRD §12.3: subject_title 80, professor 60, room 20, subject_code 12. Strip HTML tags, trim whitespace, slice to max length.

### 9.2 Error states to implement — checklist

Go through these one by one after Phase 8:

- Unsupported file type dropped → banner in `IntakeScreen`
- File > 10MB dropped → banner in `IntakeScreen`
- Non-schedule image dropped (after consent) → error state in `IntakeScreen` with "Enter manually" CTA
- Image-only PDF (pdf.js returns empty text) → silent re-route to OCR, no user notification
- OCR returns empty string → error state with "Try a clearer image" message
- Gemini API returns error → silent fallback to regex results, no user notification
- Gemini API `preCheckIsSchedule` fails → default to `isSchedule: true`, proceed normally
- `localStorage` quota exceeded → non-blocking toast notification
- `localStorage` unavailable (private browsing) → persistent banner saying schedule won't be saved
- Version mismatch on load → migration banner with "Keep anyway" / "Start fresh" options

### 9.3 Global error boundary

Wrap the entire `app/app/page.jsx` content in a React error boundary component. If an unhandled error reaches it, show: "Something went wrong." with a "Start fresh" button that calls `resetState()` and reloads.

**Exit condition:** All 10 checklist items above produce the correct UI response without crashing the app.

---

## Phase 10 — Landing Page

**Goal:** A polished landing page at `/` with a navbar CTA that routes to `/app`.

### 10.1 `components/landing/Navbar.jsx`

Fixed position, full width. Left side: Gridworks wordmark logo. Right side: "Try Gridworks →" button. The button is a `<Link href="/app">`. No other nav items needed — this is a single-feature product.

### 10.2 `components/landing/Hero.jsx`

The main hero section. Must communicate three things immediately:

- What it does: "Drop your registration form. Get a beautiful schedule."
- How it works: one sentence — "Gridworks reads your university schedule PDF and renders it as a print-ready, styled grid."
- Why to try it: zero friction (no sign-up, no server, instant)

CTA button: "Try Gridworks for free →" → links to `/app`. This is the primary conversion point.

Visual: show a preview of the schedule canvas (can be a static image or a simplified render of a sample schedule). This is the most important visual on the page — users need to see what they're getting.

### 10.3 `components/landing/HowItWorks.jsx`

Three-step section. Steps:

1. "Drop your registration form" — PDF or screenshot
2. "Review and confirm" — the parsed entries are checked
3. "Export your schedule" — PDF or HD PNG

Each step has a number, title, and one-sentence description. Keep it scannable.

### 10.4 `components/landing/ThemePreview.jsx`

Showcases all four themes. Grid of four cards, each showing the theme name and a color swatch strip. Optional: a small mock schedule grid rendered in each theme's colors. This section answers "can I customize it?"

### 10.5 `components/landing/Footer.jsx`

Minimal. Project name, "Built with Next.js", optionally a link to your thesis or GitHub.

### 10.6 `app/page.jsx`

Assembles: `<Navbar>`, `<Hero>`, `<HowItWorks>`, `<ThemePreview>`, `<Footer>`. No logic — purely compositional.

**Aesthetic direction for the landing page:** The PRD defines Gridworks as structured, clean, and privacy-first. The landing page should feel editorial — a document tool, not a consumer app. Think clean whitespace, strong typographic hierarchy, a dark-on-light base. Avoid purple gradients, glassmorphism, and generic SaaS aesthetics. The schedule preview image is the hero — let it be the visual focal point.

**Exit condition:** Landing page loads at `/`. "Try Gridworks" button in the navbar navigates to `/app`. All three landing sections are visible. Page is coherent and polished.

---

## Phase 11 — Polish & Deployment Prep

**Goal:** App is presentable as a thesis demo, deployable with one command.

### 11.1 Onboarding tooltip

On first load of `/app` (check `gw_onboarding_seen` in localStorage), show a tooltip or overlay on the drop zone with one sentence of guidance. Dismiss sets `gw_onboarding_seen = "true"`.

### 11.2 Loading states

Every async operation needs a visual indicator:

- File extraction (PDF): spinner + "Reading your PDF…"
- OCR: progress bar 0–100%
- Gemini pre-check: spinner + "Checking file…" (shown before OCR starts on images)
- Gemini extraction fallback: spinner + "Enhancing accuracy…" (do not mention AI specifically)
- PNG export: spinner + "Generating image…"

### 11.3 Responsive behavior

The canvas editor is designed for 1280px+ width. Below 768px (mobile):

- Show a banner: "Gridworks is best experienced on a larger screen. You can still export your schedule."
- Do not break the layout — degrade gracefully

### 11.4 Tesseract.js bundle optimization

`tesseract.js` is large (~10MB of WASM). Use dynamic import in `ocrExtractor.js` so it only loads when an image file is actually dropped. This keeps the initial page load fast.

### 11.5 Deployment

Deploy to Vercel (recommended for Next.js). Connect your GitHub repo. Set `NEXT_PUBLIC_GEMINI_KEY` in Vercel's Environment Variables dashboard. Do not commit `.env.local`.

---

## AI Model Change — Update Dev Plan References

The original dev plan referenced Anthropic Claude API. Replace all references with Gemini 2.0 Flash:

| Was                                     | Now                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_KEY`                         | `NEXT_PUBLIC_GEMINI_KEY`                                                                           |
| `https://api.anthropic.com/v1/messages` | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=KEY` |
| `claude-haiku-4-5-20251001` (pre-check) | `gemini-2.0-flash`                                                                                 |
| `claude-sonnet-4-20250514` (extraction) | `gemini-2.0-flash`                                                                                 |
| `anthropic-version` header              | Not needed — Gemini uses query param auth                                                          |
| `data.content[0].text` (response path)  | `data.candidates[0].content.parts[0].text`                                                         |

Both functions use the same model. Gemini 2.0 Flash is fast enough for both use cases and the free tier is sufficient for development and thesis demo usage.

---

## Build Order Summary

```
Phase 1  →  Setup & dependencies
Phase 2  →  State + localStorage
Phase 3  →  File intake + full parsing pipeline   ← most complex, most important
Phase 4  →  Parse review table
Phase 5  →  Schedule grid + cells
Phase 6  →  Theme system + sidebar
Phase 7  →  Inline cell editing
Phase 8  →  Export (PNG + PDF)
Phase 9  →  Error handling
Phase 10 →  Landing page                          ← do this last, not first
Phase 11 →  Polish + deploy
```

> **Note on Phase 10 order:** The landing page is listed last intentionally. Build the working tool first — once the core feature works, landing page copy writes itself and you know exactly what to show in the hero preview. Building the landing page first is a common trap that burns time before the product exists.

---

## Quick Decisions Reference

| Question                              | Decision                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Framework                             | Next.js for clean `/` + `/app` routing                                      |
| AI provider?                          | Google Gemini 2.0 Flash (free tier)                                         |
| Do I need AI for every parse?         | No — only when regex confidence < 0.7                                       |
| Do I need AI for the image pre-check? | Optional — adds UX polish, saves OCR time, requires consent                 |
| State management?                     | React `useState` only — no Redux, no Zustand                                |
| CSS approach?                         | Tailwind CSS + CSS custom properties for theme tokens                       |
| Component library?                    | shadcn/ui for primitives (dialog, tooltip), custom for everything else      |
| TypeScript?                           | Optional — JS is fine for thesis scope                                      |
| Testing?                              | Not required for thesis — manual testing via the error checklist in Phase 9 |

---

_End of Gridworks Development Guide v2.0.0_
