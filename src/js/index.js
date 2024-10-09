const githubuser = "anto426";
let TextColor ="rgb(0,0,0)";

const DynamicColorIn= new DynamicColor();
const FetchDataIn = new FetchData();

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
    FetchDataIn.fetchGithubData(githubuser).then(data => {
        let logo = document.getElementById("anto-logo");
        let username = document.getElementById("anto-username");
        let tag = document.getElementById("anto-tag");
        logo.src = data.data.avatar_url;
        username.innerHTML = data.data.name;
        tag.innerHTML = data.data.login;
        DynamicColorIn.setImg(logo);
        DynamicColorIn.applyTheme();
        
        
    }).catch(error => {
        console.error(error);
    });
}









