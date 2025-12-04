/**
 * Neomorphism Style Utilities
 *
 * Shared style objects and helpers for consistent neomorphism styling across components.
 * Uses CSS variables defined in globals.css for theme-aware shadows and colors.
 */

import { CSSProperties } from "react";

// =============================================================================
// BASE STYLES
// =============================================================================

/** Base background that matches the page */
export const neuBase: CSSProperties = {
  background: "var(--background)",
  color: "var(--foreground)",
};

// =============================================================================
// SHADOW PRESETS
// =============================================================================

/** Raised element - appears to float above the surface */
export const neuRaised: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow)",
};

/** Small raised element */
export const neuRaisedSm: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow-sm)",
};

/** Large raised element */
export const neuRaisedLg: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow-lg)",
};

/** Subtle raised effect - for small interactive elements */
export const neuSubtle: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow-subtle)",
};

/** Pressed/inset element - appears carved into the surface */
export const neuInset: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow-inset)",
};

/** Small inset element */
export const neuInsetSm: CSSProperties = {
  ...neuBase,
  boxShadow: "var(--neu-shadow-inset-sm)",
};

/** Flat element - no shadow, just matches background */
export const neuFlat: CSSProperties = {
  ...neuBase,
  boxShadow: "none",
};

// =============================================================================
// COMPONENT-SPECIFIC PRESETS
// =============================================================================

/** Card container style */
export const neuCard: CSSProperties = {
  ...neuRaised,
  borderRadius: "16px",
};

/** Input field style (inset) */
export const neuInput: CSSProperties = {
  ...neuInset,
  borderRadius: "12px",
  border: "none",
};

/** Button style (raised, interactive) */
export const neuButton: CSSProperties = {
  ...neuRaisedSm,
  borderRadius: "12px",
};

/** Pill/badge style */
export const neuPill: CSSProperties = {
  ...neuSubtle,
  borderRadius: "9999px",
};

/** Modal/dialog style */
export const neuModal: CSSProperties = {
  ...neuRaisedLg,
  borderRadius: "20px",
};

/** Dropdown menu style */
export const neuDropdown: CSSProperties = {
  ...neuRaised,
  borderRadius: "12px",
};

/** Navigation item style */
export const neuNavItem: CSSProperties = {
  ...neuBase,
  borderRadius: "12px",
};

/** Active navigation item */
export const neuNavItemActive: CSSProperties = {
  ...neuInsetSm,
  borderRadius: "12px",
};

// =============================================================================
// COLOR ACCENTS (for status indicators, etc.)
// =============================================================================

export const neuColors = {
  // Status colors with soft gradient backgrounds
  success: {
    background: "linear-gradient(135deg, #d4f0e0 0%, #a8dbc4 100%)",
    color: "#2d6a4f",
  },
  warning: {
    background: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
    color: "#a66321",
  },
  danger: {
    background: "linear-gradient(135deg, #fde2e4 0%, #f5c6cb 100%)",
    color: "#9b2c3d",
  },
  info: {
    background: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
    color: "#3d5a80",
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Merge neuomorphism styles with custom styles */
export function neuStyle(
  base: CSSProperties,
  custom?: CSSProperties
): CSSProperties {
  return { ...base, ...custom };
}

/** Get focus ring style for inputs */
export function neuFocusRing(hasError?: boolean): string {
  if (hasError) {
    return "var(--neu-shadow-inset), 0 0 0 2px #ef4444";
  }
  return "var(--neu-shadow-inset), 0 0 0 2px var(--accent)";
}

/** Get interactive hover shadow */
export function neuHoverShadow(): string {
  return "var(--neu-shadow)";
}

/** Get pressed/active shadow */
export function neuActiveShadow(): string {
  return "var(--neu-shadow-inset-sm)";
}

// =============================================================================
// CSS CLASS NAMES (for use with className prop)
// =============================================================================

export const neuClasses = {
  /** Smooth transition for shadow changes */
  transition: "transition-shadow duration-200 ease-out",

  /** Interactive scale effect */
  interactive: "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",

  /** Focus outline removal (use with custom focus styles) */
  noOutline: "focus:outline-none",

  /** Disabled state */
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",

  /** Common rounded corners */
  roundedSm: "rounded-lg",    // 8px
  roundedMd: "rounded-xl",    // 12px
  roundedLg: "rounded-2xl",   // 16px
  roundedFull: "rounded-full",
} as const;

// =============================================================================
// COMPONENT STYLE BUILDERS
// =============================================================================

/** Build complete button styles */
export function buildButtonStyle(options?: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  isPressed?: boolean;
}): CSSProperties {
  const { variant = "primary", isPressed = false } = options || {};

  if (variant === "ghost") {
    return {
      background: "transparent",
      color: "var(--foreground)",
      boxShadow: isPressed ? "var(--neu-shadow-inset-sm)" : "none",
    };
  }

  if (variant === "danger") {
    return {
      background: "linear-gradient(145deg, #ef5350, #c62828)",
      color: "#ffffff",
      boxShadow: isPressed ? "var(--neu-shadow-inset-sm)" : "var(--neu-shadow-sm)",
    };
  }

  if (variant === "secondary") {
    return {
      ...neuBase,
      boxShadow: isPressed ? "var(--neu-shadow-inset-sm)" : "var(--neu-shadow-sm)",
    };
  }

  // Primary
  return {
    background: "linear-gradient(145deg, var(--shadow-light), var(--background))",
    color: "var(--foreground)",
    boxShadow: isPressed ? "var(--neu-shadow-inset-sm)" : "var(--neu-shadow-sm)",
  };
}

/** Build complete input styles */
export function buildInputStyle(options?: {
  hasError?: boolean;
  isFocused?: boolean;
}): CSSProperties {
  const { hasError = false, isFocused = false } = options || {};

  let boxShadow = "var(--neu-shadow-inset)";
  if (hasError) {
    boxShadow = "var(--neu-shadow-inset), 0 0 0 2px #ef4444";
  } else if (isFocused) {
    boxShadow = "var(--neu-shadow-inset), 0 0 0 2px var(--accent)";
  }

  return {
    ...neuBase,
    boxShadow,
    border: "none",
    borderRadius: "12px",
  };
}
