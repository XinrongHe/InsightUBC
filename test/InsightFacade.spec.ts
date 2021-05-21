import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        test: "./test/data/courses.zip",
        notZippedFile: "./test/data/AANB504",
        corruptedZip: "./test/data/corrupted.json.zip",
        rooms: "./test/data/rooms.zip",
        rooms2: "./test/data/rooms.zip",
        rooms3: "./test/data/rooms.zip",
        roomsWithNoIndex: "./test/data/roomsWithNoIndex.zip",
        singleZipFile: "./test/data/THTR354.zip",
        twoFolder: "./test/data/twoFolder.zip",
        emptyZippedFolder: "./test/data/empty.zip",
        folderWith2FileOneInJsonFormat1: "./test/data/coursesFolderWith2File.zip",
        folderWith2FileOneInJsonFormat2: "./test/data/coursesOneFileInPy.zip",
        BothNotInJsonFormat: "./test/data/coursesBothNotInJson.zip",
        BothWith0Section: "./test/data/CourseBoth0Section.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // ************************************ test add  ************************************

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    //  id invalid cases, the promise should reject with an InsightError/NotFoundError
    it("Add invalid data_set_kind - reject", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(InsightError);

    });

    it("Add invalid id contains an underscore - reject", function () {
        const id: string = "courses_1";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Add invalid id with only an underscore - reject", function () {
        const id: string = "_";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Add invalid id contains only whitespace characters - reject", function () {
        const id: string = " ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Add invalid id contains some whitespace characters - reject", function () {
        const id: string = " courses ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Add invalid Undefined id - reject", function () {
        const id: string = undefined;
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Add invalid id that is empty string - reject", function () {
        const id: string = "";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // it("ID not exsit - rejected with NotFoundError", function () {
    //     const id: string = "testReject";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     id, datasets[id], InsightDatasetKind.Courses
    //     );
    //     return expect(futureResult).to.be.rejectedWith(NotFoundError);
    // });

    // invalid zip cases

    it("With a not zipped file - reject", function () {
        const id: string = "notZippedFile";
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // it("With corrupted zip folder - reject", function () {
    //     const id: string = "corruptedZip";
    //     const futureResult: Promise<string[]> = insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     return expect(futureResult).to.be.rejectedWith(InsightError);
    // });

    it("With a single zipped course file - reject", function () {
        const id: string = "singleZipFile";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("With zipped file that contains two folder - reject", function () {
        const id: string = "twoFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // json format zipfolder cases
    it("empty zipped folder - reject", function () {
        const id: string = "emptyZippedFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("folder contains two files, one has zero section, the other has multiple section in Json - accept", function () {
        const id: string = "folderWith2FileOneInJsonFormat1";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("folder contains two files, One in Json, the other in python - accept", function () {
        const id: string = "folderWith2FileOneInJsonFormat2";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("folder that has two file, both not in json format - reject", function () {
        const id: string = "BothNotInJsonFormat";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });


    it("folder that has two file, both has 0 section - reject", function () {
        const id: string = "BothWith0Section";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Adding 2/more times
    it("Add two valid dataset - accept", function () {
        const id1: string = "courses";
        const id2: string = "test";
        const expected: string[] = [id1, id2];

        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const futureResult: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.deep.equal(expected);

    });

    it("Add a invalid dataset (only underscore) after a valid dataset - reject", function () {
        const id1: string = "courses";
        const id2: string = "_";
        const expected: string[] = [id1];

        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const futureResult: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Add a invalid dataset (underscore) after a valid dataset - reject", function () {
        const id1: string = "courses";
        const id2: string = "cour_ses";
        const expected: string[] = [id1];

        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const futureResult: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Add a invalid dataset (whiteSpace) after a valid dataset - reject", function () {
        const id1: string = "courses";
        const id2: string = " ";
        const expected: string[] = [id1];

        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const futureResult: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Add a dataset with same id after an valid dataset - reject and not save", function () {
        const id: string = "courses";
        const expected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    // ************************************ test remove  ************************************
    it("Remove a not yet added id - reject", function () {
        const id: string = "courses";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });

    it("Remove a not yet added room id - reject", function () {
        const id: string = "rooms";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });
    // it("Remove a not yet added id after added a different id - reject", function () {
    //     const id1: string = "test2";
    //     const id2: string = "courses";
    //     const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
    //     const futureResult: Promise<string> = r1.then( () => {
    //         return insightFacade.removeDataset(id2);
    //     });
    //     return expect(futureResult).to.be.rejectedWith(NotFoundError);
    //
    // });

    it("Remove a added id - accept", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];
        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(id);
        });
        return expect(futureResult).to.eventually.deep.equal(id);

    });

    it("Remove a added room id - accept", function () {
        const id: string = "rooms";
        const firstexpected: string[] = [id];
        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(id);
        });
        return expect(futureResult).to.eventually.deep.equal(id);

    });

    it("Remove invalid whitespace id - reject", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(" ");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid whitespace rooms id - reject", function () {
        const id: string = "rooms";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(" ");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid id with underline - reject", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("_");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid room id with underline - reject", function () {
        const id: string = "rooms";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("_");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove not yet added room id - reject", function () {
        const id: string = "rooms";

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("rooms2");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(NotFoundError);

    });

    it("Remove invalid id contains underline - reject", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("courses_1");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid rooms id contains underline - reject", function () {
        const id: string = "rooms";

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("rooms_1");
        });

        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid empty id - reject", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid empty room id - reject", function () {
        const id: string = "rooms";
        const firstexpected: string[] = [id];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset("");
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid undefined id - reject", function () {
        const id: string = "courses";
        const firstexpected: string[] = [id];
        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(undefined);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("Remove invalid undefined room id - reject", function () {
        const id: string = "rooms";
        const firstexpected: string[] = [id];
        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        const futureResult: Promise<string> = r1.then( () => {
            return insightFacade.removeDataset(undefined);
        });
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);

    });

    it("remove dataset with multiple accepted add", function () {
        const id1: string = "rooms";
        const id2: string = "test";
        const id3: string = "folderWith2FileOneInJsonFormat2";
        // const expected: string[] = [id1,id2, id3];

        const expected: InsightDataset[] = [
            // {id: id3, kind: InsightDatasetKind.Courses, numRows: 20}
        ];
        // 这里可能要改
        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Rooms);

        const r2: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });

        // const r3: Promise<string[]> = r2.then( () => {
        //     return insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Courses);
        // });

        const d1: Promise<string> = r2.then( () => {
            return insightFacade.removeDataset(id1);
        });

        const d2: Promise<string> = d1.then( () => {
            return insightFacade.removeDataset(id2);
        });

        const futureResult: Promise<InsightDataset[]> = d2.then( () => {
            return insightFacade.listDatasets();
        });

        return expect(futureResult).to.eventually.deep.equal(expected);

    });


    // // ************************************ test list  ************************************

    it("list empty dataset", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("list dataset with one accepted add", function () {
        const id: string = "courses";

        const expected: InsightDataset[] = [ {id: id, kind: InsightDatasetKind.Courses, numRows: 64612} ];

        const r1: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        const futureResult: Promise<InsightDataset[]> = r1.then( () => {
            return insightFacade.listDatasets();
        });

        return expect(futureResult).to.eventually.deep.equal(expected);

    });

    it("list dataset with multiple accepted add", function () {
        const id1: string = "courses";
        const id2: string = "test";
        const id3: string = "folderWith2FileOneInJsonFormat2";
        // 这里可能要改rows
        const expected: InsightDataset[] = [
            {id: id1, kind: InsightDatasetKind.Courses, numRows: 64612},
            {id: id2, kind: InsightDatasetKind.Courses, numRows: 64612},
            {id: id3, kind: InsightDatasetKind.Courses, numRows: 20}
        ];

        // 这里可能要改
        const r1: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);

        const r2: Promise<string[]> = r1.then( () => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        });

        const r3: Promise<string[]> = r2.then( () => {
            return insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Courses);
        });

        const futureResult: Promise<InsightDataset[]> = r3.then( () => {
            return insightFacade.listDatasets();
        });

        return expect(futureResult).to.eventually.deep.equal(expected);

    });

    // ************************************ test room  ************************************

    it("Add valid room - accept", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Add invalid room with no index.html - reject", function () {
        const id: string = "roomsWithNoIndex";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}, // TODO: ADDED by me
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
        //     .catch((err) => {
        //     /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
        //      * for the purposes of seeing all your tests run.
        //      * TODO For C1, remove this catch block (but keep the Promise.all)
        //      */
        //     return Promise.resolve("HACK TO LET QUERIES RUN");
        // });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
