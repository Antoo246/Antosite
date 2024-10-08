const githubuser = "anto426";   

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



function fetchinfo() {
    fetch("https://api.github.com/users/" + githubuser)
        .then(response => response.json())
        .then(data => {
            let logo = document.getElementById("anto-logo");
            let username = document.getElementById("anto-username");
            let tag = document.getElementById("anto-tag");
            username.innerHTML = data.login;
            tag.innerHTML = data.login;
            logo.src = data.avatar_url;
        });

}