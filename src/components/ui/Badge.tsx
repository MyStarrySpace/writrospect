"use client";

import { HTMLAttributes, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// Light mode: soft pastel gradients
const lightStyles: Record<BadgeVariant, { gradient: string; text: string }> = {
  default: {
    gradient: "linear-gradient(135deg, var(--shadow-light) 0%, var(--background) 100%)",
    text: "var(--foreground)"
  },
  secondary: {
    gradient: "linear-gradient(135deg, #e8dff5 0%, #d4c8e8 100%)",
    text: "#6b5b8a"
  },
  success: {
    gradient: "linear-gradient(135deg, #d4f0e0 0%, #a8dbc4 100%)",
    text: "#2d6a4f"
  },
  warning: {
    gradient: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
    text: "#a66321"
  },
  danger: {
    gradient: "linear-gradient(135deg, #fde2e4 0%, #f5c6cb 100%)",
    text: "#9b2c3d"
  },
  info: {
    gradient: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
    text: "#3d5a80"
  },
};

// Convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Target hues for each variant, blended with theme saturation
const variantHues: Record<BadgeVariant, number> = {
  default: -1,   // use theme hue
  secondary: -1, // use theme hue
  success: 155,
  warning: 38,
  danger: 0,
  info: 210,
};

function getDarkStyle(
  variant: BadgeVariant,
  themeHsl: [number, number, number],
) {
  const [themeH, themeS] = themeHsl;
  const isNeutral = variant === "default" || variant === "secondary";

  // Use theme hue for neutral variants, target hue for semantic ones
  // Blend saturation: semantic variants get boosted saturation, influenced by theme
  const h = isNeutral ? themeH : variantHues[variant];
  const s = isNeutral ? Math.max(themeS, 20) : Math.round(themeS * 0.3 + 55);

  const hsl = (alpha: number, lightness: number) =>
    `hsla(${h}, ${s}%, ${lightness}%, ${alpha})`;

  return {
    gradient: `linear-gradient(135deg, ${hsl(0.12, 60)} 0%, ${hsl(0.06, 50)} 100%)`,
    text: `hsl(${h}, ${Math.min(s + 15, 90)}%, 78%)`,
    glow: isNeutral
      ? "var(--neu-shadow-subtle)"
      : `0 0 7px ${hsl(0.25, 55)}, 0 0 2px ${hsl(0.4, 60)}`,
    border: isNeutral ? "none" : `1px solid ${hsl(0.15, 55)}`,
  };
}

export function Badge({ variant = "default", className = "", children, style, ...props }: BadgeProps) {
  const { effectiveMode, currentColors } = useTheme();

  const darkStyle = useMemo(() => {
    if (effectiveMode !== "dark") return null;
    const themeHsl = hexToHsl(currentColors.accentPrimary);
    return getDarkStyle(variant, themeHsl);
  }, [effectiveMode, currentColors.accentPrimary, variant]);

  if (effectiveMode === "dark" && darkStyle) {
    return (
      <span
        className={`
          inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
          transition-all duration-200
          ${className}
        `}
        style={{
          background: darkStyle.gradient,
          color: darkStyle.text,
          boxShadow: darkStyle.glow,
          border: darkStyle.border,
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }

  const variantStyle = lightStyles[variant];
  const isNeutral = variant === "default" || variant === "secondary";

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
        transition-all duration-200
        ${className}
      `}
      style={{
        background: variantStyle.gradient,
        color: variantStyle.text,
        boxShadow: isNeutral
          ? "var(--neu-shadow-subtle)"
          : "2px 2px 6px rgba(0,0,0,0.08), -1px -1px 3px rgba(255,255,255,0.6)",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
