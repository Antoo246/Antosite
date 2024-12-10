// import other modules
const DynamicColorIn = new DynamicColor();
const FetchDataIn = new FetchData();
const Textd = new TextClass();

// Variables
const githubusername = "anto426";
const AntoAboutFild = "I'm a high school student who likes programming 💻✨"
const defaultimeout =  1000;

// Function 

// Function for show site
function showSite(loader, prymarybox, textFild) {
    console.log("Site is ready");
    setTimeout(() => {
        loader.classList.remove("show");
        loader.classList.add("hide");
        prymarybox.classList.remove("hide");
        prymarybox.classList.add("show");
        Textd.textWrriter(AntoAboutFild, textFild);
    }, defaultimeout);
}


// Function for error page
function seeErrorPage(loader, errmessagebox, errmessage, textmessage = "An error occurred while loading the page") {
    setTimeout(() => {
        loader.classList.remove("show");
        loader.classList.add("hide");
        errmessagebox.classList.remove("hide");
        errmessagebox.classList.add("show");
        errmessage.innerHTML = textmessage;
    }, defaultimeout
);

}

// Function for loadpage
function loadPage() {
    let mainContainer = document.getElementById("home");
    let errorContainer = document.getElementById("error");
    let errorMessageElement = document.getElementById("message-error");
    let aboutMeElement = document.getElementById("aboutme");
    let loadingElement = document.getElementById("loading");
    let githubLinkElement = document.getElementById("github");
    let twitterLinkElement = document.getElementById("twitter");
    
    Textd.setlenText(aboutMeElement, AntoAboutFild);
    FetchDataIn.fetchGithubData(githubusername).then(async githubData => {
        let profileImageElement = document.getElementById("logo");
        let nameElement = document.getElementById("username");
        let usernameElement = document.getElementById("tag");
        profileImageElement.src = githubData.avatar_url;
        nameElement.innerHTML = githubData.name;
        usernameElement.innerHTML = githubData.login;
        githubLinkElement.href = githubData.html_url;
        githubData.twitter_username ? 
            twitterLinkElement.href = `https://twitter.com/${githubData.twitter_username}` : 
            twitterLinkElement.style.display = "none";
        DynamicColorIn.setImg(profileImageElement);
        DynamicColorIn.setNumColors(10);
        DynamicColorIn.applyTheme().then(() => {
            showSite(loadingElement, mainContainer, aboutMeElement);
        }).catch(error => {
            console.error("Color Dynamic error : ", error);
            seeErrorPage(loadingElement, errorContainer, errorMessageElement, error);
        });
    }).catch(error => {
        console.error(error);
        seeErrorPage(loadingElement, errorContainer, errorMessageElement, error);
    });
}
