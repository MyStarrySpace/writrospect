/**
 * Extracts dominant colors from an image and generates a theme palette
 */

export interface ExtractedPalette {
  dominant: string;
  secondary: string;
  accent: string;
  muted: string;
}

export interface GeneratedThemeColors {
  background: string;
  foreground: string;
  shadowLight: string;
  shadowDark: string;
  accent: string;
  accentSoft: string;
  accentPrimary: string;
  accentBorder: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate color distance using simple Euclidean distance
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Get luminance of a color (0-1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * K-means clustering to find dominant colors
 */
function kMeansClustering(pixels: RGB[], k: number, maxIterations = 10): RGB[] {
  if (pixels.length === 0) return [];

  // Initialize centroids randomly from pixels
  const centroids: RGB[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign pixels to clusters
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < k; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(pixel);
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;

      const newCentroid = {
        r: Math.round(
          clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length
        ),
        g: Math.round(
          clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length
        ),
        b: Math.round(
          clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length
        ),
      };

      if (colorDistance(centroids[i], newCentroid) > 1) {
        converged = false;
      }

      centroids[i] = newCentroid;
    }

    if (converged) break;
  }

  // Sort by cluster size (most pixels = most dominant)
  return centroids;
}

/**
 * Extract colors from an image using canvas
 */
export async function extractColorsFromImage(
  imageUrl: string
): Promise<ExtractedPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Scale down for performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels: RGB[] = [];

      // Sample pixels (skip every few for performance)
      for (let i = 0; i < imageData.data.length; i += 16) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Skip very dark or very light pixels for better color extraction
        const luminance = getLuminance(r, g, b);
        if (luminance > 0.05 && luminance < 0.95) {
          pixels.push({ r, g, b });
        }
      }

      if (pixels.length < 10) {
        // Fallback to default palette if not enough colors
        resolve({
          dominant: "#a890a8",
          secondary: "#e8dde8",
          accent: "#9a8a9a",
          muted: "#b8a8b8",
        });
        return;
      }

      // Extract 4 dominant colors
      const dominantColors = kMeansClustering(pixels, 4);

      // Sort by saturation to find the most vibrant color for accent
      const withSaturation = dominantColors.map((c) => ({
        rgb: c,
        hsl: rgbToHsl(c.r, c.g, c.b),
      }));

      withSaturation.sort((a, b) => b.hsl.s - a.hsl.s);

      resolve({
        dominant: rgbToHex(dominantColors[0].r, dominantColors[0].g, dominantColors[0].b),
        secondary: rgbToHex(dominantColors[1]?.r ?? 200, dominantColors[1]?.g ?? 200, dominantColors[1]?.b ?? 200),
        accent: rgbToHex(withSaturation[0].rgb.r, withSaturation[0].rgb.g, withSaturation[0].rgb.b),
        muted: rgbToHex(dominantColors[2]?.r ?? 180, dominantColors[2]?.g ?? 180, dominantColors[2]?.b ?? 180),
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}

/**
 * Generate a full theme from extracted palette colors
 */
export function generateThemeFromPalette(
  palette: ExtractedPalette,
  mode: "light" | "dark"
): GeneratedThemeColors {
  const dominant = hexToRgb(palette.dominant);
  const accent = hexToRgb(palette.accent);
  const dominantHsl = rgbToHsl(dominant.r, dominant.g, dominant.b);
  const accentHsl = rgbToHsl(accent.r, accent.g, accent.b);

  if (mode === "light") {
    // Light mode: light background, dark text
    const bgLightness = Math.max(85, Math.min(92, dominantHsl.l + 30));
    const bgSaturation = Math.max(10, Math.min(25, dominantHsl.s * 0.5));

    const bg = hslToRgb(dominantHsl.h, bgSaturation, bgLightness);
    const fg = hslToRgb(dominantHsl.h, bgSaturation * 0.8, 25);
    const shadowLight = hslToRgb(dominantHsl.h, bgSaturation * 0.5, bgLightness + 5);
    const shadowDark = hslToRgb(dominantHsl.h, bgSaturation, bgLightness - 8);

    const accentPrimary = hslToRgb(accentHsl.h, Math.min(40, accentHsl.s), 60);
    const accentSoft = hslToRgb(accentHsl.h, Math.min(30, accentHsl.s * 0.7), 70);
    const accentColor = hslToRgb(accentHsl.h, Math.min(35, accentHsl.s * 0.8), 55);
    const accentBorder = hslToRgb(accentHsl.h, Math.min(25, accentHsl.s * 0.6), 75);

    return {
      background: rgbToHex(bg.r, bg.g, bg.b),
      foreground: rgbToHex(fg.r, fg.g, fg.b),
      shadowLight: rgbToHex(shadowLight.r, shadowLight.g, shadowLight.b),
      shadowDark: rgbToHex(shadowDark.r, shadowDark.g, shadowDark.b),
      accent: rgbToHex(accentColor.r, accentColor.g, accentColor.b),
      accentSoft: rgbToHex(accentSoft.r, accentSoft.g, accentSoft.b),
      accentPrimary: rgbToHex(accentPrimary.r, accentPrimary.g, accentPrimary.b),
      accentBorder: rgbToHex(accentBorder.r, accentBorder.g, accentBorder.b),
    };
  } else {
    // Dark mode: dark background, light text
    const bgLightness = Math.max(12, Math.min(18, dominantHsl.l * 0.2));
    const bgSaturation = Math.max(15, Math.min(30, dominantHsl.s * 0.4));

    const bg = hslToRgb(dominantHsl.h, bgSaturation, bgLightness);
    const fg = hslToRgb(dominantHsl.h, bgSaturation * 0.5, 88);
    const shadowLight = hslToRgb(dominantHsl.h, bgSaturation, bgLightness + 8);
    const shadowDark = hslToRgb(dominantHsl.h, bgSaturation, bgLightness - 5);

    const accentPrimary = hslToRgb(accentHsl.h, Math.min(35, accentHsl.s * 0.6), 65);
    const accentSoft = hslToRgb(accentHsl.h, Math.min(25, accentHsl.s * 0.4), 55);
    const accentColor = hslToRgb(accentHsl.h, Math.min(40, accentHsl.s * 0.7), 75);
    const accentBorder = hslToRgb(accentHsl.h, Math.min(30, accentHsl.s * 0.5), 35);

    return {
      background: rgbToHex(bg.r, bg.g, bg.b),
      foreground: rgbToHex(fg.r, fg.g, fg.b),
      shadowLight: rgbToHex(shadowLight.r, shadowLight.g, shadowLight.b),
      shadowDark: rgbToHex(shadowDark.r, shadowDark.g, shadowDark.b),
      accent: rgbToHex(accentColor.r, accentColor.g, accentColor.b),
      accentSoft: rgbToHex(accentSoft.r, accentSoft.g, accentSoft.b),
      accentPrimary: rgbToHex(accentPrimary.r, accentPrimary.g, accentPrimary.b),
      accentBorder: rgbToHex(accentBorder.r, accentBorder.g, accentBorder.b),
    };
  }
}

/**
 * Extract colors and generate both light and dark themes from an image
 */
export async function generateThemeFromImage(imageUrl: string): Promise<{
  palette: ExtractedPalette;
  light: GeneratedThemeColors;
  dark: GeneratedThemeColors;
}> {
  const palette = await extractColorsFromImage(imageUrl);
  return {
    palette,
    light: generateThemeFromPalette(palette, "light"),
    dark: generateThemeFromPalette(palette, "dark"),
  };
}
