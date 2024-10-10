// import other modules
const DynamicColorIn = new DynamicColor();
const FetchDataIn = new FetchData();
const Textd = new TextClass();




// Variables
const githubusername = "anto426";
const AntoAboutFild = "I'm a high school student who likes programming 💻✨"

function showSite(loader, prymarybox, textFild) {
    console.log("Site is ready");
    setTimeout(() => {
        loader.style.display = "none";
        prymarybox.classList.add("fade-in");
        prymarybox.style.display = "flex";
        Textd.textWrriter(AntoAboutFild, textFild);
    }, 1000);
}


function seeErrorPage(loader, errmessagebox) {
    loader.style.display = "none";
    errmessagebox.classList.add("fade-in");
    errmessagebox.style.display = "flex";

}

// Function for loadpage
function Load() {
    let prymarybox = document.getElementById("anto-prymarybox");
    let errmessagebox = document.getElementById("anto-message-error");
    let textFild = document.getElementById("anto-About-fild");
    let loader = document.getElementById("anto-loader");
    Textd.setlenText(textFild, AntoAboutFild);

    FetchDataIn.fetchGithubData(githubusername).then(async data => {
        let logo = document.getElementById("anto-logo");
        let username = document.getElementById("anto-username");
        let tag = document.getElementById("anto-tag");
        logo.src = data.avatar_url;
        username.innerHTML = data.name;
        tag.innerHTML = data.login;
        DynamicColorIn.setImg(logo);
        DynamicColorIn.applyTheme().then(() => {
            showSite(loader, prymarybox, textFild);
        }).catch(error => {
            console.error("Color Dynamic error : ", error);
            seeErrorPage(loader, errmessagebox);
        });
    }).catch(error => {
        console.error(error);
        seeErrorPage(loader, errmessagebox);
    });
}









