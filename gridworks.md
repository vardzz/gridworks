# Gridworks — System Specification & Product Requirements Document

**Version:** 1.1.0
**Status:** Ready for Development
**Last Updated:** 2025

---

## Table of Contents

- [1. Project Identity](#1-project-identity)
- [2. Problem & Solution Context](#2-problem--solution-context)
- [3. System Data Models & Schema](#3-system-data-models--schema)
- [4. Architectural Features & Function Specification](#4-architectural-features--function-specification)
- [5. Technology Stack Selection](#5-technology-stack-selection)
- [6. Functional Architecture Flowchart](#6-functional-architecture-flowchart)
- [7. System Boundaries & Constraints](#7-system-boundaries--constraints)
- [8. User Flow & Screen Map](#8-user-flow--screen-map)
- [9. Parsing Robustness & Fallback Strategy](#9-parsing-robustness--fallback-strategy)
- [10. Theme Design Token Definitions](#10-theme-design-token-definitions)
- [11. Storage Key Structure & Versioning](#11-storage-key-structure--versioning)
- [12. Error & Edge-Case Handling](#12-error--edge-case-handling)

---

## 1. Project Identity

| Property                | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Project Name**        | Gridworks                                                                      |
| **System Architecture** | 100% Client-Side Web Application (Serverless / Database-less)                  |
| **Target Audience**     | Academic students requiring automated, highly customizable schedule formatting |
| **Framework Decision**  | Next.js (chosen for clean routing and standard structure)                      |

### Core Philosophy

| Pillar               | Description                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **Zero Friction**    | No authentication, no accounts, no onboarding gates                                          |
| **Absolute Privacy** | All file parsing happens locally in the browser; no data ever leaves the device              |
| **Guided Freedom**   | Rigid grid structures ensure layout integrity; high cosmetic control within those structures |

---

## 2. Problem & Solution Context

### 2.1 The Problem

1. **Manual Design Overhead** — Existing design platforms (e.g., Canva) require tedious, manual entry of individual subject codes, room variants, and complex time windows for every class.
2. **Visual Inflexibility** — Functional calendars (e.g., Google Calendar) lack aesthetic customization optimized for physical print media or desktop wallpaper scales.

### 2.2 The Solution

Gridworks acts as a deterministic **Document-to-Layout Pipeline**. It intercepts raw data from a university registration PDF or image screenshot, translates that data into a standardized internal data model entirely on-device, and renders it onto a highly styled, unbreakable layout grid.

---

## 3. System Data Models & Schema

### 3.1 App State Schema

```json
{
  "app_version": "1.0.0",
  "preferences": {
    "theme_mode": "dark",
    "layout_type": "weekly_grid",
    "theme_id": "minimalist_bureau",
    "primary_color": "#HEX_STRING",
    "accent_color": "#HEX_STRING",
    "font_family": "Inter",
    "paper_size": "A4"
  },
  "schedule": [
    {
      "id": "STRING_UNIQUE_HASH",
      "subject_code": "STRING",
      "subject_title": "STRING",
      "professor": "STRING",
      "room": "STRING",
      "days": ["Monday", "Wednesday"],
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "color_override": "#HEX_STRING | null"
    }
  ],
  "parse_metadata": {
    "source_type": "pdf | image | manual",
    "parse_confidence": 0.0,
    "parse_warnings": [],
    "parsed_at": "ISO_TIMESTAMP"
  }
}
```

> **Note:** `parse_metadata` is a non-rendered diagnostic field. It tracks the confidence score of the last parsing operation and surfaces warnings to the user during the review step (see §8).

### 3.2 `days` Field Accepted Values

The `days` array accepts only the following normalized strings:

```
"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
```

The parser (§9) is responsible for mapping all shorthand variants (`M`, `Mon`, `MWF`, `TTh`, `T/Th`) to these canonical values before the data reaches the state.

---

## 4. Architectural Features & Function Specification

### Feature Overview

| ID  | Feature                               | Status |
| --- | ------------------------------------- | ------ |
| 4.1 | Client-Side Intake Zone               | Core   |
| 4.2 | Guided Style Matrix                   | Core   |
| 4.3 | Inline Canvas Mutation                | Core   |
| 4.4 | Dual-Format Export Engine (PDF & PNG) | Core   |

---

### 4.1 Client-Side Intake Zone

**Input interfaces:**

- Drag-and-drop file zone (full-area drop target)
- Native OS file picker (click-to-browse fallback)

**Supported MIME types:**

| Type              | Handler                       |
| ----------------- | ----------------------------- |
| `application/pdf` | pdf.js vector text extraction |
| `image/png`       | Tesseract.js OCR              |
| `image/jpeg`      | Tesseract.js OCR              |

**File size limit:** 10 MB client-side guard. Files exceeding this threshold display an inline warning and reject the file before passing it to the extraction worker.

---

### 4.2 Guided Style Matrix

Provides four UI layout themes. Each theme sets a complete token bundle (see §10 for full token definitions).

| Theme ID               | Name                        | Visual Character                                                                |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| `minimalist_bureau`    | Minimalist Bureau           | Clean white/off-white, serif headers, mono subject codes, subtle borders        |
| `pastel_planner`       | Pastel Planner              | Soft background fills per subject, rounded cells, handwritten-style font option |
| `neon_cyberpunk`       | Neon Cyberpunk              | Dark base canvas, neon accent borders, glow effects on active cells             |
| `high_density_compact` | High-Density Compact Matrix | Maximum information density, small type, tight row height, no decorative chrome |

Theme selection replaces the entire CSS variable bundle injected on `<:root>`. User can further override `primary_color` and `accent_color` individually after selecting a base theme.

---

### 4.3 Inline Canvas Mutation

Every text block rendered in the schedule grid is directly editable in-place.

- Subject titles, professor names, and room codes are wrapped in `contenteditable="true"` spans.
- Changes update React state via `onBlur` (not `onChange`) to avoid re-render thrashing during typing.
- A "reset field" affordance (small ↺ icon) appears on hover to revert any field back to its parsed value.

---

### 4.4 Dual-Format Multi-Export Engine (PDF & PNG)

#### Automated File Naming

Export filenames are generated deterministically:

```
Gridworks_Schedule_<CURRENT_YEAR>.pdf
Gridworks_Schedule_<CURRENT_YEAR>.png
```

`<CURRENT_YEAR>` is derived from `new Date().getFullYear()` at export time.

#### PNG Export (html-to-image)

- `pixelRatio: 2` (or `window.devicePixelRatio * 2`, whichever is larger) for HD output.
- Canvas container must have explicit `width` and `height` in pixels at export time — percentage-based dimensions must be resolved before calling `toPng()`.
- PNG exports are targeted at 2560×1440 viewport equivalence for wallpaper use.

#### PDF Export (window.print())

CSS `@media print` rules must enforce single-page output:

```css
@page {
  size: A4 portrait;
  margin: 0;
}

.schedule-canvas {
  width: 100%;
  height: auto;
  break-inside: avoid;
  page-break-after: avoid;
}
```

#### Mobile Browser Caveat

`window.print()` behavior is inconsistent across iOS Safari and Android WebView. On mobile:

- PDF export falls back to a "Print / Save as PDF" instructional modal rather than triggering `window.print()` directly.
- PNG export remains fully functional on all mobile browsers.

Detection: `navigator.userAgent` mobile check + `'ontouchstart' in window`.

---

## 5. Technology Stack Selection

### Framework Decision: Next.js

Next.js provides a structured file-based routing system which cleanly separates the landing page from the application tool, and integrates seamlessly with Tailwind CSS.

### Full Stack

| Layer                    | Library / Tool             | Purpose                                    |
| ------------------------ | -------------------------- | ------------------------------------------ |
| **Framework**            | Next.js 14+                | React framework, routing, bundler          |
| **Styling**              | Tailwind CSS 3.x           | Utility classes + CSS variable integration |
| **Component primitives** | shadcn/ui + Radix UI       | Accessible headless components             |
| **PDF extraction**       | pdf.js (Mozilla)           | Vector text extraction from PDF files      |
| **Image OCR**            | Tesseract.js               | In-browser OCR for image-based schedules   |
| **PNG export**           | html-to-image              | DOM-to-PNG rendering                       |
| **Hashing**              | crypto.randomUUID()        | Unique `id` generation per schedule entry  |
| **Persistence**          | Browser `localStorage` API | State serialization between sessions       |

---

## 6. Functional Architecture Flowchart

```
[ User Input: File Drop or File Picker ]
                  │
                  ▼
     ┌────────────────────────┐
     │   MIME Type Router      │
     │  pdf → pdf.js           │
     │  png/jpg → Tesseract.js │
     └────────────┬───────────┘
                  │
                  ▼
     ┌────────────────────────┐
     │  Raw Text Extraction   │
     │  (string output)       │
     └────────────┬───────────┘
                  │
                  ▼
     ┌────────────────────────────────────────────┐
     │  Parsing Engine (§9)                        │
     │  1. Regex tokenizer (primary)               │
     │  2. Confidence scorer                       │
     │  3. Normalization mapper (days, times)      │
     │  4. LLM fallback if confidence < 0.7        │
     └─────────────────────────┬──────────────────┘
                               │
                               ▼
              ┌────────────────────────────┐
              │  Parse Review Screen (§8)   │
              │  User confirms / corrects   │
              │  flagged fields             │
              └────────────┬───────────────┘
                           │
                           ▼
     ┌────────────────────────────────────────────┐
     │  React State Rendering Core                 │◄─── [ Style Sidebar / Theme Injector ]
     │  (Dynamic CSS Variables / Tailwind CSS)     │
     └──────────────┬──────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
[ localStorage ]          [ Export Engine ]
(Persistence)             window.print() / html-to-image
```

---

## 7. System Boundaries & Constraints

| Constraint                   | Detail                                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No server infrastructure** | Zero cloud compute. All processing runs inside the browser sandbox.                                                                                                                                       |
| **No authentication**        | No user accounts, sessions, or login flows.                                                                                                                                                               |
| **Cache eviction**           | Data is tied to `localStorage`. Clearing browser storage resets all app state. Users should be informed of this on first save.                                                                            |
| **Text overflow**            | All schedule cell text uses `text-overflow: ellipsis` with `overflow: hidden` and `white-space: nowrap` to maintain grid integrity regardless of input length. Full text is accessible via hover tooltip. |
| **localStorage quota**       | Browser `localStorage` is capped at ~5 MB. A single Gridworks state is well under 50 KB. No quota management required.                                                                                    |
| **Offline-first**            | All libraries are bundled at build time. No CDN dependencies at runtime. The app must function with zero network access after initial load.                                                               |

---

## 8. User Flow & Screen Map

Gridworks has four distinct screens. Navigation is linear with no back-stack required — users can re-trigger any screen from the canvas via the toolbar.

```
Screen 1          Screen 2            Screen 3             Screen 4
──────────        ─────────────       ──────────────────   ────────────────
INTAKE            PARSE REVIEW        CANVAS EDITOR        EXPORT

Drop zone    ──►  Parsed data   ──►   Live schedule  ──►  PDF / PNG
or picker         table view          grid with            download
                  with editable       style sidebar        buttons
                  fields &            and inline
                  confidence          editing
                  warnings
```

### Screen 1 — Intake

- Large centered drop zone.
- Supported file types displayed as helper text.
- "Or enter manually" secondary CTA → navigates directly to a blank Canvas Editor (Screen 3) with an empty schedule state.

### Screen 2 — Parse Review

- Renders parsed data as an editable table (one row per subject block).
- Each field is individually editable inline.
- Rows with low-confidence fields are highlighted with a warning indicator (⚠).
- "Add entry" button to insert a blank row for manually adding missed entries.
- "Confirm & Build Schedule" CTA → commits data to state and navigates to Screen 3.
- Users cannot skip this screen unless they uploaded a file (manual entry bypasses it).

### Screen 3 — Canvas Editor

- Live preview of the weekly grid occupies the main content area.
- Collapsible style sidebar on the right: theme picker, color overrides, font selector, paper size selector.
- Toolbar at the top: re-upload, reset, export.
- All text cells are inline-editable (§4.3).
- Changes are auto-saved to `localStorage` on every state mutation (debounced 500ms).

### Screen 4 — Export

- Triggered from the toolbar in Screen 3 (not a separate page; opens as an overlay/modal).
- Two buttons: "Export as PDF" and "Export as PNG".
- PNG export shows a download progress indicator.
- PDF export on desktop triggers `window.print()`. On mobile, shows the instructional modal (§4.4).

---

## 9. Parsing Robustness & Fallback Strategy

This section defines how the parsing engine handles real-world schedule format inconsistencies.

### 9.1 Parsing Pipeline

The engine operates in three stages:

**Stage 1 — Regex Tokenizer (Primary)**

Pattern matching covers the most common university schedule formats. Each pattern targets a specific field:

| Field            | Regex Pattern (example)                                                  | Handles                            |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| Subject code     | `/[A-Z]{2,4}\s?\d{3,4}[A-Z]?/g`                                          | `CS101`, `MATH 201B`, `ENG3`       |
| Time range       | `/\d{1,2}:\d{2}\s?[APap][Mm]?\s?[-–]\s?\d{1,2}:\d{2}\s?[APap][Mm]?/g`    | `8:00 AM - 9:30 AM`, `08:00-09:30` |
| Days (shorthand) | `/\b(M\|T\|W\|TH\|Th\|F\|S\|Su\|Mon\|Tue\|Wed\|Thu\|Fri\|Sat\|Sun)\b/gi` | `MWF`, `T/Th`, `Mon Wed Fri`       |
| Room             | `/[A-Z]+-?\d{3,4}[A-Z]?\b/g`                                             | `GK-401`, `SCI203`, `AB 1B`        |

**Stage 2 — Confidence Scorer**

After tokenization, a confidence score (0.0–1.0) is computed per entry:

```
score = (matched_fields / total_required_fields)
required_fields = [subject_code, days, start_time, end_time]
```

An entry with all four required fields resolved scores `1.0`. Missing one field scores `0.75`, etc.

An overall document confidence score is the mean of all entry scores.

**Stage 3 — Normalization Mapper**

All matched values are normalized to canonical forms before entering the schema:

- Day shorthands → full names (`MWF` → `["Monday", "Wednesday", "Friday"]`)
- Times → 24-hour `HH:MM` format (`8:00 AM` → `08:00`)
- Subject codes → uppercase, space-stripped

### 9.2 LLM Fallback

If overall document confidence < 0.7 after Stage 2, the raw extracted text is sent to an LLM (Google Gemini API) for structured extraction.

**Prompt contract:**

```
You are a university schedule parser. Extract all class schedule entries from the text below.
Return ONLY a valid JSON array of objects. Each object must have these exact keys:
subject_code, subject_title, professor, room, days (array), start_time (HH:MM), end_time (HH:MM).
If a field cannot be determined, use null. Do not include any explanation or markdown.

TEXT:
{raw_extracted_text}
```

The LLM response is parsed with `JSON.parse()`. If parsing fails, the error is caught and the user is dropped into the manual entry flow with the raw text displayed for reference.

**Privacy note:** LLM fallback involves sending extracted text to a third-party API. The user must be informed via a consent prompt before this call is made. They may decline and proceed with manual correction instead.

### 9.3 Manual Correction (Always Available)

Regardless of parse confidence, the Parse Review Screen (§8, Screen 2) always allows full manual correction. The LLM fallback is an optional enhancement, not a requirement for the system to function.

### 9.4 Known Limitations

- Schedules embedded as images inside PDFs require the OCR path, not the vector extraction path. pdf.js will return empty text for image-only PDFs; the system must detect this and re-route to Tesseract.js automatically (detection: extracted text length < 50 characters for a file > 100 KB).
- Tesseract.js accuracy degrades on low-contrast or skewed scans. Users should be advised to use clean, upright images.
- Multi-column layouts (common in university schedule printouts) may confuse linear text extraction order. This is a known edge case; the review screen is the mitigation.

---

## 10. Theme Design Token Definitions

Each theme sets the following CSS variables on `:root`. These variables are consumed by Tailwind via `var()` references in the component layer.

### Token Reference

| Token                 | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `--gw-bg-primary`     | Main canvas background                         |
| `--gw-bg-cell`        | Individual schedule cell fill                  |
| `--gw-bg-header`      | Day column / time row header fill              |
| `--gw-border-color`   | Grid line color                                |
| `--gw-text-primary`   | Primary label text                             |
| `--gw-text-secondary` | Secondary text (professor, room)               |
| `--gw-accent`         | Accent highlight (active cell, selected state) |
| `--gw-font-display`   | Font family for subject code / title           |
| `--gw-font-body`      | Font family for secondary info                 |
| `--gw-cell-radius`    | Border radius for subject cells                |
| `--gw-border-width`   | Grid line stroke width                         |

### 10.1 Minimalist Bureau

```css
:root[data-theme="minimalist_bureau"] {
  --gw-bg-primary: #fafaf8;
  --gw-bg-cell: #ffffff;
  --gw-bg-header: #f2f1ee;
  --gw-border-color: #d6d4ce;
  --gw-text-primary: #1a1a18;
  --gw-text-secondary: #6b6a65;
  --gw-accent: #2d5be3;
  --gw-font-display: "IBM Plex Mono", monospace;
  --gw-font-body: "Inter", sans-serif;
  --gw-cell-radius: 4px;
  --gw-border-width: 1px;
}
```

### 10.2 Pastel Planner

```css
:root[data-theme="pastel_planner"] {
  --gw-bg-primary: #fef9f0;
  --gw-bg-cell: #ffffff;
  --gw-bg-header: #f7e8fa;
  --gw-border-color: #e5c8f0;
  --gw-text-primary: #2d1b3d;
  --gw-text-secondary: #8b6da0;
  --gw-accent: #c869e8;
  --gw-font-display: "DM Sans", sans-serif;
  --gw-font-body: "DM Sans", sans-serif;
  --gw-cell-radius: 12px;
  --gw-border-width: 1.5px;
}
```

> Subject cells in this theme also receive individual background tints derived from the subject color palette (10 preset pastel fills cycled per entry index).

### 10.3 Neon Cyberpunk

```css
:root[data-theme="neon_cyberpunk"] {
  --gw-bg-primary: #0d0d14;
  --gw-bg-cell: #13131f;
  --gw-bg-header: #0a0a10;
  --gw-border-color: #00ffd1;
  --gw-text-primary: #e8e8ff;
  --gw-text-secondary: #7b7baa;
  --gw-accent: #ff2d78;
  --gw-font-display: "Space Mono", monospace;
  --gw-font-body: "Inter", sans-serif;
  --gw-cell-radius: 0px;
  --gw-border-width: 1px;
}
```

> Active cells in this theme use `box-shadow: 0 0 8px var(--gw-border-color)` for glow. This is the only theme where `box-shadow` is applied.

### 10.4 High-Density Compact Matrix

```css
:root[data-theme="high_density_compact"] {
  --gw-bg-primary: #ffffff;
  --gw-bg-cell: #fafafa;
  --gw-bg-header: #efefef;
  --gw-border-color: #bbbbbb;
  --gw-text-primary: #111111;
  --gw-text-secondary: #555555;
  --gw-accent: #1a73e8;
  --gw-font-display: "Inter", sans-serif;
  --gw-font-body: "Inter", sans-serif;
  --gw-cell-radius: 2px;
  --gw-border-width: 0.5px;
}
```

> This theme sets a reduced `font-size` of `10px` for secondary text fields (professor, room) to maximize information density.

---

## 11. Storage Key Structure & Versioning

### 11.1 Key Naming Convention

All Gridworks `localStorage` keys are namespaced under the `gw_` prefix:

| Key                  | Type        | Description                                                |
| -------------------- | ----------- | ---------------------------------------------------------- |
| `gw_state_v1`        | JSON string | Complete serialized app state (§3.1 schema)                |
| `gw_theme_override`  | JSON string | User's per-token color overrides (applied on top of theme) |
| `gw_onboarding_seen` | `"true"`    | Flag: has the user dismissed the first-use tooltip         |

### 11.2 Schema Versioning

The `app_version` field in the state schema is checked on every load against the current build version.

**Migration logic:**

```javascript
const CURRENT_VERSION = "1.0.0";

function loadState() {
  const raw = localStorage.getItem("gw_state_v1");
  if (!raw) return getDefaultState();

  const saved = JSON.parse(raw);

  if (saved.app_version !== CURRENT_VERSION) {
    // Future: run migration transforms here
    // For now: warn user and offer to keep or discard
    return promptMigration(saved);
  }

  return saved;
}
```

**Migration policy for v1:** If `app_version` does not match, the user is shown a non-blocking banner:

> _"Your saved schedule was created with an older version of Gridworks. It may display incorrectly. [Keep anyway] [Start fresh]"_

Choosing "Keep anyway" loads the saved state as-is. Choosing "Start fresh" clears `gw_state_v1` and loads defaults.

### 11.3 First-Use Default State

When no saved state exists, the app initializes with:

```javascript
{
  app_version: "1.0.0",
  preferences: {
    theme_mode: "light",
    layout_type: "weekly_grid",
    theme_id: "minimalist_bureau",
    primary_color: null,
    accent_color: null,
    font_family: "Inter",
    paper_size: "A4"
  },
  schedule: [],
  parse_metadata: null
}
```

---

## 12. Error & Edge-Case Handling

### 12.1 Error Categories

| Category                     | Trigger                                                    | User-Facing Response                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unsupported file type**    | User drops a `.docx`, `.xlsx`, or other non-PDF/image file | Inline banner: "Gridworks only supports PDF, PNG, and JPEG files."                                                                                             |
| **File too large**           | File > 10 MB                                               | Inline banner: "File too large (max 10 MB). Try a compressed version."                                                                                         |
| **Empty PDF**                | pdf.js returns < 50 characters; file > 100 KB              | Silent re-route to Tesseract.js OCR path. If OCR also fails, show error (see below).                                                                           |
| **OCR failure**              | Tesseract.js returns empty string or throws                | Error state on Intake screen: "We couldn't read this file. Try a clearer image, or enter your schedule manually." + "Enter manually" CTA.                      |
| **Parse confidence too low** | Overall score < 0.5 after regex and LLM fallback           | Parse Review Screen opens with a full warning banner: "We had trouble reading this schedule. Please review all fields carefully." All fields marked uncertain. |
| **LLM API failure**          | Network error or non-200 response from Gemini API          | Silent fallback to the manual correction path. User is not shown a technical error.                                                                            |
| **localStorage full**        | `QuotaExceededError` on save                               | Non-blocking toast: "Couldn't save your schedule. Try clearing unused browser data." Schedule remains in memory for the session.                               |
| **localStorage unavailable** | Private/incognito mode or browser restriction              | App runs in session-only mode. A persistent banner informs: "Your schedule won't be saved between sessions in this browser mode."                              |

### 12.2 Graceful Degradation Hierarchy

```
Full pipeline (pdf.js → regex → LLM)
        │
        ▼ (if LLM skipped or fails)
Partial pipeline (pdf.js → regex only → manual review)
        │
        ▼ (if extraction fails entirely)
Manual entry (blank canvas, user types everything)
        │
        ▼ (always available)
Export still works from any state
```

The rule: **the export step is always reachable.** Even a blank or partially filled schedule can be exported. No error state should create a dead end.

### 12.3 Input Sanitization

All `contenteditable` fields and parsed text values are sanitized before entering React state:

- Strip HTML tags: `value.replace(/<[^>]*>/g, '')`
- Truncate to max lengths: subject title 80 chars, professor 60 chars, room 20 chars, subject code 12 chars
- Trim leading/trailing whitespace

---

_End of Gridworks System Specification v1.1.0_
