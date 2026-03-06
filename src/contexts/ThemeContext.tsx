"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  ThemePreset,
  ThemeColors,
  CustomTheme,
  THEME_PRESETS,
  DEFAULT_THEME_ID,
  CUSTOM_THEME_ID,
  getThemePreset,
} from "@/lib/theme-presets";

type ColorMode = "light" | "dark" | "system";

interface BannerOverride {
  light: string;
  dark: string;
}

interface ThemeContextType {
  themeId: string;
  colorMode: ColorMode;
  effectiveMode: "light" | "dark";
  currentTheme: ThemePreset;
  currentColors: ThemeColors;
  bannerUrl: string;
  customTheme: CustomTheme | null;
  setThemeId: (id: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setCustomTheme: (theme: CustomTheme) => void;
  setBannerOverride: (override: BannerOverride | null) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: string;
}

// Local storage keys
const CUSTOM_THEME_STORAGE_KEY = "writrospect-custom-theme";
const BANNER_OVERRIDE_STORAGE_KEY = "writrospect-banner-override";

export function ThemeProvider({
  children,
  initialThemeId = DEFAULT_THEME_ID,
}: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState(initialThemeId);
  const [colorMode, setColorModeState] = useState<ColorMode>("system");
  const [systemMode, setSystemMode] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(null);
  const [bannerOverride, setBannerOverrideState] = useState<BannerOverride | null>(null);

  // Determine effective mode based on colorMode setting
  const effectiveMode = colorMode === "system" ? systemMode : colorMode;

  // Get current theme preset and colors (handle custom theme)
  const isCustom = themeId === CUSTOM_THEME_ID && customTheme !== null;

  const currentTheme: ThemePreset = isCustom
    ? {
        id: CUSTOM_THEME_ID,
        name: "Custom Theme",
        description: "Your personalized banner",
        isCustom: true,
        banner: {
          light: customTheme.bannerUrl,
          dark: customTheme.bannerUrl,
        },
        colors: customTheme.colors,
      }
    : getThemePreset(themeId);

  const currentColors = currentTheme.colors[effectiveMode];
  const bannerUrl = bannerOverride
    ? bannerOverride[effectiveMode]
    : currentTheme.banner[effectiveMode];

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemMode(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Apply theme CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--background", currentColors.background);
    root.style.setProperty("--foreground", currentColors.foreground);
    root.style.setProperty("--shadow-light", currentColors.shadowLight);
    root.style.setProperty("--shadow-dark", currentColors.shadowDark);
    root.style.setProperty("--accent", currentColors.accent);
    root.style.setProperty("--accent-soft", currentColors.accentSoft);
    root.style.setProperty("--accent-primary", currentColors.accentPrimary);
    root.style.setProperty("--accent-border", currentColors.accentBorder);
  }, [currentColors]);

  // Load custom theme and banner override from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomTheme;
        setCustomThemeState(parsed);
      }
    } catch {
      // Silently fail - no custom theme
    }
    try {
      const storedBanner = localStorage.getItem(BANNER_OVERRIDE_STORAGE_KEY);
      if (storedBanner) {
        setBannerOverrideState(JSON.parse(storedBanner));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Load saved theme from API
  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch("/api/user/theme");
        if (res.ok) {
          const data = await res.json();
          if (data.themeId) {
            setThemeIdState(data.themeId);
          }
          if (data.colorMode) {
            setColorModeState(data.colorMode);
          }
        }
      } catch {
        // Silently fail - use defaults
      } finally {
        setIsLoading(false);
      }
    }
    loadTheme();
  }, []);

  // Save theme to API and update state
  const setThemeId = useCallback(async (id: string) => {
    setThemeIdState(id);
    try {
      await fetch("/api/user/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: id }),
      });
    } catch {
      // Silently fail - theme is still applied locally
    }
  }, []);

  // Save color mode preference
  const setColorMode = useCallback(async (mode: ColorMode) => {
    setColorModeState(mode);
    try {
      await fetch("/api/user/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorMode: mode }),
      });
    } catch {
      // Silently fail
    }
  }, []);

  // Set custom theme and save to localStorage
  const setCustomTheme = useCallback((theme: CustomTheme) => {
    setCustomThemeState(theme);
    try {
      localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Silently fail - storage might be full
    }
  }, []);

  // Set banner override (use a different theme's banner with current colors)
  const setBannerOverride = useCallback((override: BannerOverride | null) => {
    setBannerOverrideState(override);
    try {
      if (override) {
        localStorage.setItem(BANNER_OVERRIDE_STORAGE_KEY, JSON.stringify(override));
      } else {
        localStorage.removeItem(BANNER_OVERRIDE_STORAGE_KEY);
      }
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        colorMode,
        effectiveMode,
        currentTheme,
        currentColors,
        bannerUrl,
        customTheme,
        setThemeId,
        setColorMode,
        setCustomTheme,
        setBannerOverride,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Export available themes for UI
export { THEME_PRESETS };
