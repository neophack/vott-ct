import { Rect } from "../../Core/Rect";
import { RegionData } from "../../Core/RegionData";

import { IRegionCallbacks } from "../../Interface/IRegionCallbacks";

import { DragComponent } from "../Component/DragComponent";

/**
 * `DragComponent` for the `PolylineRegion` class.
 */
export class DragElement extends DragComponent {
    /**
     * Creates a new `DragElement`.
     * @param paper - The `Snap.Paper` object to draw on.
     * @param paperRect - The parent bounding box for created component.
     * @param regionData - The `RegionData` object shared across components. Used also for initial setup.
     * @param callbacks - The external callbacks collection.
     */
    constructor(paper: Snap.Paper, paperRect: Rect = null, regionData: RegionData, callbacks: IRegionCallbacks) {
        super(paper, paperRect, regionData, callbacks);

        
        let tmppoints=this.regionData.points;
        let lastpoint=tmppoints.shift();
        let tmpg=paper.g();
        tmpg.addClass("neoLayer");
        // var ind=0;
        tmppoints.forEach((p) => {
            const pointsData = [];
            pointsData.push(lastpoint.x, lastpoint.y);
            pointsData.push(p.x, p.y);
            lastpoint=p;
            
            let tmpNode = paper.polyline(pointsData).attr({
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

    /**
     * Redraws the componnent.
     */
    public redraw() {
 
        const pointsData = [];
        let tmppoints=this.regionData.points;
        let lastpoint=tmppoints.shift();

        const strlist=[];
        tmppoints.forEach((p) => {
            const pointsData = [];
            pointsData.push(lastpoint.x, lastpoint.y);
            pointsData.push(p.x, p.y);
            lastpoint=p;
            strlist.push(pointsData.toString());
           
        });
        window.requestAnimationFrame(() => {
           this.nodeList.forEach((tmpnode) => {
            tmpnode.attr({
                points: strlist.pop()
           
            });
            // this.dragNode=tmpg;
                // this.dragNode.attr({
                //      points: pointsData.toString(),
                //     x: this.x,
                //     y: this.y,
                //     width: this.width,
                //     height: this.height,
                // });
            });
        });
    }
}
