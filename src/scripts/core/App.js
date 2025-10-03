/**
 * Main Application Class
 * Handles the overall application lifecycle and coordination
 */

import { DOMElements } from './DOMElements.js';
import { UIController } from './UIController.js';
import { LoadingController } from '../components/LoadingController.js';
import { DynamicColor } from '../utils/DynamicColor.js';
import { FetchData } from '../utils/FetchData.js';
import { Background } from '../components/Background.js';
import { AnimationController } from '../utils/AnimationController.js';

export class App {
  constructor(CONFIG) {
    this.CONFIG = CONFIG;
    this.elements = new DOMElements();
    this.dynamicColor = new DynamicColor();
    this.fetchData = new FetchData();
    this.loadingController = new LoadingController();
    this.animationController = new AnimationController();
    this.background = null; // Store background instance for color updates

    // Performance optimizations
    this.isPerformanceMode = CONFIG.PERFORMANCE_MODE || false;
    this.animationFrameId = null;
    this.resizeTimeout = null;
    this.intersectionObserver = null;

    // Initialize performance monitoring
    this.initPerformanceOptimizations();

    console.log("App initialized with performance optimizations");
  }

  initPerformanceOptimizations() {
    // Throttle resize events
    window.addEventListener('resize', this.throttledResize.bind(this), { passive: true });

    // Use Intersection Observer for lazy loading if supported
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection.bind(this), {
        threshold: 0.1,
        rootMargin: '50px'
      });
    }

    // Optimize scroll events
    this.optimizeScrollEvents();
  }

  throttledResize() {
    if (this.resizeTimeout) {
      cancelAnimationFrame(this.resizeTimeout);
    }
    this.resizeTimeout = requestAnimationFrame(() => {
      this.handleResize();
    });
  }

  handleResize() {
    // Update background and UI on resize
    if (this.background) {
      this.background.handleResize();
    }
    if (this.uiController) {
      this.uiController.handleResize();
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        // Add animation classes when elements come into view
        if (!target.classList.contains('animate-in')) {
          target.classList.add('animate-in');
        }
      }
    });
  }

  optimizeScrollEvents() {
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  handleScroll() {
    // Handle scroll-based animations and updates
    if (this.uiController) {
      this.uiController.handleScroll();
    }
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

    this.updateSkills(data);
    this.updateSocialLinks(data);
    this.updateProjects(data);

    console.log("User interface updated");
  }

  updateSkills(data) {
    const skillsContainer = document.getElementById("skills-container");
    skillsContainer.innerHTML = "";

    this.CONFIG.skills.forEach((skill) => {
      const skillIconHTML = this.findLanguageIcon(skill.name) || '<i class="bi bi-code-slash"></i>';

      const skillCard = document.createElement("a");
      skillCard.className = "skill-card";
      skillCard.href = skill.link;
      skillCard.target = "_blank";
      skillCard.rel = "noopener noreferrer";

      const iconWrap = document.createElement("div");
      iconWrap.className = "skill-icon";
      iconWrap.innerHTML = skillIconHTML;

      const nameEl = document.createElement("h4");
      nameEl.className = "skill-name";
      const skillName = skill.name;
      nameEl.textContent = skillName;

      // Long skill name marquee (same logic as projects)
      if (skillName.length > 4) {
        const scrollWrap = document.createElement("div");
        scrollWrap.className = "text-scrolling-container";
        nameEl.classList.add("text-scrolling");
        scrollWrap.appendChild(nameEl);
        skillCard.appendChild(iconWrap);
        skillCard.appendChild(scrollWrap);
      } else {
        skillCard.appendChild(iconWrap);
        skillCard.appendChild(nameEl);
      }
      
      skillsContainer.appendChild(skillCard);
    });
  }

  updateSocialLinks(data) {
    const extractSocialFromBio = (bio, platform) => {
      const regexes = {
        linkedin: /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i,
        instagram: /instagram\.com\/([a-zA-Z0-9_.-]+)/i,
      };
      const match = bio && bio.match(regexes[platform]);
      return match ? match[1] : null;
    };

    let socialContainer = document.getElementById("social-container");
    socialContainer.innerHTML = "";

    const socialLinks = {
      twitter: {
        username: data.twitter_username,
        baseUrl: "https://twitter.com/",
        icon: "bi-twitter-x",
        text: "Twitter",
      },
      github: {
        username: data.login,
        baseUrl: "https://github.com/",
        icon: "bi-github",
        text: "GitHub",
      },
      instagram: {
        username: extractSocialFromBio(data.bio, "instagram"),
        baseUrl: "https://instagram.com/",
        icon: "bi-instagram",
        text: "Instagram",
      },
      linkedin: {
        username: extractSocialFromBio(data.bio, "linkedin"),
        baseUrl: "https://linkedin.com/in/",
        icon: "bi-linkedin",
        text: "LinkedIn",
      },
    };

    Object.values(socialLinks).forEach((info) => {
      if (!info.username) return;
      const link = document.createElement("a");
      link.className = "social-link";
      link.href = `${info.baseUrl}${info.username}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const content = document.createElement("span");
      content.className = "social-link-content";

      const icon = document.createElement("span");
      icon.className = "social-icon";
      icon.innerHTML = `<i class="bi ${info.icon}"></i>`;

      const text = document.createElement("span");
      text.className = "social-text";
      text.textContent = `${info.text} · @${info.username}`;

      content.appendChild(icon);
      content.appendChild(text);
      link.appendChild(content);
      socialContainer.appendChild(link);
    });
  }

  updateProjects(data) {
    const container = document.getElementById("projects-container");
    const projectsTitle = document.getElementById("projects");

    projectsTitle.innerHTML = `<i class="bi bi-archive-fill"></i> Projects (${data.public_repos || 0})`;

    container.innerHTML = "";

    const repos = (data.repo || []).filter((r) => !r.archived);
    if (repos.length === 0) {
      const empty = document.createElement("div");
      empty.className = "project-card project-card--featured";

      const emptyContent = document.createElement("div");
      emptyContent.className = "project-content";

      const emptyDesc = document.createElement("p");
      emptyDesc.className = "project-description";
      emptyDesc.innerHTML = `<span class="project-description-icon"><i class="bi bi-inbox"></i></span> No projects available`;

      emptyContent.appendChild(emptyDesc);
      empty.appendChild(emptyContent);
      container.appendChild(empty);
      return;
    }

    // Sort by name
    repos.sort((a, b) => a.name.localeCompare(b.name));

    repos.forEach((repo, index) => this.createProjectElement(repo, index, container));
  }

  createProjectElement(repo, index, container) {
    const card = document.createElement("div");
    card.className = "project-card";
    card.style.setProperty("--project-index", index.toString());

    // Header
    const header = document.createElement("div");
    header.className = "project-header";

    const title = document.createElement("h5");
    title.className = "project-title";
    const titleText = repo.name ? repo.name.charAt(0).toUpperCase() + repo.name.slice(1) : "Unnamed Project";
    title.textContent = titleText;

    // Long title marquee
    if (titleText.length > 18) {
      const scrollWrap = document.createElement("div");
      scrollWrap.className = "text-scrolling-container";
      title.classList.add("text-scrolling");
      scrollWrap.appendChild(title);
      header.appendChild(scrollWrap);
    } else {
      header.appendChild(title);
    }

    const bookmark = document.createElement("i");
    bookmark.className = "project-bookmark";
    header.appendChild(bookmark);

    // Content wrapper
    const content = document.createElement("div");
    content.className = "project-content";

    // Description
    const desc = document.createElement("p");
    desc.className = "project-description";
    const description = repo.description || "No description available";
    desc.innerHTML = `<span class="project-description-icon"><i class="bi bi-card-text"></i></span>${description}`;

    // Meta information
    const meta = document.createElement("div");
    meta.className = "project-meta";

    const metaRow = document.createElement("div");
    metaRow.className = "project-meta-row";

    // Language
    if (repo.language) {
      const langItem = document.createElement("span");
      langItem.className = "project-meta-item project-language";
      langItem.innerHTML = `${this.findLanguageIcon(repo.language) || '<i class="bi bi-code-slash"></i>'} ${repo.language}`;
      metaRow.appendChild(langItem);
    }

    // Repository type
    const typeItem = document.createElement("span");
    typeItem.className = "project-meta-item";
    typeItem.innerHTML = repo.fork ? `<i class="bi bi-sign-turn-right-fill"></i> Fork` : `<i class="bi bi-gem"></i> Original`;
    metaRow.appendChild(typeItem);

    // Last updated
    if (repo.updated_at) {
      const updateDate = new Date(repo.updated_at);
      const updateItem = document.createElement("span");
      updateItem.className = "project-meta-item";
      updateItem.innerHTML = `<i class="bi bi-clock-history"></i> ${this.getTimeAgo(updateDate)}`;
      metaRow.appendChild(updateItem);
    }

    meta.appendChild(metaRow);

    // Stats
    const stats = document.createElement("div");
    stats.className = "project-stats";

    const addStat = (html) => {
      const s = document.createElement("span");
      s.className = "project-stat";
      s.innerHTML = html;
      stats.appendChild(s);
    };

    const size = (repo.size ?? 0) > 1000 ? `${(repo.size / 1000).toFixed(1)} MB` : `${repo.size ?? 0} KB`;
    addStat(`<i class="bi bi-database"></i> ${size}`);

    const stars = repo.stargazers_count ?? 0;
    addStat(`<i class="bi bi-star-fill"></i> ${stars >= 1000 ? (stars / 1000).toFixed(1) + 'k' : stars}`);

    const forks = repo.forks_count ?? 0;
    addStat(`<i class="bi bi-git"></i> ${forks >= 1000 ? (forks / 1000).toFixed(1) + 'k' : forks}`);

    content.appendChild(desc);
    content.appendChild(meta);
    content.appendChild(stats);

    // Footer with actions
    const footer = document.createElement("div");
    footer.className = "project-footer";

    const actions = document.createElement("div");
    actions.className = "project-actions";

    const repoLink = document.createElement("a");
    repoLink.href = repo.html_url;
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";
    repoLink.className = "social-link";
    repoLink.innerHTML = `<i class="bi bi-box-arrow-up-right"></i> View Project`;

    actions.appendChild(repoLink);
    footer.appendChild(actions);

    // Assemble
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    container.appendChild(card);
  }

  getTimeAgo(date) {
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
      
      // Create or update background with enhanced color management
      if (this.background) {
        this.background.updateColors(palette);
      } else {
        this.background = new Background("backgroundCanvas", palette, {
          colorMode: {
            dynamicColors: true,
            backgroundIntensity: 0.12,
            starColorVariation: true,
            connectionColorSync: true,
          }
        });
      }
      
      UIController.showSite(this.elements, this.CONFIG);

      // Initialize advanced animations after site is shown
      this.animationController.init();
      
      // Add data-animate attributes to elements for scroll animations
      this.setupScrollAnimationTriggers();

      // Initialize scroll animations after theme is applied
      this.initScrollAnimations();

    } catch (error) {
      console.error("Failed to apply theme:", error);
      this.handleError(error);
    }
  }

  /**
   * Setup data-animate attributes for scroll-triggered animations
   */
  setupScrollAnimationTriggers() {
    // Add animation attributes to sections
    const sections = document.querySelectorAll('.about-section, .skills-section, .projects-section, .social-section');
    sections.forEach((section, index) => {
      section.setAttribute('data-animate', index % 2 === 0 ? 'fadeInUp' : 'slideInLeft');
      section.setAttribute('data-delay', (index * 200).toString());
    });

    // Add animation attributes to cards
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
      card.setAttribute('data-animate', 'bounceIn');
      card.setAttribute('data-delay', (index * 100).toString());
    });

    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
      card.setAttribute('data-animate', 'slideInRight');
      card.setAttribute('data-delay', (index * 150).toString());
    });

    // Add parallax attributes to background elements
    const backgroundElements = document.querySelectorAll('.hero-section, .logo-wrapper');
    backgroundElements.forEach(element => {
      element.setAttribute('data-parallax', '0.2');
    });
  }

  /**
   * Initialize scroll animations using Intersection Observer
   */
  initScrollAnimations() {
    console.log("Initializing scroll animations...");

    // Elements to animate on scroll
    const animatedElements = document.querySelectorAll('.about-section, .skills-section, .projects-section, .social-section');

    // Intersection Observer options
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    // Create observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all sections
    animatedElements.forEach(element => {
      observer.observe(element);
    });

    // Add click handler and visibility control for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      // Click handler for smooth scrolling
      scrollIndicator.addEventListener('click', () => {
        // Get all sections that can be scrolled to
        const sections = document.querySelectorAll('.about-section, .skills-section, .projects-section, .social-section');
        const currentScroll = window.pageYOffset;
        const windowHeight = window.innerHeight;

        // Find the next section to scroll to
        let targetSection = null;
        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;

          // If section is below current scroll position, scroll to it
          if (sectionTop > currentScroll + windowHeight * 0.5) {
            targetSection = section;
            break;
          }
        }

        // If no section found (at bottom), scroll to top
        if (!targetSection && sections.length > 0) {
          targetSection = sections[0];
        }

        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });

      // Add scroll handler to show/hide scroll indicator based on position
      const toggleScrollIndicator = () => {
        const scrolledToBottom = window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 100;
        if (scrolledToBottom) {
          scrollIndicator.style.opacity = '0';
          scrollIndicator.style.pointerEvents = 'none';
        } else {
          scrollIndicator.style.opacity = '';
          scrollIndicator.style.pointerEvents = '';
        }
      };

      window.addEventListener('scroll', toggleScrollIndicator);
      // Initial check
      setTimeout(toggleScrollIndicator, 2500); // After initial animation
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