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
    private anchorsLength: number;
    protected buildDragLine() {
      let tmppoints=this.regionData.points;
        let lastpoint=tmppoints.shift();
        let tmpg=this.paper.g();
        // this.tmpg=this.newg;
        // tmpg.addClass("neoLayer");
        // var ind=0;
        tmppoints.forEach((p) => {
            const pointsData = [];
            pointsData.push(lastpoint.x, lastpoint.y);
            pointsData.push(p.x, p.y);
            lastpoint=p;
            
            let tmpNode = this.paper.polyline(pointsData).attr({
                strokeWidth: 20,
                // stroke: '#b0dc9e85'
            });;
            tmpNode.addClass("primaryTagBoundRectStyle");
            this.nodeList.push(tmpNode);
            
            tmpg.add(tmpNode);
           
        });
        this.dragNode=tmpg;
        this.dragNode.addClass("dragRectStyle");

        this.node.add(this.dragNode);
        this.subscribeToDragEvents();

    
    }
    constructor(paper: Snap.Paper, paperRect: Rect = null, regionData: RegionData, callbacks: IRegionCallbacks) {
        super(paper, paperRect, regionData, callbacks);

        this.anchorsLength = regionData.points.length;
        this.buildDragLine();
        
    }
    
    /**
     * Redraws the componnent.
     */
    public redraw() {
      if (this.regionData.points !== null && this.regionData.points.length > 0) {
            let points = this.regionData.points;
            // rebuild anchors
            if (this.anchorsLength !== points.length) {
                window.requestAnimationFrame(() => {
                    this.nodeList.forEach((anchor) => {
                        anchor.remove();
                    });
                    this.nodeList = [];
                    this.dragNode.remove();
                    this.buildDragLine();
                });

                this.anchorsLength = points.length;
            } 

            const strlist=[];
            let tmppoints=this.regionData.points;
            let lastpoint=tmppoints.shift();
            tmppoints.forEach((p) => {
                const pointsData = [];
                pointsData.push(lastpoint.x, lastpoint.y);
                pointsData.push(p.x, p.y);
                lastpoint=p;
                strlist.push(pointsData.toString());
              
            });
    
            this.nodeList.forEach((tmpnode) => {
                tmpnode.attr({
                    points: strlist.pop()
              
                });

            });
           
        }

    }
}