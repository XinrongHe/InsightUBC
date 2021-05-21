import JSZip = require("jszip");
import {
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "../IInsightFacade";
import InsightFacade from "../InsightFacade";
import * as fs from "fs";
import DataSetHelper from "./DataSetHelper";


export default class CourseData extends DataSetHelper {
    private readonly datasetId: string[];
    private kind = InsightDatasetKind.Courses;

    constructor(datasetId: string[]) {
        super();
        this.datasetId = datasetId;
    }

    /**
     * load and add class helper
     */
    public addData(id: string, content: string, insightFacade: InsightFacade): Promise<string[]> {
        return new Promise<any>((resolve, reject) => {
            try {
                if (super.checkIdWhenAdd(id, this.datasetId)) {
                    let courseZip = new JSZip();
                    // const coursesPromise: Array<Promise<any>> = [];
                    let dataToSave: object[] = [];
                    return courseZip.loadAsync(content, { base64: true }).then((zip) => {
                        let fileName: string[] = Object.keys(zip.files);
                        if (this.checkDir(fileName, zip)) {
                            const coursesPromise: Array<Promise<any>> = this.getAndPushSections(zip, dataToSave);
                            return Promise.all(coursesPromise).then(
                                (res) => {
                                    this.checkDataAndReturn(
                                        dataToSave,
                                        reject,
                                        insightFacade,
                                        id,
                                        resolve,
                                    );
                                },
                            );
                        } else {
                            reject(new InsightError("No course folder"));
                        }
                    })
                        .catch(() => {
                            reject(
                                new InsightError("Not a zip file, or corrupted zip"),
                            );
                        });
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    private checkDataAndReturn(
        dataToSave: object[],
        reject: (reason?: any) => void,
        insightFacade: InsightFacade,
        id: string,
        resolve: (value?: PromiseLike<any> | any) => void,
    ) {
        if (dataToSave.length === 0) {
            reject(new InsightError("No sections"));
        } else {
            let data = this.writeToDisk(insightFacade, id, dataToSave);
            insightFacade.addDataToLocalVariableAsACopy(id, data);
            resolve(insightFacade.getDatasetId());
        }
    }

    private writeToDisk(
        insightFacade: InsightFacade,
        id: string,
        dataToSave: object[],
    ) {
        insightFacade.addDatasetId(id);
        let data: any[] = [
            { kind: this.kind },
            { dataToStore: dataToSave },
        ];
        const path = "./data/" + id;
        fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
        return data;
    }

    private getAndPushSections(
        zip: JSZip,
        dataToSave: object[],
    ): Array<Promise<any>> {
        const coursesPromise: Array<Promise<any>> = [];
        const folder = zip.folder("courses"); // get courses folder
        folder.forEach((relativePath, file) => {
            if (relativePath !== ".DS_Store") {
                coursesPromise.push(this.parseSections(file, dataToSave));
            }
        });
        return coursesPromise;
    }

    protected checkDir(fileName: string[], zip: JSZip) {
        return (
            fileName[0].toString() === "courses/" && zip.files[fileName[0]].dir
        );
    }

    /**
     * parse all the sections in course folder
     */
    private parseSections(file: JSZip.JSZipObject, dataToSave: object[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            file.async("text").then((content) => {
                try {
                    const sections = JSON.parse(content).result;
                    for (let section of sections) {
                        let data = {
                            dept: section.Subject.toString(),
                            id: section.Course.toString(),
                            avg: section.Avg,
                            instructor: section.Professor.toString(),
                            title: section.Title.toString(),
                            pass: section.Pass,
                            fail: section.Fail,
                            audit: section.Audit,
                            uuid: section.id.toString(),
                            year:
                                section.Section === "overall"
                                    ? 1900
                                    : Number(section.Year),
                        };
                        dataToSave.push(data);
                    }
                    resolve(dataToSave);
                } catch (error) {
                    resolve(dataToSave);
                }
            });
        });
    }

}
