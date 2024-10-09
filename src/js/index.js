// import other modules
const DynamicColorIn = new DynamicColor();
const FetchDataIn = new FetchData();



// Variables
const githubusername = "anto426";
const AntoAboutFild = "I'm a high school student who likes programming 💻✨"


document.addEventListener("DOMContentLoaded", function () {
    let fild = document.getElementById("anto-About-fild");
    textWrriter(AntoAboutFild, fild);
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
    FetchDataIn.fetchGithubData(githubusername).then(data => {
        let logo = document.getElementById("anto-logo");
        let username = document.getElementById("anto-username");
        let tag = document.getElementById("anto-tag");
        logo.src = data.avatar_url;
        username.innerHTML = data.name;
        tag.innerHTML = data.login;
        DynamicColorIn.setImg(logo);
        DynamicColorIn.applyTheme();

    }).catch(error => {
        console.error(error);
    });
}









