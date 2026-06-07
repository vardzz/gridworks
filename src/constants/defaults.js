// src/constants/defaults.js

export const APP_VERSION = "1.0.0";
export const STORAGE_KEY = "gridworks_app_state";

export const DEFAULT_PREFERENCES = {
  theme_mode: "light",
  layout_type: "weekly_grid",
  primary_color: "", // Empty strings allow fallback directly to active CSS variables
  accent_color: "",
  font_family: "var(--font-inter)",
  paper_size: "A4"
};

// Provides an initial empty slate layout showcasing the exact structure the parser populates
export const INITIAL_SCHEDULE_MOCK = [
  {
    id: "initial_setup_anchor",
    subject_code: "WELCOME-101",
    subject_title: "Drop Your Schedule File to Begin",
    professor: "Gridworks Parser",
    room: "Canvas Area",
    days: ["Monday"],
    start_time: "09:00",
    end_time: "10:30"
  }
];

export const CANONICAL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];