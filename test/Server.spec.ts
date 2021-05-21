import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
    };

    // const querysToTest: { [id: string]: string } = {
    //     validQuery: "./test/queries/complexSort.json",
    //     invalidQuery: "./test/queries/invalidApplyKey.json",
    // }

    let datasets: { [id: string]: Buffer } = {};
    // let querys: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    let SERVER_URL: string = "http://localhost:4321";
    // let ENDPOINT_URL: string = "/dataset/courses/courses";
    // let ZIP_FILE_DATA: any = datasets["courses"];

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // if (!fs.existsSync(cacheDir)) {
        //     fs.mkdirSync(cacheDir);
        // }

        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]); // as raw as 'buffer'
        }

        server.start();
    });

    after(function () {
        server.stop();
        Log.test(`After: ${this.test.parent.title}`);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
        // might want to add some process logging here to keep track of what"s going on

        // try {
        //     fs.removeSync(cacheDir);
        //     fs.mkdirSync(cacheDir);
        //     insightFacade = new InsightFacade();
        // } catch (err) {
        //     Log.error(err);
        // }
    });

    // Sample on how to format PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("\"PUT test for courses dataset\" passed!");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT test for courses dataset\"");
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    // it("PUT test for buffer from/to string fail 400", function () {
    //     try {
    //         return chai.request(SERVER_URL)
    //             .put("/dataset/courses/courses")
    //             .send(fs.readFileSync(datasetsToLoad["courses"]).toString("base64"))
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then(function (res: Response) {
    //                 // some logging here please!
    //                 Log.error("Test failed - \"PUT test for buffer from/to string fail 400\"");
    //                 expect.fail();
    //             })
    //             .catch(function (err) {
    //                 // some logging here please!
    //                 Log.info("\"PUT test for buffer from/to string fail 400\" passed!");
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.error(err.message);
    //         expect.fail();
    //         // and some more logging here!
    //     }
    // });

    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/rooms")
                .send(datasets["rooms"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("\"PUT test for rooms dataset\" passed!");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT test for rooms dataset\"");
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("PUT: duplicate room", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/rooms")
                .send(datasets["rooms"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT: duplicate room\"");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    // some logging here please!
                    Log.info("\"PUT: duplicate room\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("PUT: duplicate course", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses/courses")
                .send(datasets["rooms"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT: duplicate courses\"");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    // some logging here please!
                    Log.info("\"PUT: duplicate courses\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("PUT test for courses dataset - 400", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/courses_abc/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT test for courses dataset - 400\"");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    // some logging here please!
                    Log.info("\"PUT test for courses dataset - 400\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("PUT test for rooms dataset - 400", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms_abc/rooms")
                .send(datasets["rooms"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT test for rooms dataset - 400\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"PUT test for rooms dataset - 400\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("PUT test for invalid kind - 400", function () {
        try {
            return chai.request(SERVER_URL)
                .put("/dataset/rooms/invalid")
                .send(datasets["rooms"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"PUT test for invalid kind - 400\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"PUT test for invalid kind - 400\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    // ************************************ test remove  ************************************

    it("Delete a not yet added dataset - 404", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courseA")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete a not yet added dataset - 404\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete a not yet added dataset - 404\" passed!");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("\"Delete test for courses dataset\" passed!");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete test for courses dataset\"");
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete test for rooms dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/rooms")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("\"Delete test for rooms dataset\" passed!");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete test for rooms dataset\"");
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete: duplicate - 404", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/rooms")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"DDelete: duplicate - 404\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete: duplicate - 404\" passed!");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete: duplicate2 - 404", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"DDelete: duplicate2 - 404\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete: duplicate2 - 404\" passed!");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete test for rooms dataset - 404", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/rooms1")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete test for rooms dataset - 400\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete test for rooms dataset - 404\" passed!");
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete test for courses dataset - 400", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/courses_HI")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete test for courses dataset - 400\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete test for courses dataset - 400\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    it("Delete test for courses dataset - 400 empty", function () {
        try {
            return chai.request(SERVER_URL)
                .del("/dataset/ ")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.error("Test failed - \"Delete test for courses dataset - 400 empty\"");
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.info("\"Delete test for courses dataset - 400 empty\" passed!");
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err.message);
            expect.fail();
            // and some more logging here!
        }
    });

    // it("POST test for courses dataset", function () {
    //     try {
    //         return chai.request(SERVER_URL)
    //             .post("/query")
    //             .send(datasets["courses"])
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then(function (res: Response) {
    //                 // some logging here please!
    //                 Log.info("\"POST test for courses dataset\" passed!");
    //                 expect(res.status).to.be.equal(200);
    //             })
    //             .catch(function (err) {
    //                 // some logging here please!
    //                 Log.error("Test failed - \"POST test for courses dataset\"");
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         Log.error(err.message);
    //         // and some more logging here!
    //     }
    // });

    it("GET test", function () {
        try {
            return chai.request(SERVER_URL)
                .get("/datasets")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.info("\"GET test\" passed!");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error("Test failed - \"GET test\"");
                    expect.fail();
                });
        } catch (err) {
            Log.error(err.message);
            // and some more logging here!
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
