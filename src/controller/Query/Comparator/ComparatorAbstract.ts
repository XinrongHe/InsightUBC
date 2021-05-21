import { InsightError } from "../../IInsightFacade";

export abstract class ComparatorAbstract {
    abstract check(
        filter: any,
        section: any,
        datasetId: string,
        datasetKind: string,
        comparator?: string,
    ): boolean;
}
