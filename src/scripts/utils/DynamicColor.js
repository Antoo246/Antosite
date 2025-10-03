
import { ColorFunctions } from './ColorFunctions.js';

export class DynamicColor {
  constructor(options = {}) {
    this.img = null;
    this.threshold = options.threshold ?? 40;
    this.numColors = options.numColors ?? 5;
    this.colorFunctions = new ColorFunctions();
    this.colorThief = new ColorThief();
    this.transitionDuration = options.transitionDuration ?? 800;
    this.useSmoothing = options.useSmoothing ?? true;
  }

  setConfig({ img, threshold, numColors, transitionDuration } = {}) {
    if (img instanceof HTMLImageElement) this.img = img;
    if (threshold !== undefined) this.threshold = threshold;
    if (numColors !== undefined) this.numColors = numColors;
    if (transitionDuration !== undefined) this.transitionDuration = transitionDuration;
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

    // Add CSS transition variables for smooth color changes
    const cssTransitions = `
      background-color var(--theme-transition-duration, 0.8s) cubic-bezier(0.4, 0, 0.2, 1),
      color var(--theme-transition-duration, 0.8s) cubic-bezier(0.4, 0, 0.2, 1),
      border-color var(--theme-transition-duration, 0.8s) cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow var(--theme-transition-duration, 0.8s) cubic-bezier(0.4, 0, 0.2, 1)
    `;

    // Set transition duration
    root.style.setProperty('--theme-transition-duration', `${this.transitionDuration}ms`);

    // Apply properties with smooth interpolation
    requestAnimationFrame(() => {
      for (const [key, value] of Object.entries(properties)) {
        root.style.setProperty(key, value);
      }
      
      // Dispatch custom event for theme change
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: { properties, timestamp: Date.now() }
      }));
    });

    // Reset transition duration after animation
    if (this.useSmoothing) {
      setTimeout(() => {
        root.style.setProperty('--theme-transition-duration', '0.3s');
      }, this.transitionDuration);
    }
  }

  _createThemeProperties(palette) {
    const sortedPalette = this.sortPaletteByBrightness(palette);
    const darkest = sortedPalette[0];
    const lightest = sortedPalette[sortedPalette.length - 1];
    const midTone = sortedPalette[Math.floor(sortedPalette.length / 2)];

    // Text Color with enhanced contrast
    const textColor = this.calculateTextColor(sortedPalette);
    const textRgb = textColor.join(", ");

    // Enhanced role-based colors with better color theory
    const primary = this.colorFunctions.averageColor(sortedPalette).map(Math.round);
    const secondary = sortedPalette.length > 1 ? sortedPalette[1] : darkest;
    
    // Find most saturated color for accent
    const accent = [...palette].sort((a, b) => {
      const satA = this.colorFunctions.rgbToHsl(...a)[1];
      const satB = this.colorFunctions.rgbToHsl(...b)[1];
      return satB - satA;
    })[0];

    // Generate complementary accent color
    const accentHsl = this.colorFunctions.rgbToHsl(...accent);
    const complementaryAccent = this.colorFunctions.hslToRgb(
      (accentHsl[0] + 0.5) % 1, // Complementary hue
      Math.min(accentHsl[1] * 1.2, 1), // Boost saturation
      accentHsl[2]
    ).map(Math.round);

    const primaryRgb = primary.join(", ");
    const secondaryRgb = secondary.join(", ");
    const accentRgb = accent.join(", ");
    const accent2Rgb = complementaryAccent.join(", ");

    const avgBrightness = this.colorFunctions.averageBrightness(sortedPalette);
    const isDark = avgBrightness < 128;

    // Generate triadic color scheme for richer palette
    const triadicColors = this._generateTriadicColors(accent);
    
    // Enhanced vibrant and muted variations
    const vibrantColor = this.colorFunctions.adjustSaturation(accent, 1.3);
    const mutedColor = this.colorFunctions.adjustSaturation(accent, 0.4);
    const glowColor = this.colorFunctions.adjustLightness(vibrantColor, isDark ? 0.75 : 0.65);

    // Generate gradient variations
    const gradientStart = this.interpolateColor(primary, accent, 0.2);
    const gradientMid = this.interpolateColor(primary, accent, 0.5);
    const gradientEnd = this.interpolateColor(primary, complementaryAccent, 0.8);

    return {
      // Base colors with RGB variants
      "--color-primary": `rgb(${primaryRgb})`,
      "--color-primary-rgb": primaryRgb,
      "--color-secondary": `rgb(${secondaryRgb})`,
      "--color-secondary-rgb": secondaryRgb,
      "--color-accent": `rgb(${accentRgb})`,
      "--color-accent-rgb": accentRgb,
      "--color-accent-2": `rgb(${accent2Rgb})`,
      "--color-accent-2-rgb": accent2Rgb,
      
      // Text colors with improved contrast
      "--color-text-primary": `rgb(${textRgb})`,
      "--color-text-primary-rgb": textRgb,
      "--color-text-secondary": `rgba(${textRgb}, 0.82)`,
      "--color-text-tertiary": `rgba(${textRgb}, 0.65)`,
      "--color-text-inverse": isDark ? "rgb(20, 20, 20)" : "rgb(250, 250, 250)",
      
      // Background colors
      "--color-bg-primary": this.colorFunctions.arrayToRgb(darkest),
      "--color-bg-secondary": this.colorFunctions.arrayToRgb(secondary),
      "--color-bg-tertiary": this.colorFunctions.arrayToRgb(midTone),
      
      // Surface colors with glassmorphism
      "--color-surface-primary": `rgba(${primaryRgb}, ${isDark ? 0.15 : 0.25})`,
      "--color-surface-secondary": `rgba(${secondaryRgb}, ${isDark ? 0.12 : 0.18})`,
      "--color-surface-tertiary": `rgba(${accentRgb}, ${isDark ? 0.08 : 0.12})`,
      "--color-surface-glass": `linear-gradient(135deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${secondaryRgb}, 0.08) 50%, rgba(${accentRgb}, 0.03) 100%)`,
      
      // Border colors
      "--color-border-primary": `rgba(${lightest.join(", ")}, ${isDark ? 0.2 : 0.3})`,
      "--color-border-secondary": `rgba(${lightest.join(", ")}, ${isDark ? 0.12 : 0.18})`,
      "--color-border-subtle": `rgba(${lightest.join(", ")}, ${isDark ? 0.08 : 0.12})`,
      
      // Shadow colors
      "--color-shadow-primary": `rgba(0, 0, 0, ${isDark ? 0.3 : 0.15})`,
      "--color-shadow-accent": `rgba(${accentRgb}, 0.25)`,
      "--color-shadow-glow": `rgba(${vibrantColor.join(", ")}, 0.35)`,

      // Animation and interaction colors
      "--vibrant-color": `rgb(${vibrantColor.join(", ")})`,
      "--vibrant-color-rgb": vibrantColor.join(", "),
      "--muted-color": `rgb(${mutedColor.join(", ")})`,
      "--muted-color-rgb": mutedColor.join(", "),
      "--glow-color": `rgb(${glowColor.join(", ")})`,
      "--glow-color-rgb": glowColor.join(", "),
      "--animation-primary": `rgba(${accentRgb}, 0.8)`,
      "--animation-secondary": `rgba(${vibrantColor.join(", ")}, 0.6)`,
      "--hover-glow": `0 0 20px rgba(${vibrantColor.join(", ")}, 0.4)`,
      
      // Triadic colors for advanced animations
      "--triadic-1": `rgb(${triadicColors[0].join(", ")})`,
      "--triadic-1-rgb": triadicColors[0].join(", "),
      "--triadic-2": `rgb(${triadicColors[1].join(", ")})`,
      "--triadic-2-rgb": triadicColors[1].join(", "),

      // Gradient colors
      "--gradient-primary": `linear-gradient(135deg, rgb(${primaryRgb}) 0%, rgb(${accentRgb}) 100%)`,
      "--gradient-secondary": `linear-gradient(135deg, rgb(${secondaryRgb}) 0%, rgb(${accent2Rgb}) 100%)`,
      "--gradient-vibrant": `linear-gradient(135deg, rgb(${gradientStart.join(", ")}) 0%, rgb(${gradientMid.join(", ")}) 50%, rgb(${gradientEnd.join(", ")}) 100%)`,
      "--gradient-surface": `linear-gradient(135deg, rgba(${primaryRgb}, 0.2) 0%, rgba(${accentRgb}, 0.1) 100%)`,

      // UI state colors (using color theory)
      "--color-error": `rgb(${this.colorFunctions.adjustHue(vibrantColor, 0.05).join(", ")})`,
      "--color-error-rgb": this.colorFunctions.adjustHue(vibrantColor, 0.05).join(", "),
      "--color-success": `rgb(${this.colorFunctions.adjustHue(accent, 0.3).join(", ")})`,
      "--color-success-rgb": this.colorFunctions.adjustHue(accent, 0.3).join(", "),
      "--color-warning": `rgb(${this.colorFunctions.adjustHue(accent, 0.15).join(", ")})`,
      "--color-warning-rgb": this.colorFunctions.adjustHue(accent, 0.15).join(", "),
      "--color-info": `rgb(${this.colorFunctions.adjustHue(accent, 0.6).join(", ")})`,
      "--color-info-rgb": this.colorFunctions.adjustHue(accent, 0.6).join(", "),

      "color-scheme": isDark ? "dark" : "light",
    };
  }

  // Generate triadic color harmony (120° apart on color wheel)
  _generateTriadicColors(baseColor) {
    const [h, s, l] = this.colorFunctions.rgbToHsl(...baseColor);
    return [
      this.colorFunctions.hslToRgb((h + 0.333) % 1, s, l).map(Math.round),
      this.colorFunctions.hslToRgb((h + 0.666) % 1, s, l).map(Math.round)
    ];
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