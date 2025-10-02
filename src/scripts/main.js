/**
 * Main Application Entry Point
 * Initializes and starts the Antosite portfolio application
 */

import { App } from './core/App.js';

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

    // Fallback loading completion if something goes wrong
    const fallbackLoader = document.getElementById("loading");
    if (fallbackLoader) {
      fallbackLoader.classList.replace("show", "hide");
    }

    // Show error in main content
    const main = document.getElementById("home");
    if (main) {
      main.classList.replace("hide", "show");
      main.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>Errore di caricamento</h1>
          <p>Siamo spiacenti, si è verificato un errore durante il caricamento del sito.</p>
          <p>Ricarica la pagina per riprovare.</p>
        </div>
      `;
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