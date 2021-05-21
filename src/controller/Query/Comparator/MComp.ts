import { InsightError } from "../../IInsightFacade";
import { ComparatorAbstract } from "./ComparatorAbstract";

export class MComp extends ComparatorAbstract {
    // private nKey = [
    //     "avg", "pass", "fail", "audit", "year", //PREVIOUS
    //     "lat", "lon", "seats",
    // ];
    private nCourseKeys = [
        "avg", "pass", "fail", "audit", "year",
    ];

    private nRoomKeys = [
        "lat", "lon", "seats",
    ];

    private nUsedKes: any[] = [];

    public check(
        filter: any,
        section: any,
        datasetId: string,
        datasetKind: string,
        comparator: string,
    ): boolean {
        let filterKey,
            dataId,
            key: string = "";

        if (Object.keys(filter[comparator]).length === 1) {
            filterKey = Object.keys(filter[comparator])[0];
            if (filterKey.split("_").length !== 2) {
                throw new InsightError("invalid key");
            }
            dataId = filterKey.split("_")[0];
            key = filterKey.split("_")[1];

            if (dataId !== datasetId) {
                throw new InsightError("Invalid: cross different dataset2");
            }
            // this.checkKey(datasetKind, key);
            const queryValue = Object.values(filter[comparator])[0];

            // if (this.nKey.indexOf(key) !== -1) { // TODO: delete unuse comment
            if (this.checkKey(datasetKind, key)) {
                const sectionValue = section[key];
                if (
                    typeof queryValue === "number" &&
                    typeof sectionValue === "number"
                ) {
                    switch (comparator) {
                        case "GT":
                            return sectionValue > queryValue;
                        case "LT":
                            return sectionValue < queryValue;
                        case "EQ":
                            return sectionValue === queryValue;
                    }
                } else {
                    throw new InsightError("Invalid data type");
                }
            }
            // else {
            //     throw new InsightError("filter key is not in nKey.");
            // }
        } else {
            throw new InsightError("number of filed in filter is not one");
        }
        return true;
    }

    private checkKey(datasetKind: string, key: string) {
        if (datasetKind === "rooms") {
            this.nUsedKes = this.nRoomKeys;
        } else if (datasetKind === "courses") {
            this.nUsedKes = this.nCourseKeys;
        }
        if (this.nUsedKes.indexOf(key) === -1) {
            throw new InsightError("filter key is not in nKey, or does not match the data kind");
        }
        return true;
    }
}
