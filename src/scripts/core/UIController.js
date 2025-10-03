/**
 * UI Controller
 * Manages UI state transitions and user interface updates
 */

export class UIController {
  /**
   * Show the main site content
   * @param {DOMElements} elements - DOM elements instance
   * @param {Object} CONFIG - Application configuration
   */
  static showSite(elements, CONFIG) {
    console.log("UIController.showSite called");
    elements.main.classList.replace("hide", "show");
    elements.aboutMe.textContent = CONFIG.ABOUT_TEXT;
    console.log("Site shown");
  }

  /**
   * Show error state
   * @param {DOMElements} elements - DOM elements instance
   * @param {string} message - Error message to display
   * @param {Object} CONFIG - Application configuration
   */
  static showError(elements, message = "An error occurred while loading the page", CONFIG) {
    console.log("UIController.showError called");
    
    // Hide loading screen
    elements.loading.classList.replace("show", "hide");
    
    // Determine error message based on error type and language
    let errorTitle = "Connection Error";
    let errorMessage = message;
    
    // Check if it's a common error and provide better messaging
    if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
      errorTitle = "🌐 Connection Problem";
      errorMessage = "Unable to connect to GitHub. Please check your internet connection and try again.";
    } else if (message.includes("createRadialGradient") || message.includes("canvas")) {
      errorTitle = "⚠️ Display Issue";
      errorMessage = "There was a problem with the graphics display. Please refresh the page.";
    } else if (message.includes("API") || message.includes("rate limit")) {
      errorTitle = "🔄 Service Unavailable";
      errorMessage = "The GitHub service is temporarily unavailable. Please try again in a few minutes.";
    }
    
    // Update error content
    if (elements.errorTitle) {
      elements.errorTitle.textContent = errorTitle;
    }
    if (elements.errorMessage) {
      elements.errorMessage.innerHTML = errorMessage;
    }
    
    // Show error with enhanced animations
    elements.error.classList.replace("hide", "show");
    elements.error.classList.add("error-appear");
    
    // Add staggered animations to error content
    setTimeout(() => {
      if (elements.errorTitle) {
        elements.errorTitle.classList.add("error-title-animate");
      }
    }, 200);
    
    setTimeout(() => {
      if (elements.errorMessage) {
        elements.errorMessage.classList.add("error-message-animate");
      }
    }, 400);
    
    console.log("Error shown:", { title: errorTitle, message: errorMessage });
  }

  /**
   * Toggle element visibility
   * @param {HTMLElement} element - Element to toggle
   * @param {boolean} show - Whether to show or hide
   */
  static toggleVisibility(element, show) {
    if (!element) return;

    if (show) {
      element.classList.remove("hide");
      element.classList.add("show");
    } else {
      element.classList.remove("show");
      element.classList.add("hide");
    }
  }

  /**
   * Add loading state to element
   * @param {HTMLElement} element - Element to add loading state to
   */
  static addLoadingState(element) {
    if (!element) return;
    element.classList.add("loading");
  }

  /**
   * Remove loading state from element
   * @param {HTMLElement} element - Element to remove loading state from
   */
  static removeLoadingState(element) {
    if (!element) return;
    element.classList.remove("loading");
  }

  /**
   * Update element text content
   * @param {HTMLElement} element - Element to update
   * @param {string} text - New text content
   */
  static updateText(element, text) {
    if (!element) return;
    element.textContent = text;
  }

  /**
   * Update element HTML content
   * @param {HTMLElement} element - Element to update
   * @param {string} html - New HTML content
   */
  static updateHTML(element, html) {
    if (!element) return;
    element.innerHTML = html;
  }

  /**
   * Add CSS class to element
   * @param {HTMLElement} element - Element to modify
   * @param {string} className - Class to add
   */
  static addClass(element, className) {
    if (!element) return;
    element.classList.add(className);
  }

  /**
   * Remove CSS class from element
   * @param {HTMLElement} element - Element to modify
   * @param {string} className - Class to remove
   */
  static removeClass(element, className) {
    if (!element) return;
    element.classList.remove(className);
  }

  /**
   * Toggle CSS class on element
   * @param {HTMLElement} element - Element to modify
   * @param {string} className - Class to toggle
   */
  static toggleClass(element, className) {
    if (!element) return;
    element.classList.toggle(className);
  }

  /**
   * Set element attribute
   * @param {HTMLElement} element - Element to modify
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   */
  static setAttribute(element, attribute, value) {
    if (!element) return;
    element.setAttribute(attribute, value);
  }

  /**
   * Get element attribute
   * @param {HTMLElement} element - Element to query
   * @param {string} attribute - Attribute name
   * @returns {string|null} - Attribute value or null
   */
  static getAttribute(element, attribute) {
    if (!element) return null;
    return element.getAttribute(attribute);
  }

  /**
   * Animate element with fade in effect
   * @param {HTMLElement} element - Element to animate
   * @param {number} delay - Animation delay in milliseconds
   */
  static fadeIn(element, delay = 0) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }

  /**
   * Animate element with fade out effect
   * @param {HTMLElement} element - Element to animate
   * @param {number} delay - Animation delay in milliseconds
   */
  static fadeOut(element, delay = 0) {
    if (!element) return;

    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
    }, delay);
  }

  /**
   * Scroll to element smoothly
   * @param {HTMLElement} element - Element to scroll to
   * @param {number} offset - Offset from top in pixels
   */
  static scrollToElement(element, offset = 0) {
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - Whether element is visible in viewport
   */
  static isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get element dimensions
   * @param {HTMLElement} element - Element to measure
   * @returns {Object} - Object with width, height, top, left, right, bottom properties
   */
  static getDimensions(element) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    };
  }
}