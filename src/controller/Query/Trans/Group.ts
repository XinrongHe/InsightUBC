export default class Group {
    private readonly groupKeys: any[] = [];

    constructor(groupKeys: any[]) {
        this.groupKeys = groupKeys;
    }

    public group(sections: any) {
        let groupData: { [id: string]: any } = [];

        for (let sec of sections) {
            let dataKey: string;
            for (let key of this.groupKeys) {
                if (!dataKey) {
                    dataKey = "_" + sec[key];
                } else {
                    dataKey = dataKey + "," + sec[key];
                }
            }
            if (dataKey) {
                if (!groupData[dataKey]) {
                    groupData[dataKey] = sec;
                } else {
                    let newKeyToPush: any[] = [];
                    let preKey = groupData[dataKey];
                    if (Array.isArray(preKey)) {
                        for (let eachObj of Object.entries(preKey)) {
                            newKeyToPush.push(eachObj[1]);
                        }
                    } else {
                        newKeyToPush.push(preKey);
                    }
                    newKeyToPush.push(sec);
                    groupData[dataKey] = newKeyToPush;
                }
            }
        }
        return groupData;
    }

}
