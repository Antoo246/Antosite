// Constants
const CONFIG = {
  GITHUB_USERNAME: "anto426",
  ABOUT_TEXT:
    "I'm a passionate software developer and high school student 💻✨",
  TIMEOUT_MS: 5000,
  languageIcons: {
    javascript: '<i class="bi bi-filetype-js"></i> ',
    typescript: '<i class="bi bi-filetype-ts"></i> ',
    python: '<i class="bi bi-file-earmark-code"></i> ',
    java: '<i class="bi bi-filetype-java"></i> ',
    kotlin: '<i class="bi bi-file-code"></i> ',
    swift: '<i class="bi bi-lightning-charge"></i> ',
    html: '<i class="bi bi-filetype-html"></i> ',
    css: '<i class="bi bi-filetype-css"></i> ',
    scss: '<i class="bi bi-filetype-css"></i> ',
    sass: '<i class="bi bi-filetype-css"></i> ',
    less: '<i class="bi bi-filetype-css"></i> ',
    c: '<i class="bi bi-filetype-c"></i> ',
    "c++": '<i class="bi bi-filetype-cpp"></i> ',
    "c#": '<i class="bi bi-filetype-cs"></i> ',
    ruby: '<i class="bi bi-gem"></i> ',
    php: '<i class="bi bi-filetype-php"></i> ',
    go: '<i class="bi bi-file-code"></i> ',
    rust: '<i class="bi bi-gear-wide-connected"></i> ',
    dart: '<i class="bi bi-filetype-dart"></i> ',
    lua: '<i class="bi bi-moon-stars"></i> ',
    r: '<i class="bi bi-graph-up"></i> ',
    perl: '<i class="bi bi-file-code"></i> ',
    shell: '<i class="bi bi-terminal"></i> ',
    bash: '<i class="bi bi-terminal"></i> ',
    powershell: '<i class="bi bi-terminal"></i> ',
    sql: '<i class="bi bi-database"></i> ',
    graphql: '<i class="bi bi-diagram-2"></i> ',
    json: '<i class="bi bi-braces"></i> ',
    yaml: '<i class="bi bi-file-earmark-text"></i> ',
    xml: '<i class="bi bi-filetype-xml"></i> ',
    markdown: '<i class="bi bi-markdown"></i> ',
    latex: '<i class="bi bi-file-earmark-text"></i> ',
    asm: '<i class="bi bi-cpu"></i> ',
    vb: '<i class="bi bi-file-code"></i> ',
    pascal: '<i class="bi bi-file-code"></i> ',
    julia: '<i class="bi bi-file-code"></i> ',
    haskell: '<i class="bi bi-layers-half"></i> ',
    clojure: '<i class="bi bi-braces"></i> ',
    lisp: '<i class="bi bi-braces"></i> ',
    fortran: '<i class="bi bi-file-code"></i> ',
    cobol: '<i class="bi bi-file-code"></i> ',
    raku: '<i class="bi bi-file-code"></i> ',
    matlab: '<i class="bi bi-graph-up"></i> ',
    octave: '<i class="bi bi-graph-up"></i> ',
  },
  skills: [
    { name: "JavaScript", icon: '<i class="bi bi-filetype-js"></i>' },
    { name: "C", icon: '<i class="bi bi-filetype-c"></i>' },
    { name: "C++", icon: '<i class="bi bi-filetype-cpp"></i>' },
    { name: "Java", icon: '<i class="bi bi-cup-hot"></i>' },
    { name: "Kotlin", icon: '<i class="bi bi-code-square"></i>' },
    { name: "Python", icon: '<i class="bi bi-filetype-py"></i>' },
    { name: "HTML", icon: '<i class="bi bi-filetype-html"></i>' },
    { name: "CSS", icon: '<i class="bi bi-filetype-css"></i>' },
    { name: "SQL", icon: '<i class="bi bi-database"></i>' },
    { name: "Discord.js", icon: '<i class="bi bi-discord"></i>' },
    { name: "Node.js", icon: '<i class="bi bi-box"></i>' },
    { name: "Docker", icon: '<i class="bi bi-box-seam"></i>' },
    { name: "Bootstrap", icon: '<i class="bi bi-bootstrap"></i>' },
    { name: "Visual Studio Code", icon: '<i class="bi bi-code-square"></i>' },
    { name: "Blender", icon: '<i class="bi bi-box"></i>' },
    { name: "Git", icon: '<i class="bi bi-git"></i>' },
    { name: "Android", icon: '<i class="bi bi-android"></i>' },
    { name: "Magisk", icon: '<i class="bi bi-shield-lock"></i>' },
    { name: "Android Studio", icon: '<i class="bi bi-android2"></i>' },
    { name: "Windows", icon: '<i class="bi bi-windows"></i>' },
    { name: "Arch Linux", icon: '<i class="bi bi-terminal"></i>' },
  ],
};

// DOM Elements class for better organization
class DOMElements {
  constructor() {
    this.main = document.getElementById("home");
    this.error = document.getElementById("error");
    this.errorMessage = document.getElementById("message-error");
    this.aboutMe = document.getElementById("aboutme");
    this.loading = document.getElementById("loading");
    this.github = document.getElementById("github");
    this.twitter = document.getElementById("twitter");
    this.logo = document.getElementById("logo");
    this.name = document.getElementById("username");
    this.username = document.getElementById("tag");
    console.log("DOMElements initialized", this);
  }
}

// UI Controller class
class UIController {
  static showSite(elements) {
    console.log("UIController.showSite called");
    setTimeout(() => {
      elements.loading.classList.replace("show", "hide");
      elements.main.classList.replace("hide", "show");
      new TextClass().textWriter(CONFIG.ABOUT_TEXT, elements.aboutMe);
      console.log("Site shown");
    }, CONFIG.TIMEOUT_MS);
  }

  static showError(
    elements,
    message = "An error occurred while loading the page"
  ) {
    console.log("UIController.showError called");
    setTimeout(() => {
      elements.loading.classList.replace("show", "hide");
      elements.error.classList.replace("hide", "show");
      elements.errorMessage.innerHTML = message;
      console.log("Error shown with message:", message);
    }, CONFIG.TIMEOUT_MS);
  }
}

// Main app class
class App {
  constructor() {
    this.elements = new DOMElements();
    this.dynamicColor = new DynamicColor();
    this.fetchData = new FetchData();
    console.log("App initialized");
  }

  async updateUserInterface(data) {
    console.log("App.updateUserInterface called with data:", data);

    // Update user information
    this.elements.name.innerHTML = data.name;
    this.elements.username.innerHTML = data.login;
    this.elements.logo.src = data.avatar_url;

    // Handle skills
    const skillsContainer = document.getElementById("skills-container");
    CONFIG.skills.forEach((skill) => {
      const skillElement = document.createElement("div");
      skillElement.className = "skill";
      skillElement.innerHTML = skill.icon + " " + skill.name;
      skillsContainer.appendChild(skillElement);
    });

    // Social media extraction
    const extractSocialFromBio = (bio, platform) => {
      const regexes = {
        linkedin: /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i,
        instagram: /instagram\.com\/([a-zA-Z0-9_.-]+)/i,
      };
      const match = bio && bio.match(regexes[platform]);
      return match ? match[1] : null;
    };

    console.log("Extracted social media from bio");

    // Update social links
    let socialContainer = document.getElementById("social-container");

    const socialLinks = {
      twitter: {
        element: this.elements.twitter,
        username: data.twitter_username,
        baseUrl: "https://twitter.com/",
        icon: "bi-twitter-x",
        text: "Twitter ",
      },
      github: {
        element: this.elements.github,
        username: data.login,
        baseUrl: "https://github.com/",
        icon: "bi-github",
        text: "GitHub ",
      },
      instagram: {
        element: this.elements.instagram,
        username: extractSocialFromBio(data.bio, "instagram"),
        baseUrl: "https://instagram.com/",
        icon: "bi-instagram",
        text: "Instagram ",
      },
      linkedin: {
        element: this.elements.linkedin,
        username: extractSocialFromBio(data.bio, "linkedin"),
        baseUrl: "https://linkedin.com/in/",
        icon: "bi-linkedin",
        text: "LinkedIn ",
      },
      blog: {
        element: this.elements.blog,
        username: data.blog && data.blog.startsWith("http") ? data.blog : null,
        baseUrl: "",
        icon: "bi-link-45deg",
        text: "Blog ",
      },
    };

    Object.entries(socialLinks).forEach(([platform, info]) => {
      if (
        info.username &&
        window.location.href !== info.baseUrl + info.username
      ) {
        const link = document.createElement("a");
        link.classList.add("link");
        link.href = info.baseUrl + info.username;
        link.target = "_blank";
        link.title = info.text;
        const icon = document.createElement("i");
        icon.className = "bi " + info.icon;
        const text = document.createTextNode(" " + info.text);
        link.appendChild(icon);
        link.appendChild(text);
        link.appendChild(icon);
        socialContainer.appendChild(link);
      }
    });

    if (socialContainer.children >= 3) {
      socialContainer.classList.add("four-columns");
    } else {
      socialContainer.classList.remove("four-columns");
    }

    // Handle GitHub Repos
    const repoCarousel = document.getElementById("projects-container");

    const progetTitle = document.getElementById("projects");
    progetTitle.innerHTML = "Projects (" + data.repo.length + ")";

    if (!data.repo || data.repo.length === 0) {
      repoCarousel.classList.remove("carousel");
      repoCarousel.classList.add("itemcenter");
      repoCarousel.innerHTML =
        '<div class="item">🚫 No projects available</div>';
      return;
    }

    const filteredRepos = data.repo.sort(
      (a, b) => b.stargazers_count - a.stargazers_count
    );

    repoCarousel.innerHTML = "";

    filteredRepos.forEach((repo) => {
      const projectElement = document.createElement("div");
      projectElement.className = "project";

      const projectTitle = document.createElement("h5");
      projectTitle.textContent = repo.name || "Unnamed Project";

      const projectDesc = document.createElement("p");
      projectDesc.textContent = repo.description
        ? `📄 ${repo.description}`
        : "No description available";

      const statsContainer = document.createElement("div");
      statsContainer.className = "stats-container";

      if (repo.language) {
        const language = document.createElement("span");
        let languageIcon = "";

        languageIcon =
          CONFIG.languageIcons[repo.language.toLowerCase()] ||
          '<i class="bi bi-file-earmark"></i> ';

        language.innerHTML = `${languageIcon}${repo.language}`;
        statsContainer.appendChild(language);
      }

      const stars = document.createElement("span");
      stars.innerHTML = `<i class="bi bi-star"></i> ${repo.stargazers_count}`;
      statsContainer.appendChild(stars);

      if (repo.fork) {
        const forkedIndicator = document.createElement("span");
        forkedIndicator.className = "forked-indicator";
        forkedIndicator.title = "Forked Repository";
        forkedIndicator.innerHTML = '<i class="bi bi-code-slash"></i> forked';
        statsContainer.appendChild(forkedIndicator);
      } else {
        const forks = document.createElement("span");
        forks.innerHTML = `<i class="bi bi-diagram-2"></i> ${repo.forks_count}`;
        statsContainer.appendChild(forks);
      }

      const repoLink = document.createElement("a");
      repoLink.href = repo.html_url;
      repoLink.target = "_blank";
      repoLink.textContent = "View";
      repoLink.className = "link small"; 

      projectElement.appendChild(projectTitle);
      projectElement.appendChild(projectDesc);
      projectElement.appendChild(statsContainer);
      projectElement.appendChild(repoLink);

      repoCarousel.appendChild(projectElement);
    });

    if (filteredRepos.length > 4) {
      const items = repoCarousel.innerHTML;
      repoCarousel.innerHTML = items + items;
    }

    console.log("User interface updated");
  }

  async applyTheme() {
    console.log("App.applyTheme called");
    this.dynamicColor.setConfig({ img: this.elements.logo, numColors: 5 });

    try {
      console.log("Applying theme...");
      const palette = await this.dynamicColor.applyTheme();
      console.log("Theme applied successfully", palette);
      new Background("backgroundCanvas", palette);
      UIController.showSite(this.elements);
    } catch (error) {
      console.error("Failed to apply theme:", error);
      this.handleError(error);
    }
  }

  handleError(error) {
    console.log("App.handleError called with error:", error);
    new Background("backgroundCanvas", null);
    console.error("Error:", error);
    UIController.showError(this.elements);
  }

  async init() {
    console.log("App.init called");
    try {
      const data = await this.fetchData.fetchGithubData(CONFIG.GITHUB_USERNAME);
      data.repo = await this.fetchData.fetchGithubData(
        CONFIG.GITHUB_USERNAME + "/repos"
      );

      console.log("Data fetched successfully", data);
      await this.updateUserInterface(data);
      await this.applyTheme();
      document.addEventListener("DOMContentLoaded", function () {
        const carousels = document.querySelectorAll(".carousel");

        carousels.forEach((carousel) => {
          const originalItems = carousel.innerHTML;
          carousel.innerHTML = originalItems + originalItems;

          const itemWidth = carousel.scrollWidth / 2;
          carousel.style.setProperty("--carousel-width", itemWidth + "px");
        });
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}

function loadPage() {
  console.log("loadPage called");
  const app = new App();
  app.init();
}
