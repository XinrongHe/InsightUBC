import { InsightError} from "../../IInsightFacade";
import Decimal from "decimal.js";
import Group from "./Group";
import KeyHelper from "./KeyHelper";
import StructureCheck from "../StructureCheck";

export default class Trans {
    private groupKeysWithID: any;
    private groupKeys: any[] = [];
    private applyKey: any;
    private applyKeys: any[] = [];
    private applyRule: any;
    private finalVal: { [id: string]: any } = [];
    private retFinalVal: any[] = [];
    private maxMinVal: number;
    private keyHelper: KeyHelper;
    private allKeysUsed: any[] = [];

    constructor() {
        this.keyHelper = new KeyHelper();
    }

    public getApplyKeys() {
        return this.applyKeys;
    }

    public getAllKeysInTrans() {
        for (let k of this.groupKeys) {
            this.allKeysUsed.push(k);
        }
        for (let k of this.applyKeys) {
            this.allKeysUsed.push(k);
        }
        return this.allKeysUsed;
    }

    public runTrans(trans: any, dsKeys: string[], dsId: string[], colAK: any, tKind: string, secs: any) {
        let applyKeysArray: any;
        if (trans) {
            StructureCheck.checkTransNoExtraField(trans); // below 1. Group by: 得到所有的key *valid key*
            if (Object.keys(trans.GROUP).length !== 0 && Array.isArray(Object.keys(trans.GROUP))) {
                this.groupKeysWithID = Object.values(trans.GROUP); // TODO: checkAnyKey
                this.checkValidKeys(this.groupKeysWithID, dsKeys, dsId, true);
                let groupHelp = new Group(this.groupKeys);
                let groupData = groupHelp.group(secs);
                applyKeysArray = Object.values(trans.APPLY);  // 2. check 所有这个group的 Token，比如Max
                if (StructureCheck.checkApply(trans)) {
                    this.Apply(applyKeysArray, colAK, dsId, groupData, tKind);
                } else {
                    this.emptyApply(groupData);
                    this.putRetValInList();
                }
                return this.retFinalVal;
            } else {
                throw new InsightError("Empty group");
            }
            return this.retFinalVal;
        }
        return secs;
    }

    public emptyApply(groupData: any) {
        let dataForEachGroup: { [id: string]: any } = {};
        let finalKeyVale: string;
        if (Array.isArray(groupData)) {
            for (let data of Object.entries(groupData)) {
                let dataKVPairs = Object.entries(data);
                let secKey = dataKVPairs[0][1].toString();
                let secValue: any = dataKVPairs[1][1];
                if (Array.isArray(secValue)) {  // if it's still a group, then call recursion
                    this.emptyApply(secValue);
                } else if (secKey.startsWith("_")) { // if start with _, then it's a separate group to check,
                    this.emptyApply(secValue);
                } else {
                    finalKeyVale = this.fillFinalVal(secValue);
                    dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, secValue);
                }
            }
        } else {
            finalKeyVale = this.fillFinalVal(groupData);
            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, groupData);
        }
        this.storeGroupedSectionAfterApplyToken(finalKeyVale, dataForEachGroup);
    }

    public Apply(applyKeysArray: any, colAK: any, datasetId: string[], groupD: any, kind: string) {
        for (let app of applyKeysArray) {
            this.applyKey = Object.keys(app);
            this.applyRule = Object.values(app);
            this.keyHelper.checkIfApplyKeysAndRulesValid(this.applyKey, this.applyRule, this.applyKeys);
            this.applyKeys.push(this.applyKey[0]);
            this.checkValidKeys(this.applyKey, colAK, datasetId);
            this.callCheckToken(groupD, datasetId, kind);
        }
        this.putRetValInList();
    }

    public putRetValInList() {
        for (let val of Object.entries(this.finalVal)) {
            this.retFinalVal.push(val[1]); // eachData = val[1]
        }
    }

    private callCheckToken(groupData: any, datasetId: string[], datasetKind: string) {
        this.maxMinVal = undefined;
        for (let data of Object.entries(groupData)) {
            this.checkApplyToken(datasetId, datasetKind, data[1]);
        }
    }

    private checkApplyToken(datasetId: string[], datasetKind: string, eachGroupedData: any) {
        for (let rule of this.applyRule) {
            let APPLYTOKEN = Object.keys(rule).toString();
            if (Object.values(rule).length !== 1) {
                throw new InsightError("ApplyToken has not only 1 key");
            }
            let key = Object.values(rule)[0];
            key = this.keyHelper.slicesKey(key, datasetId);
            switch (APPLYTOKEN) {
                case "MAX": // num
                case "MIN": // num
                    this.keyHelper.checkNKey(datasetKind, key.toString());
                    return this.getSecWithAnyKeyAdded_MaxMin(eachGroupedData, key, APPLYTOKEN);
                case "AVG": // num
                case "SUM": // num
                    this.keyHelper.checkNKey(datasetKind, key.toString());
                    return  this.getSecWithAnyKeyAdded_AvgMax(eachGroupedData, key, APPLYTOKEN);
                case "COUNT": // num / str
                    this.keyHelper.checkKey(datasetKind, key.toString());
                    return  this.getSecWithAnyKeyAdded_Count(eachGroupedData, key, APPLYTOKEN);
                default:
                    throw new InsightError("Invalid rule name");
            }
        }
    }

    private getSecWithAnyKeyAdded_Count(eachGroupedData: any, key: any, token: any) {
        let count: { [id: string]: any } = {};
        let dataForEachGroup: { [id: string]: any } = {};
        let finalKeyVale: string;
        if (Array.isArray(eachGroupedData)) { // loop through grouped sections
            for (let section of Object.entries(eachGroupedData)) {
                let secKeyValue = Object.entries(section);
                let secKey = secKeyValue[0][1].toString();
                let secValue: any = secKeyValue[1][1];
                if (Array.isArray(secValue)) {  // if it's still a group, then call recursion
                    this.getSecWithAnyKeyAdded_AvgMax(secValue, key, token);
                } else if (secKey.startsWith("_")) { // if start with _, then it's a separate group to check,
                    this.getSecWithAnyKeyAdded_AvgMax(secValue, key, token);
                } else {
                    let specKeyValueToCheck: string = secValue[key.toString()];
                    if (!count[specKeyValueToCheck]) {
                        count[specKeyValueToCheck] = 1;
                    } else {
                        count[specKeyValueToCheck] = Number(count[specKeyValueToCheck]) + 1;
                    }
                    finalKeyVale = this.fillFinalVal(secValue);
                    dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, secValue);
                }
            }
            if (count !== undefined) {
                dataForEachGroup[this.applyKey] = Object.keys(count).length;
            }
        } else if (typeof eachGroupedData === "object") {
            finalKeyVale = this.fillFinalVal(eachGroupedData);
            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, eachGroupedData);
            dataForEachGroup[this.applyKey] = 1;
        }
        this.storeGroupedSectionAfterApplyToken(finalKeyVale, dataForEachGroup);
    }

    private getSecWithAnyKeyAdded_AvgMax(eachGroupedData: any, key: any, token: any) {
        let sum: any;
        let count: number = 0;
        let dataForEachGroup: { [id: string]: any } = {};
        let finalKeyVale: string;
        if (Array.isArray(eachGroupedData)) { // loop through grouped sections
            for (let section of Object.entries(eachGroupedData)) {
                let secKeyValue = Object.entries(section);
                let secKey = secKeyValue[0][1].toString();
                let secValue: any = secKeyValue[1][1];
                if (Array.isArray(secValue)) {  // if it's still a group, then call recursion
                    this.getSecWithAnyKeyAdded_AvgMax(secValue, key, token);
                } else if (secKey.startsWith("_")) { // if start with _, then it's a separate group to check
                    this.getSecWithAnyKeyAdded_AvgMax(secValue, key, token);
                } else {
                    let num: any = secValue[key.toString()];
                    if (!sum) {
                        sum = new Decimal(num);
                    } else {
                        num = new Decimal(num);
                        sum = Decimal.add(sum, num);
                    }
                    count++;
                    finalKeyVale = this.fillFinalVal(secValue);
                    dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, secValue);
                }
            }
            if (token === "AVG") {
                let avg = sum.toNumber() / count;
                dataForEachGroup[this.applyKey] = Number(avg.toFixed(2));
            } else if (token === "SUM") {
                dataForEachGroup[this.applyKey] = Number(sum.toFixed(2)); // 2 decimal place
            }
        } else if (typeof eachGroupedData === "object") {
            finalKeyVale = this.fillFinalVal(eachGroupedData);
            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, eachGroupedData);
            dataForEachGroup[this.applyKey] = Number(eachGroupedData[key.toString()].toFixed(2));
        }
        this.storeGroupedSectionAfterApplyToken(finalKeyVale, dataForEachGroup);
    }

    private getSecWithAnyKeyAdded_MaxMin(eachGroupedData: any, key: any, token: any) {
        let value: number;
        let dataForEachGroup: { [id: string]: any } = {};
        let finalKeyVale: string;
        if (Array.isArray(eachGroupedData)) {// loop through grouped sections
            for (let section of Object.entries(eachGroupedData)) {
                let secKeyValue = Object.entries(section);
                let secKey = secKeyValue[0][1].toString();
                let secValue: any = secKeyValue[1][1];
                if (Array.isArray(secValue)) {  // if it's still a group, then call recursion
                    this.getSecWithAnyKeyAdded_MaxMin(secValue, key, token);
                } else if (secKey.startsWith("_")) { // if start with _, then it's a separate group to check
                    this.getSecWithAnyKeyAdded_MaxMin(secValue, key, token);
                } else {
                    let num = Number(secValue[key.toString()]);
                    if (token === "MAX") {
                        if (!value || num >= value) {
                            value = num;
                            finalKeyVale = this.fillFinalVal(secValue);
                            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, secValue);
                        }
                    } else {
                        if (!value || num <= value) {
                            value = num;
                            finalKeyVale = this.fillFinalVal(secValue);
                            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, secValue);
                        }
                    }
                }
            }
            if (value !== undefined) {
                dataForEachGroup[this.applyKey] = value;
            }
        } else if (typeof eachGroupedData === "object") { // If group only has one item
            finalKeyVale = this.fillFinalVal(eachGroupedData);
            dataForEachGroup = this.getDataWithOnlyGroupKeys(finalKeyVale, dataForEachGroup, eachGroupedData);
            dataForEachGroup[this.applyKey] = eachGroupedData[key.toString()];
        }
        this.storeGroupedSectionAfterApplyToken(finalKeyVale, dataForEachGroup);
    }

    private storeGroupedSectionAfterApplyToken(finalKeyVale: string, dataForEachGroup: any) {
        if (finalKeyVale) {
            this.finalVal[finalKeyVale] = dataForEachGroup;
        }
    }

    private newFillInGroupKeysVal(dataWithOnlyGroupKeys: any , section: any) {
        if (Object.keys(dataWithOnlyGroupKeys).length === 0) {
            for (let k of this.groupKeys) {
                dataWithOnlyGroupKeys[k] = section[k.toString()];
            }
        }
    }

    private fillFinalVal (section: any) {
        let finalValKey: string; // I use this to create a unique key for each group
        for (let k of this.groupKeys) {
            if (finalValKey === undefined) {  // TODO: cuole
                finalValKey = section[k.toString()] + ";";
            } else {
                finalValKey += section[k.toString()];
            }
        }
        return finalValKey;
    }

    private getDataWithOnlyGroupKeys(finalValKey: string, dataWithOnlyGroupKeys: any, section: any) {
        if (!this.finalVal[finalValKey.toString()]) {
            this.newFillInGroupKeysVal(dataWithOnlyGroupKeys, section);
        } else {
            dataWithOnlyGroupKeys = this.finalVal[finalValKey.toString()];
        }
        return dataWithOnlyGroupKeys;
    }

    public checkValidKeys(keysToCheck: any, KeysInColumn: string[], datasetId: string[], pushToGroupKeys?: boolean) {
        for (let key of keysToCheck) {
            let k = this.keyHelper.slicesKey(key, datasetId);
            if (pushToGroupKeys) {
                this.groupKeys.push(k);
            }
        }
    }
}
