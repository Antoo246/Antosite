
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
    if (!this.img) return Promise.reject(new Error("Nessuna immagine impostata."));

    return new Promise((resolve, reject) => {
      const processImage = () => {
        if (this.img.naturalWidth === 0) {
          return reject(new Error("L'immagine non è riuscita a caricarsi correttamente (dimensioni 0)."));
        }
        try {
          const palette = this.colorThief.getPalette(this.img, this.numColors + 5);
          resolve(palette);
        } catch (err) {
          reject(err);
        }
      };

      if (this.img.complete) {
        processImage();
      } else {
        this.img.addEventListener("load", processImage, { once: true });
        this.img.addEventListener("error", () => reject(new Error("Errore durante il caricamento dell'immagine.")), { once: true });
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
        (keptColor) => this.colorFunctions.colorDistance(current, keptColor) >= minDistance
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
      (a, b) => this.colorFunctions.getBrightness(a) - this.colorFunctions.getBrightness(b)
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

  updateTheme(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      this.applyFallbackTheme();
      return;
    }

    const root = document.documentElement;
    const sortedPalette = this.sortPaletteByBrightness(palette);
    const textColor = this.calculateTextColor(sortedPalette);
    const textRgb = textColor.join(", ");

    root.style.setProperty("--text-color", `rgb(${textRgb})`);
    root.style.setProperty("--text-color-rgb", textRgb);
    root.style.setProperty("--text-color-secondary", `rgba(${textRgb}, 0.75)`);

    const colorDark = sortedPalette[0];
    const colorSecondary = sortedPalette[1] || colorDark;
    const colorPrimary = sortedPalette[2] || colorSecondary;
    const colorAccent = sortedPalette[sortedPalette.length - 1] || colorPrimary;
    
    root.style.setProperty("--primary-color", this.colorFunctions.arrayToRgb(colorPrimary));
    root.style.setProperty("--secondary-color", this.colorFunctions.arrayToRgb(colorSecondary));
    root.style.setProperty("--accent-color", this.colorFunctions.arrayToRgb(colorAccent));
    root.style.setProperty("--highlight-color", this.colorFunctions.arrayToRgb(colorDark));
    root.style.setProperty("--dark-overlay", `rgba(${colorDark.join(", ")}, 0.25)`);

    const gradient = sortedPalette
      .map((color) => `rgb(${color.join(", ")})`)
      .join(", ");
    root.style.setProperty("--default-bg-gradient", `linear-gradient(to right, ${gradient})`);
  }
  
  applyFallbackTheme() {
    const root = document.documentElement;
    root.style.setProperty("--text-color", "#ffffff");
    root.style.setProperty("--text-color-rgb", "255, 255, 255");
    root.style.setProperty("--text-color-secondary", "rgba(255, 255, 255, 0.75)");
    root.style.setProperty("--primary-color", "#222222");
    root.style.setProperty("--secondary-color", "#444444");
    root.style.setProperty("--accent-color", "#888888");
    root.style.setProperty("--highlight-color", "#111111");
    root.style.setProperty("--default-bg-gradient", "linear-gradient(to right, #000, #111, #222)");
  }
  
  async applyTheme() {
    try {
      const rawPalette = await this.extractPalette();
      const distinctPalette = this._filterDistinctColors(rawPalette, this.threshold);
      
      let finalPalette;
      if (distinctPalette.length >= this.numColors) {
        finalPalette = distinctPalette.slice(0, this.numColors);
      } else {
        const baseColors = distinctPalette.length > 0 ? distinctPalette : rawPalette;
        const sorted = this.sortPaletteByBrightness(baseColors);
        const darkest = sorted[0];
        const lightest = sorted[sorted.length - 1];
        finalPalette = this._generateGradientPalette(darkest, lightest, this.numColors);
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