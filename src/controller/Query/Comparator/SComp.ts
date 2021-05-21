import { InsightError } from "../../IInsightFacade";
import { ComparatorAbstract } from "./ComparatorAbstract";

export class SComp extends ComparatorAbstract {
    // private sKey = [
    //     "dept", "id", "instructor", "title", "uuid", //PREVIOUS
    //     "fullname", "shortname", "number", "name",
    //     "address", "type", "furniture", "href",
    // ];

    private sCourseKeys = [
        "dept", "id", "instructor", "title", "uuid",
    ];

    private sRoomKeys = [
        "fullname", "shortname", "number", "name",
        "address", "type", "furniture", "href",
    ];

    private sUsedKes: any[] = [];

    public check(filter: any, section: any, datasetId: string, datasetKind: string): boolean {
        let filterKey,
            dataId,
            key: string = "";
        if (Object.keys(filter.IS).length === 1) {
            filterKey = Object.keys(filter.IS)[0];
            this.checkValidKeyStructureWithUnderline(filterKey);
            dataId = filterKey.split("_")[0];
            key = filterKey.split("_")[1];
            // TODO: check key matches the kind
            this.throwErrorIfIdNotMatch(dataId, datasetId);

            // this.checkKey(datasetKind, key);

            const queryValue = Object.values(filter.IS)[0];
            // if (this.sKey.indexOf(key) !== -1) { // TODO: delete comment when this works
            if (this.checkKey(datasetKind, key)) {
                return this.comparesKeyValueWithDisk(section, key, queryValue);
            }
            // else {
            //     throw new InsightError("filter key is not in sKey.");
            // }
        } else {
            throw new InsightError("number of IS key is not one");
        }
        return true;
    }

    private checkKey(datasetKind: string, key: string) {
        if (datasetKind === "rooms") {
            this.sUsedKes = this.sRoomKeys;
        } else if (datasetKind === "courses") {
            this.sUsedKes = this.sCourseKeys;
        }
        if (this.sUsedKes.indexOf(key) === -1) {
            throw new InsightError("filter key is not in sKey, or does not match the data kind");
        }
        return true;
    }

    private comparesKeyValueWithDisk(
        section: any,
        key: string,
        queryValue: any,
    ) {
        const sectionValue = section[key];
        if (
            typeof queryValue === "string" &&
            typeof sectionValue === "string"
        ) {
            return this.checkAsterisk(queryValue, sectionValue);
        } else {
            throw new InsightError("Invalid data type");
        }
    }

    private throwErrorIfIdNotMatch(dataId: string, datasetId: string) {
        if (dataId !== datasetId) {
            throw new InsightError("Invalid: cross different dataset2");
        }
    }

    private checkValidKeyStructureWithUnderline(filterKey: string) {
        let split = filterKey.split("_");
        if (split.length !== 2) {
            throw new InsightError("Invalid key");
        }
    }

    private checkAsterisk(queryValue: any, sectionValue: string): boolean {
        let len = queryValue.length;
        if (len === 0) {
            return false;
        } else if (len === 1) {
            if (queryValue === "*") {
                return sectionValue !== undefined || sectionValue !== "";
            } else {
                return sectionValue === queryValue;
            }
        } else if (len === 2) {
            if (queryValue === "**") {
                return true;
            } else if (queryValue[0] === "*") {
                let res = queryValue.substring(1, 2);
                let retval = sectionValue.substring(
                    sectionValue.length - 1,
                    sectionValue.length,
                );
                return res === retval;
            } else if (queryValue[queryValue.length - 1] === "*") {
                let res = queryValue.substring(0, 1);
                let retVal = sectionValue.substring(0, 1);
                return res === retVal;
            } else {
                return sectionValue === queryValue;
            }
        } else {
            return this.checkAsteriskHelper(queryValue, sectionValue);
        }
    }

    private checkAsteriskHelper(
        queryValue: any,
        sectionValue: string,
    ): boolean {
        let midSub = queryValue.substring(1, queryValue.length - 1);
        if (!midSub.includes("*")) {
            if (queryValue[0] === "*") {
                if (queryValue[queryValue.length - 1] === "*") {
                    return sectionValue.includes(
                        queryValue.substring(1, queryValue.length - 1),
                    );
                } else {
                    let res = queryValue.substring(1, queryValue.length);
                    let resLen = res.length;
                    let queryStartIndex = sectionValue.length - resLen;
                    let retval = sectionValue.substring(
                        queryStartIndex,
                        sectionValue.length,
                    );
                    return res === retval;
                }
            } else if (queryValue[queryValue.length - 1] === "*") {
                let res = queryValue.substring(0, queryValue.length - 1);
                let resLen = res.length;
                let queryEndIndex = resLen;
                let retVal = sectionValue.substring(0, queryEndIndex);
                return res === retVal;
            } else {
                return sectionValue === queryValue;
            }
        } else {
            throw new InsightError("Invalid wildcard placement");
        }
    }
}
