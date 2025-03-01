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
  static showSite(elements, CONFIG) {
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
    message = "An error occurred while loading the page",
    CONFIG
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
  constructor(CONFIG) {
    this.CONFIG = CONFIG;
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

    this.CONFIG.skills.forEach((skill) => {
      console.log("Adding skill:", skill);

      const skillElement = document.createElement("div");
      skillElement.className = "skill";

      let skillIcon = this.CONFIG.languageIcons.find(
        (icon) => icon.language.toLowerCase() === skill.toLowerCase()
      );

      skillIcon = skillIcon
        ? skillIcon.icon
        : '<i class="bi bi-code-slash"></i>';

      console.log("Skill Icon:", skillIcon);

      skillElement.innerHTML = skillIcon + " " + skill;
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
        icon.className = `bi ${info.icon}`;
        const text = document.createTextNode(" " + info.text);
        link.appendChild(icon);
        link.appendChild(text);

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
    const projectsTitle = document.getElementById("projects");

    // Display number of projects
    projectsTitle.innerHTML = `<i class="bi bi-box"> Projects (${
      data.public_repos || 0
    })</i>  `;

    if (!data.repo || data.repo.length === 0) {
      repoCarousel.classList.remove("carousel");
      repoCarousel.classList.add("itemcenter");
      repoCarousel.innerHTML = `<div class="item">🚫 No projects available</div>`;
      return;
    }

    const filteredRepos = [...data.repo].sort(
      (a, b) => b.stargazers_count - a.stargazers_count
    );

    repoCarousel.innerHTML = "";
    filteredRepos.forEach((repo, index) => {
      const projectElement = document.createElement("div");
      projectElement.classList.add("project");
      projectElement.style.setProperty("--project-index", index); // For staggered animations

      // Interactive hover tracking for glass morphism effect
      projectElement.addEventListener("mousemove", (e) => {
        const rect = projectElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / projectElement.offsetWidth) * 100;
        const y = ((e.clientY - rect.top) / projectElement.offsetHeight) * 100;
        projectElement.style.setProperty("--x", `${x}%`);
        projectElement.style.setProperty("--y", `${y}%`);
      });

      // Create elements with proper structure and classes
      const projectTitle = document.createElement("h5");
      projectTitle.classList.add("project-title");
      projectTitle.innerHTML = `<i class="bi bi-code-square"></i> ${
        repo.name || "Unnamed Project"
      }`;

      const projectDescription = document.createElement("p");
      projectDescription.classList.add("project-description");
      projectDescription.setAttribute(
        "title",
        repo.description || "No description available"
      );

      if (repo.description) {
        projectDescription.innerHTML = `
        <span class="description-icon">
        <i class="bi bi-file-text"></i>
        </span>
        <span class="description-text">${repo.description}</span>
      `;
      } else {
        projectDescription.innerHTML = `
        <span class="description-icon">
        <i class="bi bi-question-circle"></i>
        </span>
        <span class="description-text">No description available</span>
      `;
      }

      // Add elements to the project card with animation delays
      const elements = [projectTitle, projectDescription];
      elements.forEach((el, i) => {
        el.style.setProperty("--child-nr", i + 1); // Animation sequence
        projectElement.appendChild(el);
      });

      const statsContainer = document.createElement("div");
      statsContainer.classList.add("project-stats");
      statsContainer.style.setProperty("--child-nr", elements.length + 1);

      if (repo.language) {
        // Find language icon from CONFIG
        let languageIcon = this.CONFIG.languageIcons.find(
          (icon) => icon.language.toLowerCase() === repo.language.toLowerCase()
        );

        languageIcon = languageIcon
          ? languageIcon.icon
          : '<i class="bi bi-file-earmark-code"></i>';

        statsContainer.innerHTML += `<span>${languageIcon} ${repo.language}</span>`;
      }

      statsContainer.innerHTML += `<span><i class="bi bi-star"></i> ${repo.stargazers_count}</span>`;

      if (repo.fork) {
        statsContainer.innerHTML += `
        <span class="forked-indicator" title="Forked Repository">
        <i class="bi bi-diagram-3"></i> forked
        </span>
      `;
      } else {
        statsContainer.innerHTML += `<span><i class="bi bi-diagram-2"></i> ${repo.forks_count}</span>`;
      }

      // Repository link with enhanced styling
      const repoLink = document.createElement("a");
      repoLink.href = repo.html_url;
      repoLink.target = "_blank";
      repoLink.classList.add("project-link");
      repoLink.innerHTML = `<i class="bi bi-box-arrow-up-right"> View Project</i> `;
      repoLink.style.setProperty("--child-nr", elements.length + 2);

      projectElement.append(statsContainer, repoLink);
      repoCarousel.appendChild(projectElement);

      // Add subtle animation delay for each project card
      projectElement.style.animationDelay = `${index * 0.1}s`;
    });

    // Duplicate items if more than 4 repositories are available for carousel effect
    if (filteredRepos.length > 4) {
      repoCarousel.innerHTML += repoCarousel.innerHTML;
    }

    console.log("User interface updated");
  }

  async applyTheme() {
    console.log("App.applyTheme called");
    this.dynamicColor.setConfig({
      img: this.elements.logo,
      numColors: this.CONFIG.NUM_COLORS,
    });

    try {
      console.log("Applying theme...");
      const palette = await this.dynamicColor.applyTheme();
      console.log("Theme applied successfully", palette);
      new Background("backgroundCanvas", palette);
      UIController.showSite(this.elements, this.CONFIG);
    } catch (error) {
      console.error("Failed to apply theme:", error);
      this.handleError(error);
    }
  }

  handleError(error) {
    console.log("App.handleError called with error:", error);
    new Background("backgroundCanvas", null);
    console.error("Error:", error);
    UIController.showError(this.elements, error.message, this.CONFIG);
  }

  async init() {
    console.log("App.init called");
    try {
      console.log("Fetching data...");
      const data = await this.fetchData.fetchGithubData(
        this.CONFIG.GITHUB_USERNAME
      );
      data.repo = await this.fetchData.fetchGithubData(
        this.CONFIG.GITHUB_USERNAME + "/repos"
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

async function loadPage() {
  // Constants
  console.log("loadPage called");
  const config = await fetch("./src/config/setting.json")
    .then((response) => response.json())
    .catch((error) => {
      console.error("Errore nel caricamento del JSON:", error);
      return {};
    });
  const app = new App(config);
  app.init();
}
