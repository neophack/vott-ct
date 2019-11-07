import { Rect } from "../../Core/Rect";
import { RegionData } from "../../Core/RegionData";

import { IRegionCallbacks } from "../../Interface/IRegionCallbacks";

import { DragComponent } from "../Component/DragComponent";

import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE;

/*
 * DragElement 
 * Used internally to drag the region
*/
export class DragElement extends DragComponent {
    constructor(paper: Snap.Paper, paperRect: Rect = null, regionData: RegionData, callbacks: IRegionCallbacks) {
        super(paper, paperRect, regionData, callbacks);

        // this.dragNode = paper.rect(this.x, this.y, this.width, this.height);
        let pointsData = [];
        this.regionData.points.forEach(p => {
            pointsData.push(p.x, p.y);
        });

        this.dragNode = this.paper.polyline(pointsData);
        this.dragNode.addClass("dragRectStyle");

        this.node.add(this.dragNode);

        this.subscribeToDragEvents();
    }

    public redraw() {
        let pointsData = [];
        this.regionData.points.forEach(p => {
            pointsData.push(p.x, p.y);
        });
        window.requestAnimationFrame(() => {
            this.dragNode.attr({
                points: pointsData.toString()

            });
        });
    }
}