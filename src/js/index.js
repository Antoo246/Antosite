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
            }, 60);
        }
    } else {
        console.log("Text is empty");
    }
}