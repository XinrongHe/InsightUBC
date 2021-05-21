import Log from "../Util";
import DataSetHelper from "./AddDataSet/DataSetHelper";
import { FilterComparator } from "./Query/Comparator/FilterComparator";
import Option from "./Query/Option";
import StructureCheck from "./Query/StructureCheck";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import * as fs from "fs";
import CourseData from "./AddDataSet/CourseData";
import RoomData from "./AddDataSet/RoomData";
import Trans from "./Query/Trans/Trans";
import KeyHelper from "./Query/Trans/KeyHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    private datasetId: string[] = [];
    private diskData: { [id: string]: any } = {};
    private comparator: FilterComparator;
    private sortOption: Option;
    private structCheck: StructureCheck;
    private Trans: Trans;
    // private datasetHelper: DataSetHelper;
    private courseKeys = [
        "avg",
        "pass",
        "fail",
        "audit",
        "year",
        "dept",
        "id",
        "instructor",
        "title",
        "uuid", // PREVIOUS UP TO HERE
    ];

    private roomKeys = [
        "fullname",
        "shortname",
        "number",
        "name",
        "address",
        "lat",
        "lon",
        "seats",
        "type",
        "furniture",
        "href",
    ];

    private usedKeys: any[] = [];
    // private allColKeys: string[] = []; //used in query

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.loadDataFromDisk(this.diskData, this.datasetId);
        this.comparator = new FilterComparator();
        this.structCheck = new StructureCheck();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (kind === InsightDatasetKind.Courses) {
            const courseData = new CourseData(this.datasetId);
            return courseData.addData(id, content, this);
        } else if (kind === InsightDatasetKind.Rooms) {
            const courseData = new RoomData(this.datasetId);
            return courseData.addData(id, content, this);
        } else {
            return Promise.reject(new InsightError("Invalid datatype: NOT COURSE"));
        }
    }

    public removeDataset(id: string): Promise<string> {
        // 1. check if idstring invalid
        // 2. check if idstring already exist
        return new Promise((resolve, reject) => {
            try {
                if (DataSetHelper.checkIdString(id)) {
                    let idIndex: number = this.datasetId.indexOf(id);
                    if (idIndex !== -1) {
                        delete this.datasetId[idIndex];
                        delete this.diskData[id];
                        const path: string = "./data/" + id;
                        if (fs.existsSync(path)) {
                            fs.unlinkSync(path);
                        }
                        resolve(id);
                    } else {
                        reject(new NotFoundError("ID not yet added"));
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise((resolve, reject) => {
            try {
                if (this.structCheck.checkOuterLayer(query)) {
                    let trans = query.TRANSFORMATIONS;
                    let datasetId: string[] = [];
                    let datasetKeys: string[] = []; // check key in right kind
                    let applyKeys: string[] = [];
                    let allColKeys: string[] = [];
                    this.getColumnID(datasetId, datasetKeys, applyKeys, allColKeys, query.OPTIONS);
                    this.structCheck.checkIfIdEmpty(datasetId, reject); // make sure that we have ID
                    let sections: any[] = this.diskData[datasetId[0]][1]["dataToStore"]; // get ds by id
                    let sectionsKind = this.checkIfKeysMatchesDataKind(datasetId, datasetKeys, reject);
                    let filterSections = [];
                    this.Trans = new Trans();
                    if (Object.keys(query.WHERE).length === 0) {
                        filterSections = sections;
                        filterSections = this.Trans.runTrans(
                            trans, datasetKeys, datasetId, applyKeys, sectionsKind, filterSections
                        );
                        this.structCheck.checkResTooLarge(filterSections);
                        this.sortOption = new Option(
                            query.OPTIONS, filterSections, this.Trans, datasetId, allColKeys // key para changed
                        );
                        let res = this.sortOption.callSort(trans);
                        resolve(res);
                    } else if (Object.keys(query.WHERE).length === 1) {
                        filterSections = this.comparator.runFilter(query.WHERE, sections, datasetId[0], sectionsKind);
                        filterSections = this.Trans.runTrans(
                            trans, datasetKeys, datasetId, applyKeys, sectionsKind, filterSections
                        );
                        this.structCheck.checkResTooLarge(filterSections);
                        this.sortOption = new Option(
                            query.OPTIONS, filterSections, this.Trans, datasetId, allColKeys
                        );
                        let res = this.sortOption.callSort(trans);
                        resolve(res);
                    } else {
                        reject(new InsightError("where has more than one field"));
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    private checkIfKeysMatchesDataKind(datasetId: string[], datasetKeys: string[], reject: (reason?: any) => void) {
        let sectionsKind: any = this.diskData[datasetId[0]][0][
            "kind"
            ]; // get dataset kind
        if (sectionsKind === "rooms") {
            this.usedKeys = this.roomKeys;
        } else if (sectionsKind === "courses") {
            this.usedKeys = this.courseKeys;
        }
        for (let key of datasetKeys) {
            if (this.usedKeys.indexOf(key) === -1) {
                reject(new InsightError("query used key does not match the data kind"));
            }
        }

        return sectionsKind;
    }

    private getColumnID(
        datasetId: string[], datasetKeys: string[],
        applyKeys: string[], allColKeys: string[], options: any
    ) {
        if (this.structCheck.checkColumn(options)) {
            for (let i in options.COLUMNS) {                 // get all the id we need from options
                let str = options.COLUMNS[i];
                StructureCheck.isString(str);
                if (str.includes("_")) {
                    if (str.split("_").length === 2) {
                        let id = str.split("_")[0];
                        let key = str.split("_")[1];
                        if (
                            DataSetHelper.checkIDInQuery(id, this.datasetId) // check if id exist
                        ) {
                            datasetId.push(id);
                            if (this.courseKeys.indexOf(key) === -1
                                && this.roomKeys.indexOf(key) === -1) { // check kind
                                throw new InsightError("Not valid key");
                            }
                            datasetKeys.push(key); // TODO: CHECK DUPLICATION
                            allColKeys.push(key);
                        }
                    } else {
                        throw new InsightError("invalid key");
                    }
                } else {
                    KeyHelper.checkApplyKeyString(str);
                    applyKeys.push(str);
                    allColKeys.push(str);
                }
            }
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve) => {
            let lst: InsightDataset[] = [];
            let ids: string[] = Object.keys(this.diskData);
            for (let id of ids) {
                let data = this.diskData[id];
                let kind: string = data[0]["kind"];
                let kindRes: InsightDatasetKind;
                if (kind === "courses") {
                    kindRes = InsightDatasetKind.Courses;
                } else if (kind === "rooms") {
                    kindRes = InsightDatasetKind.Rooms;
                }
                // rearranged: I didn't consider what if kind not
                // equal both room and course，might need another else
                let numRows: number = data[1]["dataToStore"].length;
                let i: InsightDataset;
                i = { id: id, kind: kindRes, numRows: numRows };
                lst.push(i);
            }
            resolve(lst);
        });
    }

    // ************************************
    // getter, add, and constructor helper
    // ************************************

    /**
     * called from constructor: With this step, We don't have to call readFileSync every time
     */
    public loadDataFromDisk(diskD: any, datasetId: string[]) {
        const dataFromDisk: string[] = fs.readdirSync("./data");

        for (const id of dataFromDisk) {
            if (id !== ".DS_Store") {
                diskD[id] = JSON.parse(
                    fs.readFileSync("./data/" + id).toString(),
                );
                datasetId.push(id);
            }
        }
    }

    public getDatasetId(): string[] {
        return this.datasetId;
    }

    public addDatasetId(id: string) {
        if (!this.datasetId.includes(id)) {
            // added check in case I need to use in the future in other function
            this.datasetId.push(id);
        }
    }

    public addDataToLocalVariableAsACopy(id: string, data: any[]) {
        if (!this.diskData[id]) {
            // add check for future use, more accurate and less buggy
            this.diskData[id] = data;
        }
    }

}
