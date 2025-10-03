/**
 * DOM Elements Manager
 * Centralizes access to all DOM elements used in the application
 */

export class DOMElements {
  constructor() {
    this.main = document.getElementById("home");
    this.error = document.getElementById("error");
    this.errorTitle = document.getElementById("title-error");
    this.errorMessage = document.getElementById("message-error");
    this.aboutMe = document.getElementById("aboutme");
    this.loading = document.getElementById("loading");
    this.logo = document.getElementById("logo");
    this.name = document.getElementById("username");
    this.username = document.getElementById("tag");

    // Social media elements
    this.twitter = document.getElementById("twitter");
    this.github = document.getElementById("github");
    this.instagram = document.getElementById("instagram");
    this.linkedin = document.getElementById("linkedin");
    this.blog = document.getElementById("blog");

    this.skillIconJSON = [];
  }

  /**
   * Get element by ID with error handling
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} - The element or null if not found
   */
  getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  }

  /**
   * Get multiple elements by class name
   * @param {string} className - Class name
   * @returns {HTMLCollection} - Collection of elements
   */
  getElementsByClass(className) {
    return document.getElementsByClassName(className);
  }

  /**
   * Get single element by class name
   * @param {string} className - Class name
   * @returns {Element|null} - The first element or null if not found
   */
  getElementByClass(className) {
    const elements = document.getElementsByClassName(className);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Query selector wrapper
   * @param {string} selector - CSS selector
   * @returns {Element|null} - The element or null if not found
   */
  querySelector(selector) {
    return document.querySelector(selector);
  }

  /**
   * Query selector all wrapper
   * @param {string} selector - CSS selector
   * @returns {NodeList} - List of elements
   */
  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  }
}