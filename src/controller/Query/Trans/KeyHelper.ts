import {InsightError} from "../../IInsightFacade";
import DataSetHelper from "../../AddDataSet/DataSetHelper";
import StructureCheck from "../StructureCheck";

export default class KeyHelper {

    private nCourseKeys = ["avg", "pass", "fail", "audit", "year"];

    private nRoomKeys = ["lat", "lon", "seats"];

    private CourseKeys = [
        "avg", "pass", "fail", "audit", "year",
        "dept", "id", "instructor", "title", "uuid",
    ];

    private RoomKeys = [
        "lat", "lon", "seats", "fullname", "shortname", "number", "name",
        "address", "type", "furniture", "href",
    ];

    private nUsedKes: any[] = [];
    private UsedKes: any[] = [];

    public checkNKey(datasetKind: string, key: string) {
        if (datasetKind === "rooms") {
            this.nUsedKes = this.nRoomKeys;
        } else if (datasetKind === "courses") {
            this.nUsedKes = this.nCourseKeys;
        }
        if (this.nUsedKes.indexOf(key) === -1) {
            throw new InsightError("trans key is not in nKey, or does not match the data kind");
        }
        return true;
    }

    public checkKey(datasetKind: string, key: string) {
        if (datasetKind === "rooms") {
            this.UsedKes = this.RoomKeys;
        } else if (datasetKind === "courses") {
            this.UsedKes = this.CourseKeys;
        }
        if (this.UsedKes.indexOf(key) === -1) {
            throw new InsightError("trans key is not in nKey, or does not match the data kind");
        }
        return true;
    }

    public slicesKey(key: any, datasetId: string[]) {
        StructureCheck.isString(key);
        if (key.includes("_")) {
            if (key.split("_").length === 2) {
                let id = key.split("_")[0];
                let k = key.split("_")[1];
                if (id !== datasetId[0]) {
                    throw new InsightError("invalid id in Trans");
                }
                return k;
            } else {
                throw new InsightError("invalid id in Trans");
            }
        } else {
            KeyHelper.checkApplyKeyString(key);
            return key;
        }
    }

    public static checkApplyKeyString(id: string): boolean {
        if (id === null || id === undefined || id === "") {
            throw new InsightError("Key string is empty");
        } else if (id.includes("_")) {
            throw new InsightError("Key string not valid");
        }
        return true;
    }

    // put it under Apply.ts if refactored
    public checkIfApplyKeysAndRulesValid(applyKey: any, applyRule: any, applyKeys: any[]) {
        if (!applyKey || applyKey[0] === "" || !applyKey[0] ||
            typeof applyKey[0] !== "string" || applyKey.length !== 1) {
            throw new InsightError("Invalid applyKey/Rules");
        }
        if (!applyRule) {
            throw new InsightError("Invalid applyRule");
        }
        if (applyKeys.indexOf(applyKey[0]) !== -1) {
            throw new InsightError("Duplicate applyKey");
        }
    }

}
