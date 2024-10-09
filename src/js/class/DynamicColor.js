class DynamicColor {


    constructor() {
        this.Palette = [];
        this.Img;
        this.threshold = 50;
        this.ColorFunctions = new ColorFunctions();
    }


    // Function for extract the palette
    ExtractPalet() {
        return new Promise((resolve) => {
            let Numcolor = 2;
            const colorThief = new ColorThief();
            if (this.Img.complete) {
                this.Palette = colorThief.getPalette(this.Img, Numcolor);
                resolve(0);
            } else {
                this.Img.addEventListener('load', () => {
                    if (this.Img.naturalWidth > 0 && this.Img.naturalHeight > 0) {
                        console.log("Image loaded successfully");
                        this.Palette = colorThief.getPalette(this.Img, Numcolor);
                        resolve(0);
                    } else {
                        console.error("Image not loaded properly.");
                        reject("Image not loaded properly.");
                    }
                });
            }
        });
    }


    // Function for filter the palette
    FilterPalet() {

        return new Promise( (resolve, reject) => {
            const filtered = [];
    
            for (let i = 0; i < this.Palette.length; i++) {
                let addColor = true;
                for (let j = 0; j < filtered.length; j++) {
                    if (this.ColorFunctions.colorDistance(this.Palette[i], filtered[j]) < this.threshold) {
                        addColor = false;
                        break;
                    }
                }
                if (addColor) {
                    filtered.push(this.Palette[i]);
                }
            }

            if (filtered.length === 0) {
                reject("No colors left after filtering");
            } else {
                this.SortPalet(filtered);
                resolve(0);
            }
        })

    }

    

    // Function for update the gradient and the text color
    UpdateGradient() {
        let textcolor = this.ColorFunctions.getOppositeColor(this.ColorFunctions.averageColor(this.Palette));
        console.log("New Palette color :");
        console.log(this.Palette);
        console.log("New Text color " + textcolor);

        const paletteColors = this.Palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        document.documentElement.style.setProperty('--default-text-color', this.ColorFunctions.ArrayToRgb(textcolor)); 
        document.documentElement.style.setProperty('--default-bg-gradient', `linear-gradient(to right, ${paletteColors.join(', ')})`);

    }

    // Function for sort the palette in base of the tone
    SortPalet() {
        return new Promise((resolve) => {
            this.Palette = this.Palette.sort((a, b) => {
                const hslA = this.ColorFunctions.rgbToHsl(a[0], a[1], a[2]);
                const hslB = this.ColorFunctions.rgbToHsl(b[0], b[1], b[2]);
                return hslA[0] - hslB[0];
            });

            resolve(0);
        })

    }

    setImg(img) {
        this.Img = img;
    }

    setThreshold(threshold) {
        this.threshold = threshold;
    }


    applyTheme() {
        this.ExtractPalet().then(() => {
            this.FilterPalet().then(() => {
                this.UpdateGradient();
            }).catch(error => {
                console.error(error);
            });
        })

    }


}