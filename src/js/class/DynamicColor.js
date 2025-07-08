class DynamicColor {
  constructor(options = {}) {
    this.img = null;
    this.threshold = options.threshold ?? 7;
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

  async filterPalette(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error("Invalid palette provided");
    }

    const sortedPalette = this.sortPalette(palette);

    if (sortedPalette.length < this.numColors) {
      console.warn(
        `Filtered palette has only ${sortedPalette.length} colors. Generating a new gradient.`
      );
      const darkest = sortedPalette[0];
      const lightest = sortedPalette[sortedPalette.length - 1];
      const newPalette = [darkest];
      const steps = this.numColors - 1;

      for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const r = Math.round(darkest[0] + (lightest[0] - darkest[0]) * ratio);
        const g = Math.round(darkest[1] + (lightest[1] - darkest[1]) * ratio);
        const b = Math.round(darkest[2] + (lightest[2] - darkest[2]) * ratio);
        newPalette.push([r, g, b]);
      }

      newPalette.push(lightest);
      return newPalette;
    }

    if (!this.requiredFilter) return sortedPalette;

    let filtered = sortedPalette.reduce((acc, color, index, arr) => {
      if (
        index === 0 ||
        this.colorFunctions.colorDistance(arr[index - 1], color) >
          this.threshold
      ) {
        acc.push(color);
      }
      return acc;
    }, []);

    if (filtered.length === 0) {
      console.warn("All colors filtered out. Using first available color.");
      return [sortedPalette[0]];
    }

    return filtered;
  }

  sortPalette(palette) {
    return [...palette].sort((a, b) => {
      const brightnessA = this.colorFunctions.getBrightness(a);
      const brightnessB = this.colorFunctions.getBrightness(b);
      const brightnessDiff = brightnessA - brightnessB;

      if (Math.abs(brightnessDiff) > 10) {
        return brightnessDiff;
      }

      const hueA = this.colorFunctions.getHue(a);
      const hueB = this.colorFunctions.getHue(b);
      return hueA - hueB;
    });
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
      this.requiredFilter = palette.length >= 3;
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
