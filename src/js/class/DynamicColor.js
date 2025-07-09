class DynamicColor {
  constructor(options = {}) {
    this.img = null;
    this.threshold = options.threshold ?? 90;
    this.numColors = options.numColors ?? 5;
    this.requiredFilter = options.requiredFilter ?? true;
    this.colorFunctions = new ColorFunctions();
  }

  setConfig({ img, threshold, numColors } = {}) {
    if (img !== undefined) this.img = img;
    if (threshold !== undefined) this.threshold = threshold;
    if (numColors !== undefined) this.numColors = numColors;
  }

  async extractPalette() {
    if (!this.img) throw new Error("No image has been set");

    const colorThief = new ColorThief();

    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        if (this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
          try {
            const palette = colorThief.getPalette(this.img, this.numColors);
            resolve(palette);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error("Image failed to load properly"));
        }
      };

      if (this.img.complete) {
        handleLoad();
      } else {
        this.img.addEventListener("load", handleLoad, { once: true });
        this.img.addEventListener(
          "error",
          () => reject(new Error("Image failed to load")),
          { once: true }
        );
      }
    });
  }

  interpolateColor(colorA, colorB, ratio = 0.5) {
    if (
      !Array.isArray(colorA) ||
      !Array.isArray(colorB) ||
      colorA.length !== 3 ||
      colorB.length !== 3
    ) {
      throw new Error("Invalid colors provided to interpolateColor");
    }

    const clamp = (v) => Math.min(1, Math.max(0, v));
    ratio = clamp(ratio);

    return [
      Math.round(colorA[0] + (colorB[0] - colorA[0]) * ratio),
      Math.round(colorA[1] + (colorB[1] - colorA[1]) * ratio),
      Math.round(colorA[2] + (colorB[2] - colorA[2]) * ratio),
    ];
  }

  _generateGradientPalette(startColor, endColor, steps) {
    if (!Array.isArray(startColor) || !Array.isArray(endColor) || steps < 1) {
      throw new Error("Invalid input to _generateGradientPalette");
    }

    if (steps === 1) return [startColor.map(Math.round)];
    if (steps === 2)
      return [startColor.map(Math.round), endColor.map(Math.round)];

    const palette = [];
    const intervals = steps - 1;

    for (let i = 0; i <= intervals; i++) {
      const ratio = i / intervals;
      const color = this.interpolateColor(startColor, endColor, ratio);

      // Verifica che il colore sia abbastanza simile al precedente
      if (
        palette.length === 0 ||
        ColorFunctions.colorDistance(palette[palette.length - 1], color) <=
          this.threshold ||
        i === intervals
      ) {
        palette.push(color);
      }
    }

    // Se la palette è troppo corta, riempi con copie del colore finale
    while (palette.length < steps) {
      palette.push(endColor.map(Math.round));
    }

    // Se troppo lunga, riduci equamente
    if (palette.length > steps) {
      const reduced = [];
      const step = (palette.length - 1) / (steps - 1);
      for (let i = 0; i < steps; i++) {
        reduced.push(palette[Math.round(i * step)]);
      }
      return reduced;
    }

    return palette;
  }

  filterPalette(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      console.warn("Invalid or empty palette provided for filtering.");
      throw new Error("Invalid or empty palette provided for filtering");
    }

    const sorted = this.sortPalette(palette);

    if (!this.requiredFilter) {
      console.warn("Filtering disabled, returning sorted palette.");
      return sorted;
    }

    console.warn(`Filtering palette with threshold: ${this.threshold}`);
    const filtered = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = filtered[filtered.length - 1];
      const current = sorted[i];
      const distance = this.colorFunctions.colorDistance(prev, current);

      if (distance < this.threshold) {
        console.warn(
          `Distance ${distance.toFixed(2)} < threshold, keeping color.`
        );
        filtered.push(current);
      } else {
        console.warn(
          `Distance ${distance.toFixed(2)} >= threshold, interpolating...`
        );
        const mid = this.interpolateColor(prev, current);
        filtered.push(mid);
      }
    }

    if (filtered.length < this.numColors) {
      console.warn(
        `Filtered palette has ${filtered.length} colors, generating gradient to fill up to ${this.numColors} colors.`
      );
      const needed = this.numColors - filtered.length;
      const fill = this._generateGradientPalette(
        filtered[0],
        filtered[filtered.length - 1],
        needed + 2
      ).slice(1, -1);
      return [...filtered, ...fill.slice(0, needed)];
    }

    if (filtered.length > this.numColors) {
      const reduced = [];
      const step = (filtered.length - 1) / (this.numColors - 1);
      for (let i = 0; i < this.numColors; i++) {
        reduced.push(filtered[Math.round(i * step)]);
      }
      console.debug(`Reduced palette to ${this.numColors} colors.`);
      return reduced;
    }

    return filtered;
  }

  sortPalette(palette) {
    return palette.slice().sort((a, b) => {
      const brightnessA = this.colorFunctions.getBrightness(a);
      const brightnessB = this.colorFunctions.getBrightness(b);
      return brightnessA - brightnessB;
    });
  }

  _generateGradientPalette(startColor, endColor, steps) {
    if (steps <= 1) {
      return [startColor];
    }
    const palette = [startColor];
    const stepCount = steps - 1;

    for (let i = 1; i < stepCount; i++) {
      const ratio = i / stepCount;
      const r = Math.round(
        startColor[0] + (endColor[0] - startColor[0]) * ratio
      );
      const g = Math.round(
        startColor[1] + (endColor[1] - startColor[1]) * ratio
      );
      const b = Math.round(
        startColor[2] + (endColor[2] - startColor[2]) * ratio
      );
      palette.push([r, g, b]);
    }
    palette.push(endColor);
    return palette;
  }

  calculateTextColor(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error("Palette must be a non-empty array of RGB colors");
    }

    const valid = palette.every(
      (color) => Array.isArray(color) && color.length === 3
    );
    if (!valid) {
      throw new TypeError(
        "Each color in the palette must be an RGB array of 3 values"
      );
    }

    const avgBrightness = this.colorFunctions.averageBrightness(palette);
    return avgBrightness > 128 ? [0, 0, 0] : [255, 255, 255];
  }

  adjustLightness(l) {
    if (l > 0.7) return Math.max(0, l - 0.3);
    if (l < 0.3) return Math.min(1, l + 0.3);
    return l > 0.5 ? Math.max(0, l - 0.2) : Math.min(1, l + 0.2);
  }

  async updateGradient(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      console.warn(
        "updateGradient: palette is empty. Applying fallback styles."
      );
      this.applyFallbackCss();
      return;
    }

    const textColor = this.calculateTextColor(palette);
    const textRgb = textColor.join(", ");
    const textString = this.colorFunctions.arrayToRgb(textColor);

    const root = document.documentElement;

    root.style.setProperty("--text-color", textString);
    root.style.setProperty("--text-color-rgb", textRgb);
    root.style.setProperty("--text-color-secondary", `rgba(${textRgb}, 0.75)`);
    root.style.setProperty("--default-item-color", textString);

    const getColor = (index, fallback = [0, 0, 0]) =>
      palette[index] || palette[0] || fallback;

    const colorDark = getColor(0);
    const colorSecondary = getColor(1, colorDark);
    const colorPrimary = getColor(2, colorSecondary);
    const colorAccent = getColor(palette.length - 1, colorPrimary);

    root.style.setProperty(
      "--primary-color",
      this.colorFunctions.arrayToRgb(colorPrimary)
    );
    root.style.setProperty("--primary-color-rgb", colorPrimary.join(", "));
    root.style.setProperty(
      "--secondary-color",
      this.colorFunctions.arrayToRgb(colorSecondary)
    );
    root.style.setProperty("--secondary-color-rgb", colorSecondary.join(", "));
    root.style.setProperty(
      "--accent-color",
      this.colorFunctions.arrayToRgb(colorAccent)
    );
    root.style.setProperty("--accent-color-rgb", colorAccent.join(", "));
    root.style.setProperty(
      "--dark-overlay",
      `rgba(${colorDark.join(", ")}, 0.25)`
    );
    root.style.setProperty(
      "--highlight-color",
      this.colorFunctions.arrayToRgb(colorDark)
    );

    const gradient = palette
      .map((color) => `rgb(${color.join(", ")})`)
      .join(", ");
    root.style.setProperty(
      "--default-bg-gradient",
      `linear-gradient(to right, ${gradient})`
    );
  }

  applyFallbackCss() {
    const root = document.documentElement;
    root.style.setProperty("--text-color", "#ffffff");
    root.style.setProperty("--text-color-rgb", "255, 255, 255");
    root.style.setProperty(
      "--text-color-secondary",
      "rgba(255, 255, 255, 0.75)"
    );
    root.style.setProperty("--default-item-color", "#ffffff");
    root.style.setProperty("--primary-color", "#222");
    root.style.setProperty("--secondary-color", "#444");
    root.style.setProperty("--accent-color", "#888");
    root.style.setProperty("--highlight-color", "#111");
    root.style.setProperty(
      "--default-bg-gradient",
      "linear-gradient(to right, #000, #111, #222)"
    );
  }

  async applyTheme() {
    try {
      const palette = await this.extractPalette();
      const filteredPalette = await this.filterPalette(palette);
      await this.updateGradient(filteredPalette);
      return filteredPalette;
    } catch (error) {
      console.error("applyTheme error:", error);
      this.applyFallbackCss();
      throw error;
    }
  }
}
