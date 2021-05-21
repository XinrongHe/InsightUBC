import {InsightError} from "../IInsightFacade";
const parse5 = require("parse5");

export default class HTMLHelper {


    public parseIndex(content: string, htmlBuildingTable: any, reject: (reason?: any) => void) {
        const parsedContent = parse5.parse(content);
        let roomTable = this.getChildNode(parsedContent, "tbody");
        if (this.getTableContent(roomTable, "tr").length !== 0) {
            htmlBuildingTable = this.getTableContent(roomTable, "tr");
        } else {
            reject(new InsightError("index has no table"));
        }
        return htmlBuildingTable;
    }

    public fillInData(value: any, data: any, Info: any) {
        if (value.endsWith("building-code")) {
            data.shortname = this.getChildNodeValue(Info, "#text");
        } else if (value.endsWith("title")) {
            let a = this.getChildNode(Info, "a");
            if (a) {
                data.fullname = this.getChildNodeValue(a, "#text");
                data.href = this.getAttributeValue(a.attrs, "href");
            }
        } else if (value.endsWith("building-address")) {
            data.address = this.getChildNodeValue(Info, "#text");
        } else if (value.endsWith("room-number")) {
            let a = this.getChildNode(Info, "a");
            if (a) {
                data.number = this.getChildNodeValue(a, "#text");
                let roomHref = this.getAttributeValue(a.attrs, "href");
                // let lst = roomHref.split("/");
                // data.name = lst[lst.length - 1].split("-")[0] + "_" + lst[lst.length - 1].split("-")[1];
                data.href = undefined;
                data.href = a.attrs[0].value;
            }

        } else if (value.endsWith("room-capacity")) {
            data.seats = Number(this.getChildNodeValue(Info, "#text"));
        } else if (value.endsWith("room-furniture")) {
            data.furniture = this.getChildNodeValue(Info, "#text");
        } else if (value.endsWith("room-type")) {
            data.type = this.getChildNodeValue(Info, "#text");
        }
    }

    public getAttributeValue(attrs: any, attrName: string) {
        if (attrs) {
            for (let attr of attrs ) {
                if (attr.name === attrName) {
                    return attr.value;
                }
            }
        }
        return "";

    }

    private getChildNodeValue(node: any, nodeName: string) {
        if (node.childNodes) {
            for (const childNode of node.childNodes) {
                if (childNode.nodeName === nodeName) {
                    return  childNode.value.trim();
                }
            }
        }
        return "";
    }

    public getTableContent(roomTable: any, nodeName: string) {
        let rooms: any[] = [];
        if (roomTable) {

            for (let child of roomTable.childNodes) {
                if (child.nodeName === nodeName) {
                    rooms.push(child);
                }
            }
        }
        return rooms;
        // TODO: not sure if I should throw error if no room
    }

    public getChildNode(node: any, nodeName: string): any {
        if (node.nodeName === nodeName) {
            return node;
        }
        if (node.childNodes && node.childNodes.length > 0) {
            for (let child of node.childNodes) {
                let res = this.getChildNode(child, nodeName);
                if (res !== null) {
                    return res;
                }
            }
        }
        return null;
    }
}
