class DynamicColor {
    constructor() {
        this.Img = null;
        this.threshold = 70;
        this.numColors = 5;
        this.ColorFunctions = new ColorFunctions();
    }

    setImg(img) {
        this.Img = img;
    }

    setThreshold(threshold) {
        this.threshold = threshold;
    }

    setNumColors(numColors) {
        this.numColors = numColors;
    }

    // Function to extract the palette
    extractPalette() {
        return new Promise((resolve, reject) => {
            const colorThief = new ColorThief();
            if (this.Img.complete) {
                resolve(colorThief.getPalette(this.Img, this.numColors));
            } else {
                this.Img.addEventListener('load', () => {
                    if (this.Img.naturalWidth > 0 && this.Img.naturalHeight > 0) {
                        console.log("Image loaded successfully");
                        resolve(colorThief.getPalette(this.Img, this.numColors));
                    } else {
                        reject("Image not loaded properly.");
                    }
                });
            }
        });
    }

    // Function to filter the palette
    filterPalette(palette) {
        return new Promise(async (resolve, reject) => {
            try {

                let sort = this.sortPalette(palette);
                let filtered = [...sort];

                for (let i = 0; i < filtered.length; i++) {
                    let j = i + 1;
                    console.log(this.ColorFunctions.colorDistance(sort[i], sort[j]) > this.threshold);
                    if (this.ColorFunctions.colorDistance(sort[i], sort[j]) > this.threshold) {
                        filtered.splice(j, 1);
                        j--;
                    }
                }

                if (filtered.length === 0) {
                    reject("No colors left after filtering");
                } else {
                    console.log("Filtered Palette :", filtered);

                    resolve(filtered);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    sortPalette(palette) {
        let paletteCopy = [...palette];
        let sortp = paletteCopy.sort((a, b) => {
            return this.ColorFunctions.colorDistance([0, 0, 0], a) - this.ColorFunctions.colorDistance([0, 0, 0], b);
        });
        console.log("Original Palette :", palette);
        console.log("Sorted Palette :", sortp);
        return sortp;
    }

    // Function to calculate the text color
    calculateItem(palette) {
        let textColor = this.ColorFunctions.getOppositeColor(this.ColorFunctions.averageColor(palette));
        let hsl = this.ColorFunctions.rgbToHsl(textColor[0], textColor[1], textColor[2]);
        if (hsl[2] > 0.5) {
            textColor = textColor.map(color => Math.max(0, color - 30));
        }
        return textColor;
    }

    // Function to update the gradient and the text color
    updateGradient(palette) {
        return new Promise((resolve, reject) => {
            try {
                let textColor = this.calculateItem(palette);
                console.log("New Palette color :", palette);
                console.log("New Text color", textColor);

                const paletteColors = palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
                document.documentElement.style.setProperty('--default-item-color', this.ColorFunctions.ArrayToRgb(textColor));
                document.documentElement.style.setProperty('--default-bg-gradient', `linear-gradient(to right, ${paletteColors.join(', ')})`);
                resolve(0);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to apply the theme
    applyTheme() {
        return new Promise((resolve, reject) => {
            this.extractPalette().then((palette) => {
                this.filterPalette(palette).then((newPalette) => {
                    this.updateGradient(newPalette).then(() => {
                        resolve(0);
                    }).catch(error => {
                        reject(error);
                    });
                }).catch(error => {
                    reject(error);
                    console.error(error);
                });
            }).catch(error => {
                reject(error);
                console.error(error);
            });
        });
    }
}