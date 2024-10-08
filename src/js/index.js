const githubuser = "anto426";
let primaryColor = "";

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
        EtractPalet(data.logo).then((palette) => {
            filterPalet(palette).then((palette) => {
                updateGradient(palette);
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
function updateGradient(palette) {
    const paletteColors = palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    console.log(paletteColors);
    const gradient = `linear-gradient(to right, ${paletteColors.join(', ')})`;
    document.body.style.background = gradient;
}


// Function for extract the palette
function EtractPalet(imageElement) {
    return new Promise((resolve, reject) => {
        const colorThief = new ColorThief();
        console.log(imageElement.complete);
        if (imageElement.complete) {
            const palette = colorThief.getPalette(imageElement, 5);
            resolve(palette);
        } else {
            reject("Image not loaded");
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
        }else{
            console.log(filtered);
            resolve(filtered);
        }
    
        resolve(filtered);
    })

}

function colorDistance(color1, color2) {
    const rDiff = color1[0] - color2[0];
    const gDiff = color1[1] - color2[1];
    const bDiff = color1[2] - color2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}