/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
// import {NotFoundError, RequestHandler} from "restify";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import InsightFacade = require("../controller/InsightFacade");
import IInsightFacade = require("../controller/IInsightFacade");

/**
 * This configures the REST endpoints for the server.
 */
let tha: any;
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static insightFacade: InsightFacade.default;
    // private static insightFacade: any;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
        // tha = this;
        if (!Server.insightFacade) {
            Server.insightFacade = new InsightFacade.default();
        }
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        tha = that;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", Server.putDs); // calling add dataset

                that.rest.del("/dataset/:id", Server.deleteDs); // calling remove dataset

                that.rest.post("/query", Server.queryDs); // calling perform query

                that.rest.get("/datasets", Server.getDs); // calling list dataset

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // I can't make this static because I will need to call add dataset
    private static putDs(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            const dsID = req.params.id;
            const dsKind = req.params.kind;
            let kind: InsightDatasetKind;
            if (dsKind === "courses") {
                kind = InsightDatasetKind.Courses;
            } else if (dsKind === "rooms") {
                kind = InsightDatasetKind.Rooms;
            } else {
                Log.error("Server::putDs(..) - responding 400");
                res.json(400, {error: "invalid dataset kind"});
                return next();
            }

            const contentBuf: Buffer = req.body; // req.body is buffer
            const content = contentBuf.toString("base64"); // as raw as 'buffer' (wrap with try catch)

            Server.insightFacade.addDataset(dsID, content, kind).then( (arr) => {
                Log.info("Server::putDs(..) - responding " + 200);
                res.json(200, {result: arr});
                return next();
            }).catch( (err) => {
                Log.error("Server::putDs(..) - responding 400");
                res.json(400, {error: err.message});
                return next();
            });
        } catch (err) {
            Log.error("Server::putDs(..) - responding 400");
            res.json(400, {error: err.message});
        }

        return next();
    }

    private static deleteDs(req: restify.Request, res: restify.Response, next: restify.Next) {
        const dsID = req.params.id;
        Server.insightFacade.removeDataset(dsID).then( (str: string) => {
            Log.info("Server::deleteDs(..) - responding " + 200);
            res.json(200, {result: str});
            return next();
        }).catch( (err: any) => {
            if (err instanceof IInsightFacade.InsightError) {
                Log.error("Server::deleteDs(..) - responding 400");
                res.json(400, {error: err.message});
                return next();
            } else if (err instanceof IInsightFacade.NotFoundError) {
                Log.error("Server::deleteDs(..) - responding 404");
                res.json(404, {error: err.message});
                return next();
            }
        });
        // return next();
    }

    private static queryDs(req: restify.Request, res: restify.Response, next: restify.Next) {
        const query = req.body;
        Server.insightFacade.performQuery(query).then( (arr: any[]) => {
            Log.info("Server::queryDs(..) - responding " + 200);
            res.json(200, {result: arr});
            return next();
        }).catch( (err: any) => {
            Log.error("Server::queryDs(..) - responding 400");
            res.json(400, {error: err.message});
            return next();
        });
    }

    private static getDs(req: restify.Request, res: restify.Response, next: restify.Next) {
        Server.insightFacade.listDatasets().then( (arr: any[]) => {
            Log.info("Server::getDs(..) - responding 200");
            res.json(200, {result: arr});
            return next();
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
