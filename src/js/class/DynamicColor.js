class DynamicColor {
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
    for (const [key, value] of Object.entries(properties)) {
      root.style.setProperty(key, value);
    }
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

    return {
      "--primary-color": `rgb(${primaryRgb})`,
      "--primary-color-rgb": primaryRgb,
      "--secondary-color": `rgb(${secondaryRgb})`,
      "--secondary-color-rgb": secondaryRgb,
      "--accent-color": `rgb(${accentRgb})`,
      "--accent-color-rgb": accentRgb,
      "--accent-color-2": `rgb(${accentRgb})`,
      "--accent-color-2-rgb": accentRgb,
      "--text-color": `rgb(${textRgb})`,
      "--text-color-rgb": textRgb,
      "--text-color-secondary": `rgba(${textRgb}, 0.82)`,
      "--dark-overlay": `rgba(${darkest.join(", ")}, 0.22)`,
      "--bg-gradient-start": this.colorFunctions.arrayToRgb(darkest),
      "--bg-gradient-end": this.colorFunctions.arrayToRgb(secondary),
      "--glass-bg": `linear-gradient(120deg, rgba(${primaryRgb}, 0.22) 0%, rgba(${secondaryRgb}, 0.13) 100%)`,
      "--glass-border": `rgba(${lightest.join(", ")}, 0.10)`,
      "--glass-shadow": `0 10px 36px 0 rgba(0,0,0,0.22), 0 1.5px 6px 0 rgba(${accentRgb}, 0.08)`,
      "--shadow-md": `0 10px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(${accentRgb}, 0.13)`,
      "--shadow-lg": `0 18px 48px rgba(0,0,0,0.25), 0 6px 18px rgba(${accentRgb}, 0.18)`,
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
      "--primary-color": "#21005e",
      "--primary-color-rgb": "33, 0, 94",
      "--secondary-color": "#5a189a",
      "--secondary-color-rgb": "90, 24, 154",
      "--accent-color": "#a259ff",
      "--accent-color-rgb": "162, 89, 255",
      "--accent-color-2": "#f72585",
      "--accent-color-2-rgb": "247, 37, 133",
      "--text-color": "#f8f8ff",
      "--text-color-rgb": "248, 248, 255",
      "--text-color-secondary": "rgba(248, 248, 255, 0.82)",
      "--dark-overlay": "rgba(20, 0, 40, 0.22)",
      "--bg-gradient-start": "#1a0036",
      "--bg-gradient-end": "#2d006e",
      "--glass-bg":
        "linear-gradient(120deg, rgba(33, 0, 94, 0.22) 0%, rgba(90, 24, 154, 0.13) 100%)",
      "--glass-border": "rgba(255, 255, 255, 0.10)",
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
