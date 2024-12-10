class FetchData {
    // Function for fetch data from github api
    fetchGithubData(user) {
        return new Promise((resolve, reject) => {
            if (user && user != "") {
                fetch("https://api.github.com/users/" + user)
                .then(response => {
                    if (!response.ok) {
                        reject("Fetch Failed");
                    }
                    return response.json();
                })
                .then(data => {
                    resolve(data);
                })
                .catch(error => {
                    reject(error);
                });
            } else {
                reject("User impossible to fetch");
            }
        })

    }


}
