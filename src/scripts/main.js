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
 * Load and initialize the page
 */
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPage);
} else {
  loadPage();
}

// Export for potential external use
export { loadPage };