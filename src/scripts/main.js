/**
 * Main Application Entry Point
 * Initializes and starts the Antosite portfolio application
 */

import { App } from './core/App.js';
import { Background } from './components/Background.js';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Could show user-friendly error message here
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Could show user-friendly error message here
});

/**
 * Handle URL navigation and reset to base URL on reload
 */
function handleNavigation() {
  // Get the current URL
  const currentUrl = window.location.href;
  const baseUrl = window.location.origin + window.location.pathname;
  
  // Check if we have hash or search parameters
  if (window.location.hash || window.location.search) {
    // Reset to base URL without hash or search parameters
    window.history.replaceState(null, '', baseUrl);
    console.log('URL reset to base:', baseUrl);
  }
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    // Always redirect to base URL
    window.history.replaceState(null, '', baseUrl);
  });
}

/**
 * Load and initialize the page
 */
async function loadPage() {
  console.log("loadPage called");
  
  // Handle URL navigation first
  handleNavigation();

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

    // Hide loading screen
    const fallbackLoader = document.getElementById("loading");
    if (fallbackLoader) {
      fallbackLoader.classList.replace("show", "hide");
    }

    // Show the dedicated error screen instead of inline error
    const errorSection = document.getElementById("error");
    const errorTitle = document.getElementById("title-error");
    const errorMessage = document.getElementById("message-error");

    if (errorSection) {
      // Update error content
      if (errorTitle) {
        errorTitle.textContent = "Loading Error";
      }
      if (errorMessage) {
        errorMessage.textContent = "We're sorry, an error occurred while loading the site.";
      }

      // Show error screen with proper styling
      errorSection.classList.replace("hide", "show");
      errorSection.classList.add("error-appear");

      // Initialize background for error screen
      new Background("backgroundCanvas", null);

      // Add staggered animations
      setTimeout(() => {
        if (errorTitle) {
          errorTitle.classList.add("error-title-animate");
        }
      }, 200);

      setTimeout(() => {
        if (errorMessage) {
          errorMessage.classList.add("error-message-animate");
        }
      }, 400);
    }
  }
}

/**
 * Initialize link handlers to prevent URL changes
 */
function initializeLinkHandlers() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      
      // Handle internal anchor links (e.g., #about, #projects)
      if (href.startsWith('#')) {
        event.preventDefault();
        
        // Scroll to the target element smoothly
        const targetElement = document.querySelector(href);
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
        
        // Don't change the URL - keep it clean
        console.log('Scrolled to section:', href, 'without changing URL');
      }
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadPage();
    initializeLinkHandlers();
  });
} else {
  loadPage();
  initializeLinkHandlers();
}

// Export for potential external use
export { loadPage };