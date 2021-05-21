import JSZip = require("jszip");
import {
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "../IInsightFacade";
import InsightFacade from "../InsightFacade";
import * as fs from "fs";
import Geolocation from "./Geolocation";
const parse5 = require("parse5");

export default abstract class DataSetHelper {

    public abstract addData(id: string, content: string, insightFacade: InsightFacade): Promise<string[]>;


    protected abstract checkDir(fileName: string[], zip: JSZip): boolean;

    // ************************************
    // Below are all checks, might need to group them in a class in the future??
    // ************************************

    /**
     * Check before remove
     */
    public static checkIfIdValidWhenRemove(id: string, dataset: string[]): boolean {
        // 1. check if idstring invalid
        if (this.checkIdString(id)) {
            return true;
        } else {
            throw new InsightError("ID string not valid");
        }
    }

    /**
     * Check if the ID string fullfill the requirement
     */
    public static checkIdString(id: string): boolean {
        if (id === null || id === undefined || id === "") {
            throw new InsightError("ID string is empty");
        } else if (!/\S/.test(id) || id.includes("_")) {
            throw new InsightError("ID string not valid");
        }
        return true;
    }

    /**
     * Check if the ID already exist, if yes, return false, if no, call the checkIdString
     */
    public checkIdWhenAdd(id: string, dataset: string[]): boolean {
        if (dataset.length !== 0) {
            let idIndex: number = dataset.indexOf(id);
            if (idIndex !== -1) {
                throw new InsightError("ID string already exist");
            }
        }
        return DataSetHelper.checkIdString(id);
    }

    /**
     * Check if in query
     */
    public static checkIDInQuery(id: string, dataset: string[]): boolean {
        if (dataset.length !== 0) {
            let idIndex: number = dataset.indexOf(id);
            if (idIndex !== -1) {
                return true;
            }
        }
        throw new InsightError("Invalid id");
    }
}
