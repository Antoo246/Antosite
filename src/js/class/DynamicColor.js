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
            throw new Error('No image has been set');
        }

        const colorThief = new ColorThief();

        if (this.img.complete) {
            return colorThief.getPalette(this.img, this.numColors);
        }

        return new Promise((resolve, reject) => {
            this.img.addEventListener('load', () => {
                if (this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
                    resolve(colorThief.getPalette(this.img, this.numColors));
                } else {
                    reject(new Error('Image failed to load properly'));
                }
            });

            this.img.addEventListener('error', () => {
                reject(new Error('Error loading image'));
            });
        });
    }

    async filterPalette(palette) {
        if (!Array.isArray(palette) || palette.length === 0) {
            throw new Error('Invalid palette provided');
        }

        const sortedPalette = this.sortPalette(palette);

        if (!this.requiredFilter) {
            return sortedPalette;
        }

        const filtered = sortedPalette.reduce((acc, color, index, arr) => {
            if (index === 0 ||
                this.colorFunctions.colorDistance(arr[index - 1], color) > this.threshold) {
                acc.push(color);
            }
            return acc;
        }, []);

        if (filtered.length === 0) {
            throw new Error('No colors left after filtering');
        }

        return filtered;
    }

    sortPalette(palette) {
        return [...palette].sort((a, b) =>
            this.colorFunctions.colorDistance([0, 0, 0], a) -
            this.colorFunctions.colorDistance([0, 0, 0], b)
        );
    }

    calculateTextColor(palette) {
        if (!Array.isArray(palette)) {
            throw new TypeError('Palette must be an array');
        }
        if (palette.length === 0) {
            throw new Error('Palette cannot be empty');
        }
        if (!palette.every(color => Array.isArray(color) && color.length === 3)) {
            throw new TypeError('Each color in palette must be an RGB array of 3 values');
        }

        try {
            const averageColor = this.colorFunctions.averageColor(palette);
            const oppositeColor = this.colorFunctions.getOppositeColor(averageColor);
            
            const [h, s, l] = this.colorFunctions.rgbToHsl(...oppositeColor);
            
            const adjustedColor = this.colorFunctions.hslToRgb(
                h,
                s,
                this.adjustLightness(l)
            );

            return new Uint8ClampedArray(adjustedColor);
        } catch (error) {
            console.error('Error calculating text color:', error);
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
        const textColor = this.calculateTextColor(palette);
        const paletteColors = palette.map(color =>
            `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        );

        document.documentElement.style.setProperty(
            '--default-item-color',
            this.colorFunctions.arrayToRgb(textColor)
        );

        document.documentElement.style.setProperty(
            '--accent-color',
            paletteColors[length - 1]
        );

        document.documentElement.style.setProperty(
            '--secondary-color',
            paletteColors[1]
        );

        document.documentElement.style.setProperty(
            '--primary-color',
            paletteColors[2]
        );

        document.documentElement.style.setProperty(
            '--dark-overlay',
            paletteColors[0]

        );

        document.documentElement.style.setProperty(
            '--highlight-color',
            paletteColors[0]
        );

        document.documentElement.style.setProperty(
            '--default-bg-gradient',
            `linear-gradient(to right, ${paletteColors.join(', ')})`
        );

        document.documentElement.style.setProperty(
            '--text-color',
            this.colorFunctions.arrayToRgb(textColor)
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
            console.error('Error applying theme:', error);
            throw error;
        }
    }
}
