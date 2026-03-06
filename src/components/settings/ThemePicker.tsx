"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sun, Moon, Monitor, Loader2, ImagePlus, ImageIcon, Palette } from "lucide-react";
import Image from "next/image";
import { useTheme, THEME_PRESETS } from "@/contexts/ThemeContext";
import { CUSTOM_THEME_ID, ThemePreset } from "@/lib/theme-presets";
import { generateThemeFromImage } from "@/lib/utils/color-extractor";
import { Button } from "@/components/ui/Button";

export function ThemePicker() {
  const {
    themeId,
    colorMode,
    effectiveMode,
    currentTheme,
    setThemeId,
    setColorMode,
    setCustomTheme,
    customTheme,
    setBannerOverride,
  } = useTheme();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingTheme, setPendingTheme] = useState<ThemePreset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetClick = (theme: ThemePreset) => {
    if (themeId === theme.id) return; // Already selected
    // If the user already has a banner (from another preset or custom), ask about replacing
    if (themeId !== theme.id) {
      setPendingTheme(theme);
    }
  };

  const applyThemeWithBanner = () => {
    if (!pendingTheme) return;
    setBannerOverride(null); // Clear any override, use the preset's banner
    setThemeId(pendingTheme.id);
    setPendingTheme(null);
  };

  const applyThemeKeepBanner = () => {
    if (!pendingTheme) return;
    // Preserve the current theme's banner as an override
    const bannerToKeep = currentTheme.banner;
    setThemeId(pendingTheme.id);
    setBannerOverride(bannerToKeep);
    setPendingTheme(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create a data URL from the file
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract colors and generate theme
      const themeColors = await generateThemeFromImage(dataUrl);

      // Set the custom theme
      setCustomTheme({
        bannerUrl: dataUrl,
        colors: {
          light: themeColors.light,
          dark: themeColors.dark,
        },
      });

      // Switch to custom theme
      setThemeId(CUSTOM_THEME_ID);
    } catch (error) {
      console.error("Failed to process image:", error);
      setUploadError("Failed to process image. Please try another.");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Color Mode Toggle */}
      <div>
        <label
          className="mb-3 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Color Mode
        </label>
        <div className="flex gap-2">
          {[
            { value: "light" as const, icon: Sun, label: "Light" },
            { value: "dark" as const, icon: Moon, label: "Dark" },
            { value: "system" as const, icon: Monitor, label: "System" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setColorMode(value)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                background: colorMode === value ? "var(--foreground)" : "var(--background)",
                color: colorMode === value ? "var(--background)" : "var(--foreground)",
                boxShadow: colorMode === value ? "var(--neu-shadow-inset-sm)" : "var(--neu-shadow-sm)",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Presets */}
      <div>
        <label
          className="mb-3 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Theme
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_PRESETS.map((theme) => {
            const isSelected = themeId === theme.id;
            const bannerUrl = theme.banner[effectiveMode];
            const previewColors = theme.colors[effectiveMode];

            return (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetClick(theme)}
                className="relative overflow-hidden rounded-2xl text-left transition-all"
                style={{
                  boxShadow: isSelected
                    ? `var(--neu-shadow), 0 0 0 3px ${previewColors.foreground}`
                    : "var(--neu-shadow-sm)",
                }}
              >
                {/* Banner Preview */}
                <div
                  className="relative aspect-[16/9] w-full overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${previewColors.background} 0%, ${previewColors.accentPrimary} 100%)`,
                  }}
                >
                  <Image
                    src={bannerUrl}
                    alt={theme.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load, gradient will show through
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                  {isSelected && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <div
                        className="rounded-full p-2"
                        style={{ background: "var(--background)" }}
                      >
                        <Check className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div
                  className="p-3"
                  style={{ background: previewColors.background }}
                >
                  <h4
                    className="font-medium text-sm"
                    style={{ color: previewColors.foreground }}
                  >
                    {theme.name}
                  </h4>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: previewColors.accent }}
                  >
                    {theme.description}
                  </p>

                  {/* Color Swatches */}
                  <div className="flex gap-1 mt-2">
                    {[
                      previewColors.background,
                      previewColors.foreground,
                      previewColors.accentPrimary,
                      previewColors.accentSoft,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full"
                        style={{
                          background: color,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* Custom Theme Upload Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (customTheme) {
                // If we have a custom theme, switch to it
                setThemeId(CUSTOM_THEME_ID);
              } else {
                // If no custom theme, open file picker
                fileInputRef.current?.click();
              }
            }}
            className="relative overflow-hidden rounded-2xl text-left transition-all w-full"
            style={{
              boxShadow: themeId === CUSTOM_THEME_ID
                ? `var(--neu-shadow), 0 0 0 3px var(--foreground)`
                : "var(--neu-shadow-sm)",
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload area or custom theme preview */}
            {customTheme ? (
              <>
                {/* Custom Theme Preview */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={customTheme.bannerUrl}
                    alt="Custom theme"
                    fill
                    className="object-cover"
                  />
                  {themeId === CUSTOM_THEME_ID && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <div
                        className="rounded-full p-2"
                        style={{ background: "var(--background)" }}
                      >
                        <Check className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className="p-3"
                  style={{ background: customTheme.colors[effectiveMode].background }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className="font-medium text-sm"
                        style={{ color: customTheme.colors[effectiveMode].foreground }}
                      >
                        Custom Theme
                      </h4>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: customTheme.colors[effectiveMode].accent }}
                      >
                        Your personalized banner
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting the theme
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="rounded-lg px-2 py-1 text-xs transition-all hover:opacity-80"
                      style={{
                        background: customTheme.colors[effectiveMode].accentPrimary,
                        color: customTheme.colors[effectiveMode].background,
                      }}
                    >
                      {isUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Change"
                      )}
                    </button>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex gap-1 mt-2">
                    {[
                      customTheme.colors[effectiveMode].background,
                      customTheme.colors[effectiveMode].foreground,
                      customTheme.colors[effectiveMode].accentPrimary,
                      customTheme.colors[effectiveMode].accentSoft,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full"
                        style={{
                          background: color,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Upload prompt */
              <div
                className="flex w-full flex-col items-center justify-center p-6 text-center transition-all"
                style={{ background: "var(--background)" }}
              >
                {isUploading ? (
                  <Loader2
                    className="h-10 w-10 animate-spin mb-2"
                    style={{ color: "var(--accent)" }}
                  />
                ) : (
                  <ImagePlus
                    className="h-10 w-10 mb-2"
                    style={{ color: "var(--accent)" }}
                  />
                )}
                <h4
                  className="font-medium text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  Custom Banner
                </h4>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--accent)" }}
                >
                  {isUploading ? "Processing..." : "Upload your own image"}
                </p>
              </div>
            )}
          </motion.button>
        </div>

        {/* Upload error message */}
        {uploadError && (
          <p className="text-sm mt-2" style={{ color: "#c44" }}>
            {uploadError}
          </p>
        )}
      </div>

      {/* Banner replacement confirmation */}
      <AnimatePresence>
        {pendingTheme && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setPendingTheme(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow)",
              }}
            >
              {/* Preview of new theme's banner */}
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image
                  src={pendingTheme.banner[effectiveMode]}
                  alt={pendingTheme.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0";
                  }}
                />
              </div>

              <div className="p-4 space-y-3">
                <h4
                  className="font-semibold text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  Switch to {pendingTheme.name}
                </h4>
                <p
                  className="text-xs"
                  style={{ color: "var(--accent)" }}
                >
                  Would you like to use this theme&apos;s banner image too, or keep your current one?
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={applyThemeWithBanner}
                    leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
                    className="flex-1"
                  >
                    Use this banner
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={applyThemeKeepBanner}
                    leftIcon={<Palette className="h-3.5 w-3.5" />}
                    className="flex-1"
                  >
                    Colors only
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
