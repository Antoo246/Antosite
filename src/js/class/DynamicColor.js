class DynamicColor {
  constructor(options = {}) {
    this.img = null;
    this.threshold = options.threshold || 7;
    this.numColors = options.numColors || 5;
    this.requiredFilter = options.requiredFilter ?? true;
    this.colorFunctions = new ColorFunctions();
  }

  setConfig({ img, threshold, numColors } = {}) {
    if (img) this.img = img;
    if (threshold) this.threshold = threshold;
    if (numColors) this.numColors = numColors;
  }

  async extractPalette() {
    if (!this.img) {
      throw new Error("No image has been set");
    }

    const colorThief = new ColorThief();

    if (this.img.complete) {
      return colorThief.getPalette(this.img, this.numColors);
    }

    return new Promise((resolve, reject) => {
      this.img.addEventListener("load", () => {
        if (this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
          resolve(colorThief.getPalette(this.img, this.numColors));
        } else {
          reject(new Error("Image failed to load properly"));
        }
      });

      this.img.addEventListener("error", () => {
        reject(new Error("Error loading image"));
      });
    });
  }

  async filterPalette(palette) {
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error("Invalid palette provided");
    }

    const sortedPalette = this.sortPalette(palette);

    if (!this.requiredFilter) {
      return sortedPalette;
    }

    const filtered = sortedPalette.reduce((acc, color, index, arr) => {
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
      throw new Error("No colors left after filtering");
    }

    return filtered;
  }

  sortPalette(palette) {
    return [...palette].sort(
      (a, b) =>
        this.colorFunctions.colorDistance([0, 0, 0], a) -
        this.colorFunctions.colorDistance([0, 0, 0], b)
    );
  }

  calculateTextColor(palette) {
    if (!Array.isArray(palette)) {
      throw new TypeError("Palette must be an array");
    }
    if (palette.length === 0) {
      throw new Error("Palette cannot be empty");
    }
    if (!palette.every((color) => Array.isArray(color) && color.length === 3)) {
      throw new TypeError(
        "Each color in palette must be an RGB array of 3 values"
      );
    }

    try {
      const avgBrightness = this.colorFunctions.averageBrightness(palette);
      if (avgBrightness > 128) {
        return [0, 0, 0];
      } else {
        return [255, 255, 255];
      }
    } catch (error) {
      console.error("Error calculating text color:", error);
      return this.colorFunctions.averageBrightness(palette) > 128
        ? [0, 0, 0]
        : [255, 255, 255];
    }
  }

  adjustLightness(l) {
    if (l > 0.7) return Math.max(0, l - 0.3);
    if (l < 0.3) return Math.min(1, l + 0.3);
    return l > 0.5 ? Math.max(0, l - 0.2) : Math.min(1, l + 0.2);
  }

  async updateGradient(palette) {
    if (!palette || palette.length === 0) {
      console.error("UpdateGradient called with empty or invalid palette. Cannot apply theme.");
      // Optionally, set all CSS variables to default safe values here
      return;
    }

    const textColor = this.calculateTextColor(palette); // Expected: [r, g, b]
    const textColorRgbString = this.colorFunctions.arrayToRgb(textColor); // Expected: "rgb(r,g,b)"
    const textColorRgbValues = textColor.join(", "); // Expected: "r, g, b"

    document.documentElement.style.setProperty("--text-color", textColorRgbString);
    document.documentElement.style.setProperty("--text-color-rgb", textColorRgbValues);
    document.documentElement.style.setProperty("--text-color-secondary", `rgba(${textColorRgbValues}, 0.75)`);
    document.documentElement.style.setProperty("--default-item-color", textColorRgbString);

    // Helper to get a color array [r,g,b] from palette by index.
    // Falls back to palette[0] if index is out of bounds, or to black if palette is empty (though checked above).
    const _getColorArray = (index, fallbackColor = [0, 0, 0]) => {
      return palette[index] || palette[0] || fallbackColor;
    };
    
    const numPaletteColors = palette.length;

    // Define base RGB arrays for theme colors.
    // Palette is sorted from darkest (index 0) to brightest.
    const colorForDarkOverlayArray = _getColorArray(0);
    const colorForSecondaryArray = numPaletteColors > 1 ? _getColorArray(1) : colorForDarkOverlayArray;
    const colorForPrimaryArray = numPaletteColors > 2 ? _getColorArray(2) : colorForSecondaryArray;
    const colorForAccentArray = numPaletteColors > 0 ? _getColorArray(numPaletteColors - 1) : colorForPrimaryArray; // Brightest or last available

    // Set --primary-color and --primary-color-rgb
    document.documentElement.style.setProperty("--primary-color", this.colorFunctions.arrayToRgb(colorForPrimaryArray));
    document.documentElement.style.setProperty("--primary-color-rgb", colorForPrimaryArray.join(", "));

    // Set --secondary-color and --secondary-color-rgb
    document.documentElement.style.setProperty("--secondary-color", this.colorFunctions.arrayToRgb(colorForSecondaryArray));
    document.documentElement.style.setProperty("--secondary-color-rgb", colorForSecondaryArray.join(", "));

    // Set --accent-color and --accent-color-rgb
    document.documentElement.style.setProperty("--accent-color", this.colorFunctions.arrayToRgb(colorForAccentArray));
    document.documentElement.style.setProperty("--accent-color-rgb", colorForAccentArray.join(", "));

    // Set --dark-overlay (using the darkest color from palette with specified alpha)
    document.documentElement.style.setProperty("--dark-overlay", `rgba(${colorForDarkOverlayArray.join(", ")}, 0.25)`);
    
    // Set --highlight-color (using the darkest color as a solid color, similar to original logic)
    document.documentElement.style.setProperty("--highlight-color", this.colorFunctions.arrayToRgb(colorForDarkOverlayArray));

    // Set --default-bg-gradient using all colors from the palette
    const paletteRgbStrings = palette.map(color => `rgb(${color.join(", ")})`);
    document.documentElement.style.setProperty(
      "--default-bg-gradient",
      `linear-gradient(to right, ${paletteRgbStrings.join(", ")})`
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
      console.error("Error applying theme:", error);
      throw error;
    }
  }
}
