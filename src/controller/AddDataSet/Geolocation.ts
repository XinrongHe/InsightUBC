import * as http from "http";

export default class Geolocation {

    public static async getGeolocation (address: string): Promise<any> {
        return new Promise((resolve) => {
            const url = new URL("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team230/" + address);
            http.get(url, (res) => {
                const { statusCode } = res;
                const contentType = res.headers["content-type"];

                if (statusCode !== 200) {
                    resolve (new Error("Request Failed.\n" +
                        "Status Code:" + statusCode));
                } else if (!/^application\/json/.test(contentType)) {
                    resolve (new Error("Invalid content-type.\n" +
                        "Expected application/json but received" + contentType ));
                }

                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", (chunk) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        resolve (parsedData);
                    } catch (e) {
                        resolve (e.message);
                    }
                });
            }).on("error", (e) => {
                resolve ("Got error:" + e.message);
            });
        });

    }

}
