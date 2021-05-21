/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => { // Not 100% sure
    return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:4321/query',false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    // console.log(xhr.response);
                    reject(JSON.parse(xhr.response)); // {"error":{}}, fixed so no empty object
                }
            };
            xhr.send(JSON.stringify(query));
    });
};

