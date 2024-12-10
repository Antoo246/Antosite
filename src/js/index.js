// Constants
const CONFIG = {
    GITHUB_USERNAME: 'anto426',
    ABOUT_TEXT: "I'm a passionate software developer and high school student 💻✨",
    TIMEOUT_MS: 5000,
};

// DOM Elements class for better organization
class DOMElements {
    constructor() {
        this.main = document.getElementById('home');
        this.error = document.getElementById('error');
        this.errorMessage = document.getElementById('message-error');
        this.aboutMe = document.getElementById('aboutme');
        this.loading = document.getElementById('loading');
        this.github = document.getElementById('github');
        this.twitter = document.getElementById('twitter');
        this.logo = document.getElementById('logo');
        this.name = document.getElementById('username');
        this.username = document.getElementById('tag');
        console.log('DOMElements initialized', this);
    }
}

// UI Controller class
class UIController {
    static showSite(elements) {
        console.log('UIController.showSite called');
        setTimeout(() => {
            elements.loading.classList.replace('show', 'hide');
            elements.main.classList.replace('hide', 'show');
            new TextClass().textWriter(CONFIG.ABOUT_TEXT, elements.aboutMe);
            console.log('Site shown');
        }, CONFIG.TIMEOUT_MS);
    }

    static showError(elements, message = 'An error occurred while loading the page') {
        console.log('UIController.showError called');
        setTimeout(() => {
            elements.loading.classList.replace('show', 'hide');
            elements.error.classList.replace('hide', 'show');
            elements.errorMessage.innerHTML = message;
            console.log('Error shown with message:', message);
        }, CONFIG.TIMEOUT_MS);
    }
}

// Main app class
class App {
    constructor() {
        this.elements = new DOMElements();
        this.dynamicColor = new DynamicColor();
        this.fetchData = new FetchData();
        console.log('App initialized');
    }

    async updateUserInterface(data) {
        console.log('App.updateUserInterface called with data:', data);
        this.elements.name.innerHTML = data.name;
        this.elements.username.innerHTML = data.login;
        this.elements.github.href = data.html_url;

        if (data.twitter_username) {
            this.elements.twitter.href = `https://twitter.com/${data.twitter_username}`;
        } else {
            this.elements.twitter.style.display = 'none';
        }

        this.elements.logo.src = data.avatar_url;
        console.log('User interface updated');
    }

    async applyTheme() {
        console.log('App.applyTheme called');
        this.dynamicColor.setConfig({ img: this.elements.logo, numColors: 5 });

        try {
            console.log('Applying theme...');
            const palette = await this.dynamicColor.applyTheme();
            console.log('Theme applied successfully', palette);
            new Background('backgroundCanvas', palette);
            UIController.showSite(this.elements);
        } catch (error) {
            console.error('Failed to apply theme:', error);
            this.handleError(error);
        }
    }

    handleError(error) {
        console.log('App.handleError called with error:', error);
        new Background('backgroundCanvas', null);
        console.error('Error:', error);
        UIController.showError(this.elements);
    }

    async init() {
        console.log('App.init called');
        try {
            const data = await this.fetchData.fetchGithubData(CONFIG.GITHUB_USERNAME);
            console.log('Data fetched successfully', data);
            await this.updateUserInterface(data);
            await this.applyTheme();
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Initialize the application
function loadPage() {
    console.log('loadPage called');
    const app = new App();
    app.init();
}
