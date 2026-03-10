import { describe, it, expect } from "vitest";
import {
  generateThemeFromPalette,
  type ExtractedPalette,
  type GeneratedThemeColors,
} from "../color-extractor";

// ---------------------------------------------------------------------------
// WCAG 2.1 helpers
// ---------------------------------------------------------------------------

/** Relative luminance per WCAG 2.1 (0–1) */
function wcagLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two hex colors (always >= 1) */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = wcagLuminance(hex1);
  const l2 = wcagLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.1 thresholds
const WCAG_AA_NORMAL = 4.5; // Normal text
const WCAG_AA_LARGE = 3.0; // Large text (18pt+ or 14pt bold)

// ---------------------------------------------------------------------------
// Palette fixtures — covering a wide variety of real-world inputs
// ---------------------------------------------------------------------------

const PALETTES: Record<string, ExtractedPalette> = {
  // Default / fallback palette used when image extraction fails
  default: {
    dominant: "#a890a8",
    secondary: "#e8dde8",
    accent: "#9a8a9a",
    muted: "#b8a8b8",
  },

  // Warm — sunset / photography-heavy profiles
  warm: {
    dominant: "#c2785a",
    secondary: "#e8c4a8",
    accent: "#d4563a",
    muted: "#b89a80",
  },

  // Cool — ocean / tech
  cool: {
    dominant: "#5a78c2",
    secondary: "#a8c4e8",
    accent: "#3a56d4",
    muted: "#809ab8",
  },

  // Forest / earthy greens
  forest: {
    dominant: "#4a7a4a",
    secondary: "#a8d4a8",
    accent: "#2a8a2a",
    muted: "#6a9a6a",
  },

  // Pure grayscale — no saturation at all
  grayscale: {
    dominant: "#808080",
    secondary: "#c0c0c0",
    accent: "#606060",
    muted: "#a0a0a0",
  },

  // Very dark dominant — user uploads a dark/moody photo
  veryDark: {
    dominant: "#1a1a2e",
    secondary: "#2d2d44",
    accent: "#4a3a6e",
    muted: "#333350",
  },

  // Very light / pastel — watercolor-style profile images
  pastel: {
    dominant: "#e8d0e8",
    secondary: "#f0e8f0",
    accent: "#c8a8d8",
    muted: "#d8c0d8",
  },

  // Highly saturated — bold neon-ish inputs
  saturated: {
    dominant: "#ff0000",
    secondary: "#00ff00",
    accent: "#0000ff",
    muted: "#ffff00",
  },

  // Monochromatic blue
  monoBlue: {
    dominant: "#4466aa",
    secondary: "#6688cc",
    accent: "#2244aa",
    muted: "#5577bb",
  },

  // Monochromatic warm
  monoWarm: {
    dominant: "#aa6644",
    secondary: "#cc8866",
    accent: "#aa4422",
    muted: "#bb7755",
  },

  // Earth tones — coffee/vintage aesthetic
  earth: {
    dominant: "#8b7355",
    secondary: "#c4a882",
    accent: "#6b4226",
    muted: "#a08a6c",
  },

  // High contrast B&W — user uploads a high-contrast photo
  highContrast: {
    dominant: "#f0f0f0",
    secondary: "#d0d0d0",
    accent: "#202020",
    muted: "#909090",
  },

  // Pink / magenta — vibrant profile
  pink: {
    dominant: "#c8508c",
    secondary: "#e8a0c0",
    accent: "#e0307a",
    muted: "#d080a8",
  },

  // Teal / cyan
  teal: {
    dominant: "#2a8a8a",
    secondary: "#80c8c8",
    accent: "#0a6a7a",
    muted: "#5aaa9a",
  },

  // Golden / amber
  golden: {
    dominant: "#c8a030",
    secondary: "#e8d080",
    accent: "#b08010",
    muted: "#d0b850",
  },
};

// ---------------------------------------------------------------------------
// Shared assertion helpers
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#[0-9a-f]{6}$/i;

function assertAllValidHex(theme: GeneratedThemeColors) {
  for (const [key, value] of Object.entries(theme)) {
    expect(value, `${key} should be a valid hex color`).toMatch(HEX_REGEX);
  }
}

function hexBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r + g + b) / 3;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateThemeFromPalette", () => {
  // ------------------------------------------------------------------
  // Structural validity — every palette should produce well-formed hex
  // ------------------------------------------------------------------
  describe("structural validity", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: produces valid hex colors in light mode`, () => {
        assertAllValidHex(generateThemeFromPalette(palette, "light"));
      });

      it(`${name}: produces valid hex colors in dark mode`, () => {
        assertAllValidHex(generateThemeFromPalette(palette, "dark"));
      });
    }
  });

  // ------------------------------------------------------------------
  // Light / dark mode polarity — bg and fg should be on correct sides
  // ------------------------------------------------------------------
  describe("light/dark mode polarity", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode has lighter background than foreground`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        expect(hexBrightness(theme.background)).toBeGreaterThan(
          hexBrightness(theme.foreground)
        );
      });

      it(`${name}: dark mode has darker background than foreground`, () => {
        const theme = generateThemeFromPalette(palette, "dark");
        expect(hexBrightness(theme.background)).toBeLessThan(
          hexBrightness(theme.foreground)
        );
      });

      it(`${name}: light background is brighter than dark background`, () => {
        const light = generateThemeFromPalette(palette, "light");
        const dark = generateThemeFromPalette(palette, "dark");
        expect(hexBrightness(light.background)).toBeGreaterThan(
          hexBrightness(dark.background)
        );
      });
    }
  });

  // ------------------------------------------------------------------
  // WCAG AA — foreground text on background (the most critical pair)
  // ------------------------------------------------------------------
  describe("WCAG AA: foreground on background", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode fg/bg contrast >= ${WCAG_AA_NORMAL}:1`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        const ratio = contrastRatio(theme.foreground, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_NORMAL}:1, got ${ratio.toFixed(2)}:1 ` +
            `(fg ${theme.foreground}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      });

      it(`${name}: dark mode fg/bg contrast >= ${WCAG_AA_NORMAL}:1`, () => {
        const theme = generateThemeFromPalette(palette, "dark");
        const ratio = contrastRatio(theme.foreground, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_NORMAL}:1, got ${ratio.toFixed(2)}:1 ` +
            `(fg ${theme.foreground}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      });
    }
  });

  // ------------------------------------------------------------------
  // WCAG AA Large text — accent colors on background
  // Accent colors are typically used for headings, buttons, icons which
  // qualify as "large text" under WCAG (>= 18pt or >= 14pt bold).
  // ------------------------------------------------------------------
  describe("WCAG AA Large: accent on background", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode accent/bg contrast >= ${WCAG_AA_LARGE}:1`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        const ratio = contrastRatio(theme.accent, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_LARGE}:1, got ${ratio.toFixed(2)}:1 ` +
            `(accent ${theme.accent}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });

      it(`${name}: dark mode accent/bg contrast >= ${WCAG_AA_LARGE}:1`, () => {
        const theme = generateThemeFromPalette(palette, "dark");
        const ratio = contrastRatio(theme.accent, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_LARGE}:1, got ${ratio.toFixed(2)}:1 ` +
            `(accent ${theme.accent}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });
    }
  });

  // ------------------------------------------------------------------
  // WCAG AA Large — accentPrimary on background
  // Primary accent used for actionable elements (buttons, links).
  // ------------------------------------------------------------------
  describe("WCAG AA Large: accentPrimary on background", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode accentPrimary/bg contrast >= ${WCAG_AA_LARGE}:1`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        const ratio = contrastRatio(theme.accentPrimary, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_LARGE}:1, got ${ratio.toFixed(2)}:1 ` +
            `(accentPrimary ${theme.accentPrimary}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });

      it(`${name}: dark mode accentPrimary/bg contrast >= ${WCAG_AA_LARGE}:1`, () => {
        const theme = generateThemeFromPalette(palette, "dark");
        const ratio = contrastRatio(theme.accentPrimary, theme.background);
        expect(
          ratio,
          `Expected contrast ratio >= ${WCAG_AA_LARGE}:1, got ${ratio.toFixed(2)}:1 ` +
            `(accentPrimary ${theme.accentPrimary}, bg ${theme.background})`
        ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });
    }
  });

  // ------------------------------------------------------------------
  // Shadow differentiation — neumorphic shadows need distinct values
  // ------------------------------------------------------------------
  describe("shadow differentiation", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode shadowLight != shadowDark`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        expect(theme.shadowLight).not.toBe(theme.shadowDark);
      });

      it(`${name}: dark mode shadowLight != shadowDark`, () => {
        const theme = generateThemeFromPalette(palette, "dark");
        expect(theme.shadowLight).not.toBe(theme.shadowDark);
      });

      it(`${name}: light mode shadowLight is lighter than shadowDark`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        expect(hexBrightness(theme.shadowLight)).toBeGreaterThan(
          hexBrightness(theme.shadowDark)
        );
      });
    }
  });

  // ------------------------------------------------------------------
  // Accent hierarchy — accentSoft should be softer than accent
  // ------------------------------------------------------------------
  describe("accent hierarchy", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      it(`${name}: light mode accentSoft is lighter than accent`, () => {
        const theme = generateThemeFromPalette(palette, "light");
        // accentSoft (lightness 70) should be lighter than accent (lightness 55)
        expect(hexBrightness(theme.accentSoft)).toBeGreaterThanOrEqual(
          hexBrightness(theme.accent)
        );
      });
    }
  });
});
