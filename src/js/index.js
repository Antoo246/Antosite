const rootStyles = getComputedStyle(document.documentElement);

const layoutroot = document.getElementById('layoutroot');


document.addEventListener("DOMContentLoaded", function () {
    changertextinterval("I'm a high school student who like Information and Communications Technology 💻✨", 'aboutmefild');
});


function changetext(text, campo) {
    for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
            campo.innerHTML += text[i];
        }, 50 * i);
    }
    setTimeout(() => {
        campo.innerHTML = "";
    }, 6000);
}

function changertextinterval(text, idtext) {
    let campo = document.getElementById(idtext);
    changetext(text, campo);
    setInterval(() => {
        changetext(text, campo);
    }, 6000);
}








const rootStyles = getComputedStyle(document.documentElement);

const layoutroot = document.getElementById('layoutroot');


document.addEventListener("DOMContentLoaded", function () {
    let textchenger = new Textchenger()
    textchenger.changertextinterval("I'm a high school student who likes Information and Communications Technology 💻✨", 'aboutfild')
});


/*
class Textchenger {

    constructor() {
        this.timesinglechar = 4
    }

    changetext(text, campo) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < text.length; i++) {
                await setTimeout(() => {
                    campo.innerHTML += text[i];
                }, this.timesinglechar)
            }
            resolve(0)
        })
    }

    changertextinterval(text, idtext) {
        let campo = document.getElementById(idtext);
        this.changetext(text, campo)
            .then(() => {
                console.log(idtext)

            })

    }

}

*/
