export default class Sort {

    public static sortsNorByKey(oKey: any, sortedSections: any) {
        return sortedSections.sort(
            (obj1: any, obj2: any) => {
                if (obj1[oKey] > obj2[oKey]) {
                    return 1;
                }
                if (obj1[oKey] < obj2[oKey]) {
                    return -1;
                }
                return 0;
            },
        );
    }

    public static sortsNorDownByKey(oKey: any, sortedSections: any) {
        return sortedSections.sort(
            (obj1: any, obj2: any) => {
                if (obj1[oKey] < obj2[oKey]) {
                    return 1;
                }
                if (obj1[oKey] > obj2[oKey]) {
                    return -1;
                }
                return 0;
            },
        );
    }

}
