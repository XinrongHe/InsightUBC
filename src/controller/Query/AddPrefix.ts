export default class AddPrefix {

    /**
     * add dataID prefix before return
     */
    public static addIdPrefix(datasetID: string, sortedSections: any, trans: any): any {
        let res: any[] = [];
        sortedSections.forEach((data: any) => {
            let keys = Object.keys(data);
            let values = Object.values(data);
            let result: { [id: string]: any } = {};
            let tranAK = trans.getApplyKeys();
            for (let i = 0; i < keys.length; i++) {
                if (tranAK === undefined) {
                    let replace: string = datasetID + "_" + keys[i].toString();
                    result[replace] = values[i];
                } else if (tranAK.indexOf(keys[i]) === -1) {
                    let replace: string = datasetID + "_" + keys[i].toString();
                    result[replace] = values[i];
                } else {
                    let replace: string = keys[i].toString();
                    result[replace] = values[i];
                }
            }
            res.push(result);
        });
        return res;
    }

}
