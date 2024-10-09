const githubuser = "anto426";
let TextColor ="rgb(0,0,0)";

document.addEventListener("DOMContentLoaded", function () {
    let fild = document.getElementById("anto-About-fild");
    textWrriter("I'm a high school student who likes programming 💻✨", fild);
});


//  Function for simulate a text writer
function textWrriter(text, element) {
    if (text.length > 0) {
        let caracther = text.split("");
        for (let i = 0; i < caracther.length; i++) {
            setTimeout(() => {
                element.innerHTML += `${caracther[i]}`;
            }, 60 * i);
        }
    } else {
        console.log("Text is empty");
    }
}



// Function for loadpage
function Load() {
    fetchinfo().then((data) => {
        ExtractPalet(data.logo).then((palette) => {
            filterPalet(palette).then((palette) => {
                UpdateGradient(palette);
            }).catch((error) => {
                console.error(error);
            });
        }).catch((error) => {
            console.error(error);
        });
    }).catch((error) => {
        console.error(error);
    });
}



// Function for fetch the github user info
function fetchinfo() {
    return new Promise((resolve, reject) => {
        fetch("https://api.github.com/users/" + githubuser)
            .then(response => response.json())
            .then(data => {
                let logo = document.getElementById("anto-logo");
                let username = document.getElementById("anto-username");
                let tag = document.getElementById("anto-tag");
                username.innerHTML = data.name;
                tag.innerHTML = data.login;
                logo.src = data.avatar_url;
                resolve({ logo: logo, username: username, tag: tag });
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    })
}



// Funzione for update the gradient
function UpdateGradient(palette) {
    const paletteColors = palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    const gradient = `linear-gradient(to right, ${paletteColors.join(', ')})`;
    console.log("TexColor " + ArrayToRgb(TextColor));
    document.body.style.color = ArrayToRgb( TextColor);
    document.body.style.background = gradient;

}



// Function for extract the palette
function ExtractPalet(imageElement) {
    return new Promise((resolve) => {
        let Numcolor = 2;
        const colorThief = new ColorThief();
        if (imageElement.complete) {
            const palette = colorThief.getPalette(imageElement, Numcolor);
            resolve(palette);
        } else {
            imageElement.addEventListener('load', function () {
                const palette = colorThief.getPalette(imageElement, Numcolor);
                resolve(palette);
            });
        }
    });
}



// Function for optimize the palette
function filterPalet(colors, threshold = 50) {

    return new Promise((resolve, reject) => {
        const filtered = [];

        for (let i = 0; i < colors.length; i++) {
            let addColor = true;
            for (let j = 0; j < filtered.length; j++) {
                if (colorDistance(colors[i], filtered[j]) < threshold) {
                    addColor = false;
                    break;
                }
            }
            if (addColor) {
                filtered.push(colors[i]);
            }
        }
        if (filtered.length === 0) {
            reject("No colors left after filtering");
        } else {
            TextColor = colors[0];
            resolve(SortPalet(filtered));
        }

        resolve(filtered);
    })

}

// Function for optimize the palette
function SortPalet(palette) {

    return new Promise((resolve) => {
    palette.sort((a, b) => {
        const hslA = rgbToHsl(a[0], a[1], a[2]);
        const hslB = rgbToHsl(b[0], b[1], b[2]);
        return hslA[0] - hslB[0];
    });

    resolve(palette);
})

}


function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; 
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h, s, l]; 
}



function colorDistance(color1, color2) {
    let difRgb = diffColor(color1, color2);
    return Math.sqrt(Math.pow(difRgb[0], 2) + Math.pow(difRgb[1], 2) + Math.pow(difRgb[2], 2));
}


function diffColor(color,color2) {

        const rDiff = color[0] - color2[0];
        const gDiff = color[1] - color2[1];
        const bDiff = color[2] - color2[2];
        return [rDiff, gDiff, bDiff];
}

function ArrayToRgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

function getOppositeColor(color) {
    
    return `rgb(${255 - color[0]}, ${255 - color[1]}, ${255 - color[2]})`

}