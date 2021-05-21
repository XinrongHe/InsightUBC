import JSZip = require("jszip");
import {
    InsightDatasetKind,
    InsightError,
} from "../IInsightFacade";
import InsightFacade from "../InsightFacade";
import Geolocation from "./Geolocation";
import DataSetHelper from "./DataSetHelper";
import * as fs from "fs";
import HTMLHelper from "./HTMLHelper";
const parse5 = require("parse5");

export default class RoomData extends DataSetHelper {
    private readonly datasetId: string[];
    private kind = InsightDatasetKind.Rooms;
    private htmlHelper: HTMLHelper;
    private dataWithBuildInfo: any[] = [];

    constructor(datasetId: string[]) {
        super();
        this.datasetId = datasetId;
        this.htmlHelper = new HTMLHelper();
    }

    public addData(id: string, content: string, insightFacade: InsightFacade): Promise<string[]> {
        return new Promise<any>((resolve, reject) => {
            try {
                if (super.checkIdWhenAdd(id, this.datasetId)) {
                    let roomZip = new JSZip();
                    return roomZip.loadAsync(content, { base64: true }).then((zip) => {
                        let fileName: string[] = Object.keys(zip.files);
                        let dataToSave: object[] = [];
                        if (this.checkDir(fileName, zip)) {
                            const roomsPromise: Array<Promise<any>> = [];
                            const eachBuildingInfo: { [id: string]: any } = {};
                            let htmlBuildingTable: any = [];
                            const folder = zip.folder(fileName[3].toString()); // get courses folder
                            // get All the HTML info
                            folder.forEach((relativePath, file) => {
                                roomsPromise.push(
                                    this.getItems(file, eachBuildingInfo, relativePath)
                                );
                            });
                            roomsPromise.push( roomZip.files["rooms/index.htm"].async("text").then( (index) => {
                                htmlBuildingTable = this.htmlHelper.parseIndex(index, htmlBuildingTable, reject);
                            }).catch(() => {
                                reject(new InsightError("No index.html"));
                            }));

                            return Promise.all(roomsPromise).then( async (res) => {
                                this.modifyAndAddToDisk(htmlBuildingTable, eachBuildingInfo, dataToSave,
                                    reject, insightFacade, id, resolve);
                                },
                            );
                        } else {
                            reject(new InsightError("invalid room zip content"));
                        }
                    }).catch(() => {
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

    private modifyAndAddToDisk(
        htmlBuildingTable: any, eachBuildingInfo: any, dataToSave: object[],
        reject: (reason?: any) => void, insightFacade: InsightFacade, id: string,
        resolve: (value?: (PromiseLike<any> | any)) => void) {
        // begins here
        this.ModifyData(htmlBuildingTable, eachBuildingInfo, dataToSave).then(() => {
            this.checkDataAndReturn(
                dataToSave, reject, insightFacade, id, resolve,
            );
        });
    }

    private getItems(file: JSZip.JSZipObject, eachBuildingInfo: { [p: string]: any }, relativePath: string) {
        return file.async("text").then((html) => {
            eachBuildingInfo[relativePath] = html; // we don't do parse here
        });
    }

    private ModifyData(htmlBuildingTable: any, eachBuildingInfo: any, dataToSave: object[]) {
        for (let building of htmlBuildingTable) {
            let buildingInfos = this.htmlHelper.getTableContent(building, "td");
            let data = {
                fullname: "", shortname: "", number: "", name: "",
                address: "", lat: 0, lon: 0, seats: 0, type: "",
                furniture: "", href: "",
            };
            this.fillInBuildInfo(buildingInfos, data);
            this.dataWithBuildInfo.push(data);

        }
        return this.parseEachRoomInBuild(eachBuildingInfo, dataToSave);
    }

    // ************************************ room methods  ************************************

    private parseEachRoomInBuild(eachBuildingInfo: any, dataToSave: object[]) {
        const promises: Array<Promise<any>> = [];
        this.dataWithBuildInfo.forEach((BuildData: any) => {
            promises.push(
                this.fillInRoomInfo(eachBuildingInfo, BuildData, dataToSave)
            );
        });
        return Promise.all(promises);
    }

    private async fillInRoomInfo(eachBuildingInfo: any, data: any, dataToSave: object[]) {
        return new Promise((resolve) => {
            let path = "./campus/discover/buildings-and-classrooms/";
            let buildingHTML = eachBuildingInfo[data.shortname];
            if (buildingHTML && data.href === path + data.shortname) {
                Geolocation.getGeolocation(data.address).then( async (geo) => {
                    const parsedContent = parse5.parse(buildingHTML);
                    let roomTable = this.htmlHelper.getChildNode(parsedContent, "tbody");
                    let tableContentLen = this.htmlHelper.getTableContent(roomTable, "tr").length;
                    this.fillInEachRoomData(tableContentLen, geo, data, roomTable, dataToSave);
                    resolve();
                });
            }
        });
    }


    private fillInEachRoomData(tableContentLen: number, geo: any, data: any, roomTable: any, dataToSave: object[]) {
        if (tableContentLen !== 0 && !geo.error) {
            data.lon = geo.lon;
            data.lat = geo.lat;
            let rooms = this.htmlHelper.getTableContent(roomTable, "tr");
            for (let room of rooms) {
                let roomInfos = this.htmlHelper.getTableContent(room, "td");
                let temp = {
                    fullname: data.fullname,
                    shortname: data.shortname,
                    number: data.number,
                    name: data.name,
                    address: data.address,
                    lat: data.lat,
                    lon: data.lon,
                    seats: data.seats,
                    type: data.type,
                    furniture: data.furniture,
                    href: data.href,
                };
                for (let roomInfo of roomInfos) {
                    if (roomInfo.attrs) {
                        let value = this.htmlHelper.getAttributeValue(roomInfo.attrs, "class");
                        this.htmlHelper.fillInData(value, temp, roomInfo);
                        // data.name = data.shortname + "_" + data.number;
                    }
                }
                temp.name = temp.shortname + "_" + temp.number;
                dataToSave.push(temp);
            }
        }
    }

    private fillInBuildInfo(buildingInfos: any[], data: any) {
        for ( let buildInfo of buildingInfos) {
            if (buildInfo.attrs) {
                let value = this.htmlHelper.getAttributeValue(buildInfo.attrs, "class");
                this.htmlHelper.fillInData(value, data, buildInfo);
            }
        }
    }

    // ************************************ general method  ************************************

    protected checkDir(fileName: string[], zip: JSZip) {
        if (zip.files[fileName[0]].dir) {
            let dirList = fileName[3].toString().split("/");
            return dirList[0] === "rooms" && dirList[1] === "campus" &&
                dirList[2] === "discover" && dirList[3] === "buildings-and-classrooms" &&
                fileName.includes("rooms/index.htm"); // TODO:need to check only shows up once

        } else {
            return false;
        }
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

}
