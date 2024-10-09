class DynamicColor {


    constructor() {
        this.textcolor = [0, 0, 0];
        this.Palette = [];
        this.Img;
        this.threshold = 50;
        this.ColorFunctions = new ColorFunctions();
    }

    ExtractPalet() {
        return new Promise((resolve) => {
            let Numcolor = 2;
            const colorThief = new ColorThief();
            if (this.Img.complete) {
                this.Palette = colorThief.getPalette(this.Img, Numcolor);
                resolve(0);
            } else {
                this.Img.addEventListener('load', function () {
                    this.Palette = colorThief.getPalette(this.Img, Numcolor);
                    resolve(0);
                });
            }
        });
    }

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
                this.textcolor = filtered[0];
                this.SortPalet(filtered);
                resolve(0);
            }
        })

    }

    

    UpdateGradient() {
        console.log( this.Palette);
        const paletteColors = this.Palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        const gradient = `linear-gradient(to right, ${paletteColors.join(', ')})`;
        document.body.style.color = this.ColorFunctions.ArrayToRgb(this.textcolor);
        document.body.style.background = gradient;

    }

    // Function for optimize the palette
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