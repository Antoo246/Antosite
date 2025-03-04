class FetchData {
  constructor() {
    this.token = "";
  }

  // Function for fetch data from github api
  fetchGithubData(user) {
    let headers = new Headers();
    headers.append("Accept", "application/vnd.github.v3+json");
    if (this.token != "")
      headers.append("Authorization", `token ${this.token}`);

    return new Promise((resolve, reject) => {
      if (user && user != "") {
        fetch("https://api.github.com/users/" + user, {
          headers: headers,
        })
          .then((response) => {
            if (!response.ok) {
              reject("Fetch Failed");
            }
            return response.json();
          })
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        reject("User impossible to fetch");
      }
    });
  }
}
