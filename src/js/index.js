class DOMElements {
  constructor() {
    this.main = document.getElementById("home");
    this.error = document.getElementById("error");
    this.errorMessage = document.getElementById("message-error");
    this.aboutMe = document.getElementById("aboutme");
    this.loading = document.getElementById("loading");
    this.logo = document.getElementById("logo");
    this.name = document.getElementById("username");
    this.username = document.getElementById("tag");
    this.skillIconJSON = [];
  }
}

class UIController {
  static showSite(elements, CONFIG) {
    console.log("UIController.showSite called");
    elements.main.classList.replace("hide", "show");
    new TextClass().textWriter(CONFIG.ABOUT_TEXT, elements.aboutMe);
    console.log("Site shown");
  }

  static showError(
    elements,
    message = "An error occurred while loading the page",
    CONFIG
  ) {
    console.log("UIController.showError called");
    elements.loading.classList.replace("show", "hide");
    elements.error.classList.replace("hide", "show");
    elements.errorMessage.innerHTML = message;
    console.log("Error shown with message:", message);
  }
}

// Main app class
class App {
  constructor(CONFIG) {
    this.CONFIG = CONFIG;
    this.elements = new DOMElements();
    this.dynamicColor = new DynamicColor();
    this.fetchData = new FetchData();
    this.loadingController = new LoadingController();
    console.log("App initialized");
  }

  findLanguageIcon(language) {
    console.log("App.findLanguageIcon called with language:", language);
    if (!language || !this.skillIconJSON || !this.skillIconJSON.length) {
      return null;
    }

    const languagelower = language.toLowerCase().replace(/\s+/g, "");

    let icon = this.skillIconJSON.find(
      (icon) => icon.name && icon.name.toLowerCase() === languagelower
    );

    if (!icon) {
      icon = this.skillIconJSON.find(
        (icon) =>
          icon.altnames &&
          icon.altnames.some(
            (altname) => altname.toLowerCase() === languagelower
          )
      );
    }

    if (!icon) {
      icon = this.skillIconJSON.find(
        (icon) =>
          (icon.name && icon.name.toLowerCase().startsWith(languagelower)) ||
          (icon.altnames &&
            icon.altnames.some((altname) =>
              altname.toLowerCase().startsWith(languagelower)
            ))
      );
    }

    if (!icon) {
      console.warn("Trying with tags...");
      icon = this.skillIconJSON.find(
        (icon) => icon.tags && icon.tags.includes(languagelower)
      );
    }

    if (!icon) {
      console.warn(`No icon found for language: ${language}`);
      return '<i class="bi bi-code-slash" title="' + language + '"></i>';
    } else {
      console.log(
        "Icon found for language:",
        language,
        "using icon:",
        icon.name
      );

      let iconVariant = "plain";
      if (icon.versions && icon.versions.font) {
        if (!icon.versions.font.includes("plain")) {
          iconVariant = icon.versions.font[0] || "plain";
        }
      }

      return `<i class="devicon-${icon.name}-${iconVariant}" title="${language}"></i>`;
    }
  }

  async updateUserInterface(data) {
    console.log("App.updateUserInterface called with data:", data);

    this.elements.name.innerHTML = data.name;
    this.elements.username.innerHTML = data.login;
    this.elements.logo.src = data.avatar_url;

    try {
      this.skillIconJSON = await fetch(
        "https://raw.githubusercontent.com/devicons/devicon/master/devicon.json",
        { cache: "force-cache" }
      ).then((response) => response.json());
    } catch (e) {
      console.warn("Devicon JSON fetch failed, using minimal fallback", e);
      this.skillIconJSON = [];
    }

    const skillsContainer = document.getElementById("skills-container");

    this.CONFIG.skills.forEach((skill) => {
      let skillIcon = this.findLanguageIcon(skill.name);
      let skillElement = document.createElement("a");
      skillElement.classList.add("skill", "link");
      skillElement.href = skill.link;
      skillElement.target = "_blank";
      skillElement.innerHTML = skillIcon + skill.name;
      skillsContainer.appendChild(skillElement);
    });

    const extractSocialFromBio = (bio, platform) => {
      const regexes = {
        linkedin: /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i,
        instagram: /instagram\.com\/([a-zA-Z0-9_.-]+)/i,
      };
      const match = bio && bio.match(regexes[platform]);
      return match ? match[1] : null;
    };

    console.log("Extracted social media from bio");

    let socialContainer = document.getElementById("social-container");
    socialContainer.innerHTML = "";

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
        icon: "bi-globe",
        text: "Blog ",
      },
    };

    // Render social media links
    Object.entries(socialLinks).forEach(([platform, info]) => {
      if (
        !info.username ||
        window.location.href === info.baseUrl + info.username
      )
        return;

      const link = document.createElement("a");
      link.classList.add("link");
      link.href = `${info.baseUrl}${info.username}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = info.text;

      const icon = document.createElement("i");
      icon.className = `bi ${info.icon}`;

      link.appendChild(icon);
      link.appendChild(document.createTextNode(` ${info.text}`));
      socialContainer.appendChild(link);
    });

    const repoCarousel = document.getElementById("projects-container");
    const projectsTitle = document.getElementById("projects");

    projectsTitle.innerHTML = `<i class="bi bi-archive-fill"> Projects (${
      data.public_repos || 0
    })</i>`;

    if (!data.repo || data.repo.length === 0) {
      repoCarousel.classList.remove("carousel");
      repoCarousel.classList.add("itemcenter");
      repoCarousel.innerHTML = `<div class="item">🚫 No projects available</div>`;
      return;
    } else if (data.repo.length < 3) {
      repoCarousel.classList.remove("carousel");
    } else {
      const sortedRepos = [...data.repo]
        .filter((r) => !r.archived)
        .sort((a, b) => a.name.localeCompare(b.name));
      repoCarousel.innerHTML = "";

      sortedRepos.forEach((repo, index) => {
        const projectElement = document.createElement("div");
        projectElement.classList.add("project");
        projectElement.style.setProperty("--project-index", index.toString());

        // Throttle mousemove for better perf
        {
          let ticking = false;
          projectElement.addEventListener("mousemove", (e) => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
              const rect = projectElement.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              projectElement.style.setProperty("--x", `${x}%`);
              projectElement.style.setProperty("--y", `${y}%`);
              ticking = false;
            });
          });
        }

        const projectTitleContainer = document.createElement("div");
        projectTitleContainer.classList.add("project-title-container");

        const bookmarkIcon = document.createElement("i");
        bookmarkIcon.className = "project-bookmark";
        projectTitleContainer.appendChild(bookmarkIcon);

        const projectTitle = document.createElement("h5");
        projectTitle.classList.add("project-title");
        const titleText = repo.name
          ? repo.name.charAt(0).toUpperCase() + repo.name.slice(1)
          : "Unnamed Project";
        projectTitle.textContent = titleText;

        const textContainer = document.createElement("div");
        textContainer.classList.add("text-scrolling-container");

        if (titleText.length > 15) {
          console.warn("Long title detected:", titleText);
          projectTitle.classList.add("text-scrolling");
        }

        textContainer.appendChild(projectTitle);
        projectTitleContainer.appendChild(textContainer);

        const projectDescriptionContainer = document.createElement("div");
        projectDescriptionContainer.classList.add(
          "project-description-container"
        );

        const projectDescription = document.createElement("p");
        projectDescription.classList.add("project-description");
        projectDescription.title =
          repo.description || "No description available";
        projectDescription.innerHTML = `
          <span class="description-icon">
            <i class="bi bi-card-text"></i>
          </span>
          <span class="description-text">${
            repo.description || "No description available"
          }</span>`;
        projectDescriptionContainer.appendChild(projectDescription);

        [projectTitleContainer, projectDescriptionContainer].forEach(
          (el, i) => {
            el.style.setProperty("--child-nr", (i + 1).toString());
            projectElement.appendChild(el);
          }
        );

        const statsContainer = document.createElement("div");
        statsContainer.classList.add("project-stats");
        statsContainer.style.setProperty("--child-nr", "3");

        let languageInfo = "";
        if (repo.language) {
          const languageIcon = this.findLanguageIcon(repo.language) || "";
          languageInfo = `<span title="Primary language">${languageIcon} ${repo.language}</span>`;
        } else {
          languageInfo = `<span title="Primary language"><i class="bi bi-code-slash"></i> N/A</span>`;
        }
        statsContainer.innerHTML += languageInfo;

        let repoSize = "0 KB";
        if (repo.size !== undefined && repo.size !== null) {
          repoSize =
            repo.size > 1000
              ? (repo.size / 1000).toFixed(1) + " MB"
              : repo.size + " KB";
        }
        statsContainer.innerHTML += `<span title="Repository size"><i class="bi bi-database"></i> ${repoSize}</span>`;

        let stars =
          repo.stargazers_count !== undefined && repo.stargazers_count !== null
            ? repo.stargazers_count
            : "0";
        const formattedStars =
          stars >= 1000 ? (stars / 1000).toFixed(1) + "k" : stars;
        statsContainer.innerHTML += `<span title="Stars"><i class="bi bi-star-fill"></i> ${formattedStars}</span>`;

        let forksCount =
          repo.forks_count !== undefined && repo.forks_count !== null
            ? repo.forks_count
            : "0";
        const formattedForks =
          forksCount >= 1000
            ? (forksCount / 1000).toFixed(1) + "k"
            : forksCount;
        statsContainer.innerHTML += `<span title="Forks"><i class="bi bi-git"></i> ${formattedForks}</span>`;

        if (repo.fork) {
          statsContainer.innerHTML += `<span title="Forked"><i class="bi bi-sign-turn-right-fill"></i> Forked</span>`;
        } else {
          statsContainer.innerHTML += `<span title="Original"><i class="bi bi-gem"></i> Original</span>`;
        }

        let timeAgo = "N/A";
        if (repo.updated_at) {
          const updateDate = new Date(repo.updated_at);
          timeAgo = getTimeAgo(updateDate);
        }
        statsContainer.innerHTML += `<span title="Last updated"><i class="bi bi-clock-history"></i> ${timeAgo}</span>`;

        function getTimeAgo(date) {
          const diffDays = Math.floor(
            (Date.now() - date) / (1000 * 60 * 60 * 24)
          );
          if (diffDays < 1) return "today";
          if (diffDays < 2) return "yesterday";
          if (diffDays < 7) return `${diffDays}d ago`;
          if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
          if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
          return `${Math.floor(diffDays / 365)}y ago`;
        }

        const repoLink = document.createElement("a");
        repoLink.href = repo.html_url;
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer";
        repoLink.classList.add("project-link", "link");
        repoLink.innerHTML = `<i class="bi bi-box-arrow-up-right"></i> View Project`;
        repoLink.style.setProperty("--child-nr", "4");

        projectElement.append(statsContainer, repoLink);
        repoCarousel.appendChild(projectElement);

        projectElement.style.animationDelay = `${index * 0.1}s`;
      });

      console.log("User interface updated");
    }
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
    
    // Update loading controller to show error
    if (this.loadingController) {
      this.loadingController.setText("Error occurred");
      this.loadingController.forceComplete();
    }
    
    new Background("backgroundCanvas", null);
    console.error("Error:", error);
    UIController.showError(this.elements, error.message, this.CONFIG);
  }

  async init() {
    console.log("App.init called");
    
    // Initialize and start loading controller
    this.loadingController.init();
    this.loadingController.setText("App.init called");
    this.loadingController.setProgress(10);
    
    try {
      console.log("Fetching GitHub data...");
      this.loadingController.setText("Fetching GitHub data...");
      this.loadingController.setProgress(25);
      
      const data = await this.fetchData.fetchGithubData(
        this.CONFIG.GITHUB_USERNAME
      );
      
      console.log("Loading repositories...");
      this.loadingController.setText("Loading repositories...");
      this.loadingController.setProgress(50);
      
      data.repo = await this.fetchData.fetchGithubData(
        this.CONFIG.GITHUB_USERNAME + "/repos"
      );

      console.log("Data fetched successfully");
      this.loadingController.setText("Data fetched successfully");
      this.loadingController.setProgress(70);
      
      console.log("Processing user data...");
      this.loadingController.setText("Processing user data...");
      this.loadingController.setProgress(85);
      
      await this.updateUserInterface(data);
      
      console.log("Applying theme...");
      this.loadingController.setText("Applying theme...");
      this.loadingController.setProgress(95);
      
      await this.applyTheme();
      
      console.log("Loading complete!");
      this.loadingController.setText("Loading complete!");
      
      // Complete loading
      this.loadingController.onDataLoaded();
      
    } catch (error) {
      this.handleError(error);
    }
  }
}

async function loadPage() {
  console.log("loadPage called");
  
  try {
    const config = await fetch("./src/config/setting.json")
      .then((response) => response.json())
      .catch((error) => {
        console.error("Errore nel caricamento del JSON:", error);
        return {};
      });
    
    const app = new App(config);
    await app.init();
    
  } catch (error) {
    console.error("Error in loadPage:", error);
    
    // Fallback loading completion if something goes wrong
    const fallbackLoader = new LoadingController();
    fallbackLoader.setText("Error loading");
    fallbackLoader.forceComplete();
  }
}
