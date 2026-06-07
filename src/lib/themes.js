// src/lib/themes.js

export const THEME_PRESETS = {
  minimalist_bureau: {
    id: "minimalist_bureau",
    name: "Minimalist Bureau",
    description: "Stark monochrome architecture layouts, fine line grids, and professional high-whitespace values.",
    previewColors: ["#fafaf8", "#ffffff", "#1a1a18", "#2d5be3"], // [Primary, Cell, Text, Accent]
  },
  pastel_planner: {
    id: "pastel_planner",
    name: "Pastel Planner",
    description: "Soft, muted block shapes styled to match viral online student aesthetics and planning boards.",
    previewColors: ["#fef9f0", "#ffffff", "#2d1b3d", "#c869e8"],
  },
  neon_cyberpunk: {
    id: "neon_cyberpunk",
    name: "Neon Cyberpunk",
    description: "Deep dark modes built natively for glowing screens and computer desktop workspace wallpapers.",
    previewColors: ["#0d0d14", "#13131f", "#e8e8ff", "#00ffd1"],
  },
  high_density_compact: {
    id: "high_density_compact",
    name: "High-Density Compact",
    description: "Highly compressed cell padding optimized for intense schedules containing multi-hour lab rows.",
    previewColors: ["#ffffff", "#fafafa", "#111111", "#1a73e8"],
  }
};

export const AVAILABLE_FONTS = [
  { id: "var(--font-inter)", name: "Inter Sans" },
  { id: "var(--font-ibm-plex-mono)", name: "IBM Plex Mono" },
  { id: "var(--font-dm-sans)", name: "DM Sans" },
  { id: "var(--font-space-mono)", name: "Space Mono" }
];