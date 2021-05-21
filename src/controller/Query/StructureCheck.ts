import { InsightError, ResultTooLargeError } from "../IInsightFacade";

export default class StructureCheck {
    /**
     * check for query's main structure, missing where/options or has other fields
     */
    public checkOuterLayer(query: any): boolean {
        const len = Object.keys(query).length;

        if (query === undefined) {
            throw new InsightError("undefined query");
        }
        if (!query.WHERE || typeof query.WHERE !== "object") {
            throw new InsightError("missing WHERE or invalid where type");
        }
        if (!query.OPTIONS) {
            throw new InsightError("missing OPTIONS");
        }

        if (!query.TRANSFORMATIONS) { // check Transformation
            if (len !== 2) {
                throw new InsightError(
                    "has extra field other than where and options",
                );
            }
        } else {
            if (!query.TRANSFORMATIONS.GROUP) {
                throw new InsightError("No Group in trans");
            }
            if (!query.TRANSFORMATIONS.APPLY) {
                throw new InsightError("No Apply in trans");
            }
            if (len !== 3) {
                throw new InsightError(
                    "has extra field other than where and options",
                );
            }

        }
        return true;
    }

    /**
     * check for column structure, missing where/options or has other fields
     */
    public checkColumn(options: any): boolean {
        if (options === undefined || typeof options !== "object") {
            throw new InsightError("Option can't be empty or not object");
        }
        if (!options.COLUMNS) {
            throw new InsightError("missing COLUMNS");
        } else if (
            Object.keys(options.COLUMNS).length < 1 ||
            !Array.isArray(options.COLUMNS)
        ) {
            throw new InsightError("Invalid COLUMNS");
        }
        return true;
    }

    public static checkTransNoExtraField(trans: any) {
        const transLen = Object.keys(trans).length;
        if (transLen !== 2) {
            throw new InsightError("Trans has extra field");
        }
    }

    public static checkApply(trans: any) {
        if (!trans.APPLY || !Array.isArray(trans.APPLY)) {
            throw new InsightError("NO APPLY");
        } else if (trans.APPLY.length === 0) {
            return false;
        } else {
            return true;
        }
    }

    public checkResTooLarge(sections: any[]) {
        if (sections.length > 5000) {
            throw new ResultTooLargeError(
                "query will return more than 5000 results",
            );
        }
    }

    public checkIfIdEmpty(datasetId: string[], reject: (reason?: any) => void) {
        if (datasetId.length === 0) {
            reject(new InsightError("Invalid Column: invalid dataset to load"));
        }
    }

    public static isString (str: any) {
        if (typeof str !== "string" || str === undefined) {
            throw new InsightError("key is not a string in Order");
        }
    }
}
