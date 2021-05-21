import { InsightError } from "../../IInsightFacade";
import { SComp } from "./SComp";
import { MComp } from "./MComp";

export class FilterComparator {

    public runFilter(filter: object, sections: object[], datasetId: string, datasetKind: string): object[] {
        let retVal = sections.filter((section) => {
            return this.checkConditions(filter, section, datasetId, datasetKind);
        });
        return retVal;
    }

    public checkConditions(filter: any, section: any, datasetId: string, datasetKind: string): boolean {
        let operationArr = Object.keys(filter);
        switch (operationArr[0]) {
            case "NOT":
                return this.not(filter, section, datasetId, datasetKind);
            case "AND":
                return this.and(filter, section, datasetId, datasetKind);
            case "OR":
                return this.or(filter, section, datasetId, datasetKind);
            case "IS":
                const sComp = new SComp();
                return sComp.check(filter, section, datasetId, datasetKind);
            case "LT":
            case "GT":
            case "EQ":
                const mComp = new MComp();
                return mComp.check(filter, section, datasetId, datasetKind, operationArr[0]);
            default:
                throw new InsightError("Invalid operation name");
        }
    }

    // AND OR NOT

    private or(filter: any, section: any, datasetId: string, datasetKind: string) {
        let resultOr = false;
        if (Object.keys(filter.OR).length === 0 || !Array.isArray(filter.OR)) {
            throw new InsightError("Empty OR or not array");
        }
        for (let obj of filter.OR) {
            if (this.checkConditions(obj, section, datasetId, datasetKind) === true) {
                resultOr = true;
            }
        }
        return resultOr;
    }

    private and(filter: any, section: any, datasetId: string, datasetKind: string) {
        let resultAnd = true;
        if (
            Object.keys(filter.AND).length === 0 ||
            !Array.isArray(filter.AND)
        ) {
            throw new InsightError("Empty AND or not array");
        }
        for (let obj of filter.AND) {
            if (this.checkConditions(obj, section, datasetId, datasetKind) === false) {
                resultAnd = false;
            }
        }
        return resultAnd;
    }

    private not(filter: any, section: any, datasetId: string, datasetKind: string) {
        if (
            Object.keys(filter.NOT).length > 1 ||
            Object.keys(filter.NOT).length === 0 ||
            Array.isArray(filter.NOT)
        ) {
            throw new InsightError("Invalid Not");
        }
        return !this.checkConditions(filter.NOT, section, datasetId, datasetKind);
    }
}
