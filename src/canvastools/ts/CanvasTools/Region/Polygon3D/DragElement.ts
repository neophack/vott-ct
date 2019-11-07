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
        let threePoints=this.regionData.points;
        let xmin = Math.min(threePoints[0].x,threePoints[1].x)
        let xmax = Math.max(threePoints[0].x,threePoints[1].x)
        let ymin = Math.min(threePoints[0].y,threePoints[1].y)
        let ymax = Math.max(threePoints[0].y,threePoints[1].y)
        if (threePoints[2].x>xmax){
            pointsData.push(xmax,ymin);
            pointsData.push(xmin,ymin);
            pointsData.push(xmin,ymax);
            pointsData.push(xmax,ymax);
            pointsData.push(threePoints[2].x,threePoints[2].y);
            pointsData.push(threePoints[2].x,ymin);
        }else if(threePoints[2].x<xmin){
            pointsData.push(xmin,ymin);
            pointsData.push(xmax,ymin);
            pointsData.push(xmax,ymax);
            pointsData.push(xmin,ymax);
            pointsData.push(threePoints[2].x,threePoints[2].y);
            pointsData.push(threePoints[2].x,ymin);
        }else{
            pointsData.push(xmin,ymin);
            pointsData.push(xmin,ymax);
            pointsData.push(xmax,ymax);
            pointsData.push(xmax,ymin);
        }


        this.dragNode = this.paper.polyline(pointsData);
        this.dragNode.addClass("dragRectStyle");

        this.node.add(this.dragNode);

        this.subscribeToDragEvents();
    }

    public redraw() {
        let pointsData = [];
        let threePoints=this.regionData.points;
        let xmin = Math.min(threePoints[0].x,threePoints[1].x)
        let xmax = Math.max(threePoints[0].x,threePoints[1].x)
        let ymin = Math.min(threePoints[0].y,threePoints[1].y)
        let ymax = Math.max(threePoints[0].y,threePoints[1].y)
        if (threePoints[2].x>xmax){
            pointsData.push(xmax,ymin);
            pointsData.push(xmin,ymin);
            pointsData.push(xmin,ymax);
            pointsData.push(xmax,ymax);
            pointsData.push(threePoints[2].x,threePoints[2].y);
            pointsData.push(threePoints[2].x,ymin);
        }else if(threePoints[2].x<xmin){
            pointsData.push(xmin,ymin);
            pointsData.push(xmax,ymin);
            pointsData.push(xmax,ymax);
            pointsData.push(xmin,ymax);
            pointsData.push(threePoints[2].x,threePoints[2].y);
            pointsData.push(threePoints[2].x,ymin);
        }else{
            pointsData.push(xmin,ymin);
            pointsData.push(xmin,ymax);
            pointsData.push(xmax,ymax);
            pointsData.push(xmax,ymin);
        }

        window.requestAnimationFrame(() => {
            this.dragNode.attr({
                points: pointsData.toString()

            });
        });
    }
}