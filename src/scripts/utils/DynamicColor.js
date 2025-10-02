/**
 * Dynamic Color Utility
 * Extracts color palettes from images and applies dynamic themes
 */

import { ColorFunctions } from './ColorFunctions.js';

export class DynamicColor {
  constructor(options = {}) {
    this.img = null;
    this.threshold = options.threshold ?? 40;
    this.numColors = options.numColors ?? 5;
    this.colorFunctions = new ColorFunctions();
    this.colorThief = new ColorThief();
  }

  setConfig({ img, threshold, numColors } = {}) {
    if (img instanceof HTMLImageElement) this.img = img;
    if (threshold !== undefined) this.threshold = threshold;
    if (numColors !== undefined) this.numColors = numColors;
  }

  extractPalette() {
    if (!this.img)
      return Promise.reject(new Error("Nessuna immagine impostata."));

    return new Promise((resolve, reject) => {
      const processImage = () => {
        if (this.img.naturalWidth === 0) {
          return reject(
            new Error(
              "L'immagine non è riuscita a caricarsi correttamente (dimensioni 0)."
            )
          );
        }
        try {
          const palette = this.colorThief.getPalette(
            this.img,
            this.numColors + 5
          );
          resolve(palette);
        } catch (err) {
          reject(err);
        }
      };

      if (this.img.complete) {
        processImage();
      } else {
        this.img.addEventListener("load", processImage, { once: true });
        this.img.addEventListener(
          "error",
          () =>
            reject(new Error("Errore durante il caricamento dell'immagine.")),
          { once: true }
        );
      }
    });
  }

  _filterDistinctColors(palette, minDistance) {
    if (!Array.isArray(palette) || palette.length <= 1) return palette;

    const sorted = this.sortPaletteByBrightness(palette);
    const filtered = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const isDistinct = filtered.every(
        (keptColor) =>
          this.colorFunctions.colorDistance(current, keptColor) >= minDistance
      );
      if (isDistinct) {
        filtered.push(current);
      }
    }
    return filtered;
  }

  _generateGradientPalette(startColor, endColor, steps) {
    if (steps < 1) return [];
    if (steps === 1) return [startColor.map(Math.round)];

    const palette = [];
    const intervals = steps > 1 ? steps - 1 : 1;
    for (let i = 0; i < steps; i++) {
      const ratio = intervals > 0 ? i / intervals : 0;
      palette.push(this.interpolateColor(startColor, endColor, ratio));
    }
    return palette;
  }

  sortPaletteByBrightness(palette) {
    if (!palette || palette.length <= 1) return palette;
    return [...palette].sort(
      (a, b) =>
        this.colorFunctions.getBrightness(a) -
        this.colorFunctions.getBrightness(b)
    );
  }

  calculateTextColor(sortedPalette) {
    if (!Array.isArray(sortedPalette) || sortedPalette.length === 0) {
      throw new Error("La palette deve essere un array non vuoto.");
    }
    const darkestColor = sortedPalette[0];
    const lightestColor = sortedPalette[sortedPalette.length - 1];
    const avgBrightness = this.colorFunctions.averageBrightness(sortedPalette);

    const baseTextColor = avgBrightness > 128 ? darkestColor : lightestColor;
    return this.adjustLightness(baseTextColor, avgBrightness);
  }

  adjustLightness(color, avgBgBrightness) {
    const [h, s, l] = this.colorFunctions.rgbToHsl(...color);
    const isDarkBg = avgBgBrightness < 128;
    if (s < 0.1) return isDarkBg ? [255, 255, 255] : [0, 0, 0];
    let newL = l;
    if (isDarkBg && l < 0.65) newL = 0.85;
    if (!isDarkBg && l > 0.35) newL = 0.15;
    return this.colorFunctions.hslToRgb(h, s, newL).map(Math.round);
  }

  interpolateColor(colorA, colorB, ratio = 0.5) {
    const r = (val) => Math.round(val);
    ratio = Math.max(0, Math.min(1, ratio));
    return [
      r(colorA[0] + (colorB[0] - colorA[0]) * ratio),
      r(colorA[1] + (colorB[1] - colorA[1]) * ratio),
      r(colorA[2] + (colorB[2] - colorA[2]) * ratio),
    ];
  }

  _setThemeProperties(properties) {
    const root = document.documentElement;

    // Add smooth transitions when applying theme
    root.style.setProperty('--theme-transition-duration', '0.8s');

    // Apply properties with transition
    for (const [key, value] of Object.entries(properties)) {
      const currentValue = getComputedStyle(root).getPropertyValue(key).trim();
      if (currentValue && currentValue !== value) {
        // Animate the transition
        root.style.setProperty(key, value);
      } else {
        root.style.setProperty(key, value);
      }
    }

    // Remove transition after animation completes
    setTimeout(() => {
      root.style.setProperty('--theme-transition-duration', '0s');
    }, 800);
  }

  _createThemeProperties(palette) {
    const sortedPalette = this.sortPaletteByBrightness(palette);
    const darkest = sortedPalette[0];
    const lightest = sortedPalette[sortedPalette.length - 1];

    // Text Color
    const textColor = this.calculateTextColor(sortedPalette);
    const textRgb = textColor.join(", ");

    // Role-based colors
    const primary = this.colorFunctions
      .averageColor(sortedPalette)
      .map(Math.round);
    const secondary = sortedPalette.length > 1 ? sortedPalette[1] : darkest;
    const accent = [...palette].sort((a, b) => {
      const satA = this.colorFunctions.rgbToHsl(...a)[1];
      const satB = this.colorFunctions.rgbToHsl(...b)[1];
      return satB - satA;
    })[0];

    const primaryRgb = primary.join(", ");
    const secondaryRgb = secondary.join(", ");
    const accentRgb = accent.join(", ");

    const avgBrightness = this.colorFunctions.averageBrightness(sortedPalette);

    // Generate additional dynamic colors for animations
    const vibrantColor = [...palette].sort((a, b) => {
      const satA = this.colorFunctions.rgbToHsl(...a)[1];
      const satB = this.colorFunctions.rgbToHsl(...b)[1];
      return satB - satA;
    })[0];

    const mutedColor = this.colorFunctions.adjustSaturation(vibrantColor, 0.3);
    const glowColor = this.colorFunctions.adjustLightness(vibrantColor, 0.7);

    return {
      "--color-primary": `rgb(${primaryRgb})`,
      "--color-primary-rgb": primaryRgb,
      "--color-secondary": `rgb(${secondaryRgb})`,
      "--color-secondary-rgb": secondaryRgb,
      "--color-accent": `rgb(${accentRgb})`,
      "--color-accent-rgb": accentRgb,
      "--color-accent-2": `rgb(${vibrantColor.join(", ")})`,
      "--color-accent-2-rgb": vibrantColor.join(", "),
      "--color-text-primary": `rgb(${textRgb})`,
      "--color-text-primary-rgb": textRgb,
      "--color-text-secondary": `rgba(${textRgb}, 0.82)`,
      "--color-bg-primary": this.colorFunctions.arrayToRgb(darkest),
      "--color-bg-secondary": this.colorFunctions.arrayToRgb(secondary),
      "--color-surface-glass": `linear-gradient(135deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${secondaryRgb}, 0.08) 50%, rgba(${accentRgb}, 0.03) 100%)`,
      "--color-border-primary": `rgba(${lightest.join(", ")}, 0.2)`,
      "--color-shadow-primary": `rgba(0, 0, 0, 0.1)`,
      "--color-shadow-accent": `rgba(${accentRgb}, 0.2)`,

      // Animation colors
      "--vibrant-color": `rgb(${vibrantColor.join(", ")})`,
      "--vibrant-color-rgb": vibrantColor.join(", "),
      "--muted-color": `rgb(${mutedColor.join(", ")})`,
      "--muted-color-rgb": mutedColor.join(", "),
      "--glow-color": `rgb(${glowColor.join(", ")})`,
      "--glow-color-rgb": glowColor.join(", "),
      "--animation-primary": `rgba(${accentRgb}, 0.8)`,
      "--animation-secondary": `rgba(${vibrantColor.join(", ")}, 0.6)`,
      "--hover-glow": `0 0 20px rgba(${vibrantColor.join(", ")}, 0.4)`,

      // Additional colors for UI states (using derived colors)
      "--color-error": `rgb(${this.colorFunctions.adjustHue(vibrantColor, 0.05).join(", ")})`,
      "--color-error-rgb": this.colorFunctions.adjustHue(vibrantColor, 0.05).join(", "),
      "--color-success": `rgb(${this.colorFunctions.adjustHue(accent, 0.3).join(", ")})`,
      "--color-success-rgb": this.colorFunctions.adjustHue(accent, 0.3).join(", "),

      "color-scheme": avgBrightness < 128 ? "dark" : "light",
    };
  }

  updateTheme(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      this.applyFallbackTheme();
      return;
    }
    const themeProperties = this._createThemeProperties(palette);
    this._setThemeProperties(themeProperties);
  }

  applyFallbackTheme() {
    const fallbackProperties = {
      "--color-primary": "#21005e",
      "--color-primary-rgb": "33, 0, 94",
      "--color-secondary": "#5a189a",
      "--color-secondary-rgb": "90, 24, 154",
      "--color-accent": "#a259ff",
      "--color-accent-rgb": "162, 89, 255",
      "--color-accent-2": "#f72585",
      "--color-accent-2-rgb": "247, 37, 133",
      "--color-text-primary": "#f8f8ff",
      "--color-text-primary-rgb": "248, 248, 255",
      "--color-text-secondary": "rgba(248, 248, 255, 0.82)",
      "--color-bg-primary": "#1a0036",
      "--color-bg-secondary": "#2d006e",
      "--color-surface-glass": "linear-gradient(120deg, rgba(33, 0, 94, 0.22) 0%, rgba(90, 24, 154, 0.13) 100%)",
      "--color-border-primary": "rgba(255, 255, 255, 0.10)",
      "--color-shadow-primary": "rgba(0, 0, 0, 0.1)",
      "--color-shadow-accent": "rgba(162, 89, 255, 0.2)",

      // Enhanced fallback colors for animations
      "--vibrant-color": "#ff6b6b",
      "--vibrant-color-rgb": "255, 107, 107",
      "--muted-color": "#4ecdc4",
      "--muted-color-rgb": "78, 205, 196",
      "--glow-color": "#ffeaa7",
      "--glow-color-rgb": "255, 234, 167",
      "--animation-primary": "rgba(162, 89, 255, 0.8)",
      "--animation-secondary": "rgba(247, 37, 133, 0.6)",
      "--hover-glow": "0 0 20px rgba(255, 107, 107, 0.4)",

      // Additional colors for UI states
      "--color-error": "#ff006e",
      "--color-error-rgb": "255, 0, 110",
      "--color-success": "#00d4aa",
      "--color-success-rgb": "0, 212, 170",

      "color-scheme": "dark",
    };
    this._setThemeProperties(fallbackProperties);
  }

  async applyTheme() {
    try {
      const rawPalette = await this.extractPalette();
      const distinctPalette = this._filterDistinctColors(
        rawPalette,
        this.threshold
      );

      let finalPalette;
      if (distinctPalette.length >= this.numColors) {
        finalPalette = distinctPalette.slice(0, this.numColors);
      } else {
        const baseColors =
          distinctPalette.length > 0 ? distinctPalette : rawPalette;
        const sorted = this.sortPaletteByBrightness(baseColors);
        const darkest = sorted[0];
        const lightest = sorted[sorted.length - 1];
        finalPalette = this._generateGradientPalette(
          darkest,
          lightest,
          this.numColors
        );
      }

      this.updateTheme(finalPalette);
      return finalPalette;
    } catch (error) {
      console.error("Errore durante l'applicazione del tema:", error);
      this.applyFallbackTheme();
      throw error;
    }
  }
}