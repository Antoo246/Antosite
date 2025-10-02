/**
 * Fetch Data Utility
 * Handles API calls and data fetching operations
 */

export class FetchData {
  constructor() {
    this.token = "";
  }

  /**
   * Fetch data from GitHub API
   * @param {string} userOrPath - GitHub username or full API path
   * @returns {Promise<Object>} - API response data
   */
  fetchGithubData(userOrPath) {
    const headers = new Headers();
    headers.append("Accept", "application/vnd.github.v3+json");
    if (this.token) headers.append("Authorization", `token ${this.token}`);

    return new Promise((resolve, reject) => {
      if (!userOrPath || typeof userOrPath !== "string") {
        reject("Invalid user or path");
        return;
      }

      const base = "https://api.github.com/users/";
      const url = userOrPath.startsWith("http")
        ? userOrPath
        : base + userOrPath;

      fetch(url, { headers })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((err) => {
              const message = err && err.message ? err.message : "Fetch Failed";
              throw new Error(message);
            });
          }
          return response.json();
        })
        .then(resolve)
        .catch((error) => reject(error.message || error));
    });
  }

  /**
   * Set authentication token for API calls
   * @param {string} token - GitHub API token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = "";
  }

  /**
   * Generic fetch method with error handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  }
}