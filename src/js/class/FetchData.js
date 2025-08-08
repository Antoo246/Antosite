class FetchData {
  constructor() {
    this.token = "";
  }

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
}
