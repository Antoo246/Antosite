class FetchData {

    fetchGithubData(user) {
        return new Promise((resolve, reject) => {
            fetch("https://api.github.com/users/" + user)
                .then(response => response.json())
                .then(data => {
                    resolve({ data });
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        })
    }


}
