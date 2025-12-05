// Theme presets with banner images and matching color palettes
// Each theme has light and dark variants

export interface ThemeColors {
  background: string;
  foreground: string;
  shadowLight: string;
  shadowDark: string;
  accent: string;
  accentSoft: string;
  accentPrimary: string;
  accentBorder: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  banner: {
    light: string;
    dark: string;
  };
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

// Custom theme stored in database/local storage
export interface CustomTheme {
  bannerUrl: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const CUSTOM_THEME_ID = "custom";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "zen-garden",
    name: "Zen Garden",
    description: "Soft pink-lavender tones inspired by a peaceful zen garden",
    banner: {
      light: "/images/banner-light.jpg",
      dark: "/images/banner-dark.jpg",
    },
    colors: {
      light: {
        background: "#e8dde8",
        foreground: "#5c4a5c",
        shadowLight: "#f7f0f7",
        shadowDark: "#d4c4d4",
        accent: "#9a8a9a",
        accentSoft: "#b8a8b8",
        accentPrimary: "#a890a8",
        accentBorder: "#c8b0c8",
      },
      dark: {
        background: "#2a2030",
        foreground: "#e8dde8",
        shadowLight: "#3a2e42",
        shadowDark: "#1a1420",
        accent: "#c8b8c8",
        accentSoft: "#a090a0",
        accentPrimary: "#b8a0b8",
        accentBorder: "#6a5070",
      },
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Calming blue-teal tones like a peaceful seaside",
    banner: {
      light: "/images/banners/ocean-light.jpg",
      dark: "/images/banners/ocean-dark.jpg",
    },
    colors: {
      light: {
        background: "#e0e8ed",
        foreground: "#3d5a6c",
        shadowLight: "#f0f5f8",
        shadowDark: "#c8d4dc",
        accent: "#7a9aaa",
        accentSoft: "#9bb4c0",
        accentPrimary: "#6a8fa5",
        accentBorder: "#a8c4d0",
      },
      dark: {
        background: "#1e2830",
        foreground: "#d8e4eb",
        shadowLight: "#2a3640",
        shadowDark: "#141c22",
        accent: "#8ab0c4",
        accentSoft: "#6a90a4",
        accentPrimary: "#7aa0b8",
        accentBorder: "#4a6878",
      },
    },
  },
  {
    id: "forest-moss",
    name: "Forest Moss",
    description: "Earthy green tones like a quiet forest floor",
    banner: {
      light: "/images/banners/forest-light.jpg",
      dark: "/images/banners/forest-dark.jpg",
    },
    colors: {
      light: {
        background: "#e4e8e0",
        foreground: "#4a5c48",
        shadowLight: "#f4f6f0",
        shadowDark: "#ccd4c8",
        accent: "#8a9a88",
        accentSoft: "#a8b4a6",
        accentPrimary: "#7a9078",
        accentBorder: "#b8c8b6",
      },
      dark: {
        background: "#222820",
        foreground: "#d8e4d6",
        shadowLight: "#303830",
        shadowDark: "#161a14",
        accent: "#a8c4a6",
        accentSoft: "#88a486",
        accentPrimary: "#98b496",
        accentBorder: "#586858",
      },
    },
  },
  {
    id: "sunset-warmth",
    name: "Sunset Warmth",
    description: "Warm peach and amber tones like a golden hour sunset",
    banner: {
      light: "/images/banners/sunset-light.jpg",
      dark: "/images/banners/sunset-dark.jpg",
    },
    colors: {
      light: {
        background: "#f0e6e0",
        foreground: "#6a5048",
        shadowLight: "#fcf4f0",
        shadowDark: "#dcccc4",
        accent: "#b0948a",
        accentSoft: "#c8aea4",
        accentPrimary: "#c0887a",
        accentBorder: "#d8beb4",
      },
      dark: {
        background: "#302420",
        foreground: "#f0e4de",
        shadowLight: "#423430",
        shadowDark: "#201814",
        accent: "#d4b4a8",
        accentSoft: "#b49488",
        accentPrimary: "#c8a498",
        accentBorder: "#7a5a50",
      },
    },
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Deep purple tones like a starlit night sky",
    banner: {
      light: "/images/banners/midnight-light.jpg",
      dark: "/images/banners/midnight-dark.jpg",
    },
    colors: {
      light: {
        background: "#e8e4f0",
        foreground: "#4a4060",
        shadowLight: "#f6f2fc",
        shadowDark: "#d0cade",
        accent: "#9088a8",
        accentSoft: "#aca4c0",
        accentPrimary: "#8878a8",
        accentBorder: "#c4b8d8",
      },
      dark: {
        background: "#242030",
        foreground: "#e4dff0",
        shadowLight: "#342e44",
        shadowDark: "#181420",
        accent: "#b8aed0",
        accentSoft: "#988eb0",
        accentPrimary: "#a89ec0",
        accentBorder: "#5a4e70",
      },
    },
  },
];

// Default theme is zen-garden (the original)
export const DEFAULT_THEME_ID = "zen-garden";

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
}

export function getThemeColors(
  themeId: string,
  mode: "light" | "dark"
): ThemeColors {
  const preset = getThemePreset(themeId);
  return preset.colors[mode];
}

export function generateCSSVariables(colors: ThemeColors): string {
  return `
    --background: ${colors.background};
    --foreground: ${colors.foreground};
    --shadow-light: ${colors.shadowLight};
    --shadow-dark: ${colors.shadowDark};
    --accent: ${colors.accent};
    --accent-soft: ${colors.accentSoft};
    --accent-primary: ${colors.accentPrimary};
    --accent-border: ${colors.accentBorder};
  `;
}
