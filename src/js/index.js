// import other modules
const DynamicColorIn = new DynamicColor();
const FetchDataIn = new FetchData();
const Textd = new TextClass();




// Variables
const githubusername = "anto426";
const AntoAboutFild = "I'm a high school student who likes programming 💻✨"


// Function for loadpage
function Load() {
    let textFild = document.getElementById("anto-About-fild");
    Textd.setLarghezzaTesto(textFild, AntoAboutFild);

    FetchDataIn.fetchGithubData(githubusername).then(data => {
        let logo = document.getElementById("anto-logo");
        let username = document.getElementById("anto-username");
        let tag = document.getElementById("anto-tag");
        logo.src = data.avatar_url;
        username.innerHTML = data.name;
        tag.innerHTML = data.login;
        DynamicColorIn.setImg(logo);
        DynamicColorIn.applyTheme();
        Textd.textWrriter(AntoAboutFild, textFild);

    }).catch(error => {
        console.error(error);
    });
}









