import { InsightError} from "../IInsightFacade";
import AddPrefix from "./AddPrefix";
import StructureCheck from "./StructureCheck";
import Sort from "./Sort";

export default class Option {
    private readonly options: any;
    private filterSections: any[];
    private sortedSections: any;
    private readonly trans: any;
    private transformation: any;
    private readonly datasetId: string[] = [];
    protected allColumnKeys: string[] = [];
    private retKey: string; // used in down and up sort to keep track of key used

    constructor( options: any, filterSections: any[], trans: any, datasetId: string[], allColumnKeys: string[]) {
        this.options = options;
        this.filterSections = filterSections;
        this.trans = trans;
        this.datasetId = datasetId;
        this.allColumnKeys = allColumnKeys;
    }

    public callSort(transformation: any): any {
        this.transformation = transformation; // can put in constructor
        this.sortedSections = this.getNeededColumnFromData();
        this.sortedSections = this.orderValidData();
        let res = AddPrefix.addIdPrefix(this.datasetId[0], this.sortedSections, this.trans);
        return res;
    }

    // display only Columns needed
    public getNeededColumnFromData(): any {
        let retVal = this.filterSections.map((section: any) => {
            let tmpSection: any = {};
            for (let key of this.allColumnKeys) {
                // check if Column key in trans
                if (this.ifTransformationExist()) {
                    this.checkColKeyIfTransNotEmpty(key);
                }
                if (Object.keys(section).indexOf(key) === -1) {
                    throw new InsightError(
                        "Columns' keys not exist in sections - specially checking for Group",
                    );
                }
                tmpSection[key] = section[key];
            }
            return tmpSection;
        });
        return retVal;
    }

    private ifTransformationExist() {
        return this.transformation && this.transformation.GROUP;
    }

// check Option structure and call order
    public orderValidData(): any {
        const len = Object.keys(this.options).length;
        let countCol: number = 0;
        let countOrd: number = 0;
        let order: any;
        for (let i = 0; i < len; i++) {
            if (Object.keys(this.options)[i] === "COLUMNS") {
                countCol += 1;
            } else if (Object.keys(this.options)[i] === "ORDER") {
                order = Object.values(this.options)[i];
                countOrd += 1;
            } else {
                throw new InsightError("Has extra option field");
            }
        }
        if (countCol !== 1) {
            throw new InsightError("no columns");
        }
        if (countOrd !== 0) {
            if (typeof order === "string") { // ANYKEY
                this.sortedSections = this.normalOrder(order);
            } else if (Object.keys(order).length === 2 && Array.isArray(Object.keys(order))) {  // TODO: debugger check
                // { dir:'  DIRECTION ', keys: [ ' ANYKEY (',' ANYKEY)* ']}
                let ordVal = Object.values(order);
                let dir = ordVal[0];
                let keys = ordVal[1];
                if (!keys) {
                    throw new InsightError("Undefined Key");
                }
                if (dir === "UP") {
                    this.upOrder(keys);
                } else if (dir === "DOWN") {
                    this.downOrder(keys);
                } else {
                    throw new InsightError("Invalid dir");
                }
            } else {
                throw new InsightError("Invalid Order type");
            }
        }
        return this.sortedSections;
    }

    /************ UP AND DOWN ORDER ***********/
    private upOrder (keys: any) {
        if (!Array.isArray(keys)) {
            throw new InsightError("Invalid keys srtuct in sort");
        }
        let k = keys[0];
        StructureCheck.isString(k);
        this.normalOrder(k, "UP");
        k = this.retKey;
        let allPrevUsedKey: any[] = [];
        allPrevUsedKey.push(k);
        for (let i = 1; i < keys.length; i++) {
            let fullKey = keys[i];
            StructureCheck.isString(fullKey);
            let oIdAndKey: any;
            let keyToUsed: string;
            keyToUsed = this.checkAndGetKeyToUsed(fullKey, oIdAndKey);
            this.nestedSortUp(k, keyToUsed, allPrevUsedKey);
            k = keyToUsed;
            allPrevUsedKey.push(k);
        }
    }

    private downOrder (keys: any) {
        if (!Array.isArray(keys)) {
            throw new InsightError("Invalid keys srtuct in sort");
        }
        let k = keys[0]; // TODO: if key is string only
        StructureCheck.isString(k);
        this.normalOrder(k, "DOWN");
        k = this.retKey;
        let allPrevUsedKey: any[] = [];
        allPrevUsedKey.push(k);
        for (let i = 1; i < keys.length; i++) {
            let fullKey = keys[i];
            StructureCheck.isString(fullKey);
            let oIdAndKey: any;
            let keyToUsed: string;
            keyToUsed = this.checkAndGetKeyToUsed(fullKey, oIdAndKey);
            this.nestedSortDown(k, keyToUsed, allPrevUsedKey);
            k = keyToUsed;
            allPrevUsedKey.push(k);
        }
    }

    private checkAndGetKeyToUsed(fullKey: any, oIdAndKey: any) {
        StructureCheck.isString(fullKey);
        if (fullKey.includes("_")) {
            if (fullKey.split("_").length === 2) {
                oIdAndKey = fullKey.split("_");
                this.checkGeneralOrderKeys(oIdAndKey);
                return oIdAndKey[1];
            } else {
                throw new InsightError("invalid fullKey");
            }
        } else {
            this.checkAnyKeys(this.trans, fullKey);
            return fullKey;
        }
    }

    private checkColKeyIfTransNotEmpty(fullKey: any) {
        let colIdAndKey: any;
        StructureCheck.isString(fullKey);
        if (fullKey.includes("_")) {
            if (fullKey.split("_").length === 2) {
                colIdAndKey = fullKey.split("_");
                this.checkColKeys(colIdAndKey[0]);
            } else {
                throw new InsightError("invalid fullKey");
            }
        } else {
            this.checkColKeys(fullKey);
        }
    }

    private checkColKeys(keyInCol: any) {
        let transAllKs = this.trans.getAllKeysInTrans();
        if (!transAllKs) {
            throw new InsightError("Column Key not in Trans when Trans is not Empty: no Trans Key");
        }
        if (!transAllKs.includes(keyInCol)) {
            throw new InsightError("Column Key not in Trans when Trans is not Empty");
        }
        return true;
    }

    private nestedSortUp(k: any, keyToUsed: string, allPrevUsedKey: any[]) {
        return this.sortedSections.sort( // DOWN
            (obj1: any, obj2: any) => {
                let eqCount = this.recursionForCheckEq(allPrevUsedKey, obj1, obj2, 0, keyToUsed);
                if (eqCount === allPrevUsedKey.length) {
                    if (obj1[keyToUsed] > obj2[keyToUsed]) {
                        return 1;
                    }
                    if (obj1[keyToUsed] < obj2[keyToUsed]) {
                        return -1;
                    }
                    return 0;
                }
            },
        );
    }

    private nestedSortDown(k: any, keyToUsed: string, allPrevUsedKey: any[]) {

        return this.sortedSections.sort( // DOWN
            (obj1: any, obj2: any) => {
                let eqCount = this.recursionForCheckEq(allPrevUsedKey, obj1, obj2, 0, keyToUsed);
                if (eqCount === allPrevUsedKey.length) {
                    if (obj1[keyToUsed] < obj2[keyToUsed]) {
                        return 1;
                    }
                    if (obj1[keyToUsed] > obj2[keyToUsed]) {
                        return -1;
                    }
                    return 0;
                }
            },
        );
    }

    private recursionForCheckEq(
        allPrevUsedKey: any[], obj1: any, obj2: any,
        loopCount: number, keyToUsed: string
    ): any {
        if (loopCount >= allPrevUsedKey.length) {
            return loopCount;
        }
        if (obj1[allPrevUsedKey[loopCount]] === obj2[allPrevUsedKey[loopCount]]) {
            let newCount = loopCount + 1;
            return this.recursionForCheckEq(allPrevUsedKey, obj1, obj2, newCount, keyToUsed);
        }
        return 0;
    }

    /*** normal order*/
    private normalOrder(order: string, dir?: any) {
        let oIdAndKey: any;
        StructureCheck.isString(order);
        if (order.includes("_")) {
            if (order.split("_").length === 2) {
                oIdAndKey = order.split("_");
                this.checkGeneralOrderKeys(oIdAndKey);
                this.retKey = oIdAndKey[1];
                if (dir === "DOWN") {
                    return Sort.sortsNorDownByKey(oIdAndKey[1], this.sortedSections);
                } else {
                    return Sort.sortsNorByKey(oIdAndKey[1], this.sortedSections);
                }
            } else {
                throw new InsightError("invalid key");
            }
        } else {
            this.checkAnyKeys(this.trans, order);
            this.retKey = order;
            if (dir === "DOWN") {
                return Sort.sortsNorDownByKey(order, this.sortedSections);
            } else {
                return Sort.sortsNorByKey(order, this.sortedSections);
            }
        }
    }

    private checkGeneralOrderKeys(oIdAndKey: any) {
        if (oIdAndKey.length !== 2) {
            throw new InsightError("invalid string");
        }
        if (oIdAndKey[0] !== this.datasetId[0] || !this.allColumnKeys) {
            throw new InsightError("Invalid Order id");
        }
        if (!this.allColumnKeys.includes(oIdAndKey[1])) {
            throw new InsightError("Order key not in Column");
        }
    }

    private checkAnyKeys(trans: any, orderKey: string) {
        let transAKs = trans.getApplyKeys();
        if (!this.ifTransformationExist()) {
            throw new InsightError("should Not have key contains no _ when no trans");
        }
        if (Array.isArray(transAKs)) {
            if (transAKs.indexOf(orderKey) === -1) {
                throw new InsightError("anyKey in Column not shown in Apply");
            }
        } else if (transAKs.toString() !== orderKey.toString() ||
            !transAKs) {
            throw new InsightError("Invalid key in Column");
        }
    }
}
