# System Specification & Product Requirements Document (PRD)

## Table of Contents
- [1. Project Identity](#project-identity)
- [2. Problem & Solution Context](#problem-solution-context)
- [3. System Data Models & Schema](#system-data-models-schema)
- [4. Architectural Features & Function Specification](#architectural-features-function-specification)
- [5. Technology Stack Selection](#technology-stack-selection)
- [6. Functional Architecture Flowchart](#functional-architecture-flowchart)
- [7. System Boundaries & Constraints](#system-boundaries-constraints)

---

## 1. Project Identity {#project-identity}

- **Project Name:** Gridworks
- **System Architecture:** 100% Client‑Side Web Application (Serverless / Database‑less)
- **Target Audience:** Academic students requiring automated, highly customizable schedule formatting.
- **Core Philosophy:**
  - Zero friction (no authentication)
  - Absolute Privacy (local parsing)
  - Guided Freedom (rigid grid structures with high cosmetic control)

---

## 2. Problem & Solution Context {#problem-solution-context}

### 2.1 The Problem
1. **Manual Design Overhead:** Existing design platforms (e.g., Canva) require tedious, manual data entry of individual subject keys, room variants, and complex time windows.
2. **Visual Inflexibility:** Functional calendars (e.g., Google Calendar) lack aesthetic customization properties optimized for physical media prints or desktop wallpaper scales.

### 2.2 The Solution
Gridworks acts as a deterministic **Document‑to‑Layout Pipeline**. It intercepts raw data from a university registration form or image screenshot, translates that data into a standardized data model locally, and renders it onto a highly styled, un‑breakable layout grid.

---

## 3. System Data Models & Schema {#system-data-models-schema}

### 3.1 State Schema (JSON Structure)
```json
{
  "app_version": "1.0.0",
  "preferences": {
    "theme_mode": "dark",
    "layout_type": "weekly_grid",
    "primary_color": "HEX_STRING",
    "accent_color": "HEX_STRING",
    "font_family": "STRING",
    "paper_size": "A4"
  },
  "schedule": [
    {
      "id": "STRING_UNIQUE_HASH",
      "subject_code": "STRING",
      "subject_title": "STRING",
      "professor": "STRING",
      "room": "STRING",
      "days": ["Monday"],
      "start_time": "HH:MM",
      "end_time": "HH:MM"
    }
  ]
}
```

---

## 4. Architectural Features & Function Specification {#architectural-features-function-specification}

### Feature Overview
| ID | Feature | Description |
|----|---------|-------------|
| 4.1 | Client‑Side Intake Zone (+ Action) | Input Interfaces: Drag‑and‑Drop web zone, native OS file picker. Supported MIME types: `application/pdf`, `image/png`, `image/jpeg`. |
| 4.2 | Guided Style Matrix | Provides four UI layout styles: Minimalist Bureau, Pastel Planner, Neon Cyberpunk, High‑Density Compact Matrix. |
| 4.3 | Inline Canvas Mutation | Every text block in the DOM layout preview is editable via direct focus selectors. |
| 4.4 | Vector Print Layout Optimization | CSS `@media print` rules strip navigation, adjust viewport to A4/Letter, and trigger `window.print()`. |

---

## 5. Technology Stack Selection {#technology-stack-selection}
- **Frontend Engine:** Next.js (Static Export) or Vite + React
- **Styling Strategy:** Tailwind CSS + Semantic Headless Elements (e.g., Radix UI / shadcn/ui)
- **Local Processing Workers:** pdf.js (Mozilla) + Tesseract.js
- **Storage Provider:** Browser `localStorage` API

---

## 6. Functional Architecture Flowchart {#functional-architecture-flowchart}
```
[ User Input File Drop ]
            │
            ▼
┌────────────────────────────────────────┐
│ Client‑Side Extraction Engines          │
│ ├─► pdf.js (Vector Text Extraction)     │
│ └─► Tesseract.js (On‑Thread Image OCR) │
└──────────────────┬─────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ RegEx Tokenizer & Mapping Router       │
│ (Normalizes raw text into JSON Schema) │
└──────────────────┬─────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ React State Rendering Core             │◄─── [ Style Sidebar Variable Injector ]
│ (Dynamic CSS Variables / Tailwind CSS) │
└──────────────────┬─────────────────────┘
                     ├───────────────────────────────────────┐
                     ▼                                       ▼
        [ Browser localStorage ]                 [ window.print() Engine ]
        (Persistence Node)                       (Vector PDF Generation)
```

---

## 7. System Boundaries & Constraints {#system-boundaries-constraints}
- **No Server Infrastructure:** The app runs entirely isolated within the client sandbox. It has zero cloud compute dependency.
- **Cache Eviction Behavior:** Data persistence is linked to the lifetime of the browser's application cache storage. Clearing browser states resets the interface layout cache.
- **Data Formatting Guardrails:** UI presentation fields utilize uniform truncation policies (`text-overflow: ellipsis`) to maintain strict layout block integrity regardless of input string length.

---
