import { Rect } from "../../Core/Rect";
import { RegionData } from "../../Core/RegionData";
import { TagsDescriptor } from "../../Core/TagsDescriptor";

import { ITagsUpdateOptions } from "../../Interface/ITagsUpdateOptions";

import { TagsComponent } from "../Component/TagsComponent";

import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE;

import * as g from "../../CanvasTools.Editor";
/*
* TagsElement 
* Used internally to draw labels and map colors for the region
*/
export class TagsElement extends TagsComponent {
    public static DEFAULT_PRIMARY_TAG_RADIUS: number = 1;
    public static DEFAULT_SECONDARY_TAG_SIZE: number = 2;
    public static DEFAULT_SECONDARY_TAG_DY: number = 2;

    // Elements
    private primaryTagBoundRect: Snap.Element;
    private primaryTagPolygon: Snap.Element;

    constructor(paper: Snap.Paper, paperRect: Rect, regionData: RegionData, tags: TagsDescriptor, styleId: string, styleSheet: CSSStyleSheet, tagsUpdateOptions?: ITagsUpdateOptions) {
        super(paper, paperRect, regionData, tags, styleId, styleSheet, tagsUpdateOptions);

        this.buildOn(paper, tags);
    }

    private buildOn(paper: Snap.Paper, tags: TagsDescriptor) {
        this.primaryTagNode = paper.g();

        this.primaryTagBoundRect = paper.rect(this.x, this.y, this.boundRect.width, this.boundRect.height);
        this.primaryTagBoundRect.addClass("primaryTagBoundRectStyle");

        let pointsData = [];
        let points = this.regionData.points;
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
        this.primaryTagPolygon = paper.polygon(pointsData);
        this.primaryTagPolygon.addClass("primaryTagPolygonStyle");

        // this.regionData.points.forEach(p => {
        //     pointsData.push(p.x, p.y);
        // });

        this.primaryTagNode.add(this.primaryTagBoundRect);
        this.primaryTagNode.add(this.primaryTagPolygon);

        this.secondaryTagsNode = paper.g();
        this.secondaryTagsNode.addClass("secondatyTagsLayer");
        this.secondaryTags = [];

        this.node.add(this.primaryTagNode);
        this.node.add(this.secondaryTagsNode);

        this.initStyleMaps(tags);
        this.updateTags(tags, this.tagsUpdateOptions);
    }

    protected initStyleMaps(tags: TagsDescriptor) {
        if (tags !== null) {
            this.styleMap = [
                {
                    rule: `.${this.styleId} .primaryTagBoundRectStyle`,
                    style: `fill: transparent;
                           stroke: transparent;`
                },
                {
                    rule: `.regionStyle.selected.${this.styleId} .primaryTagBoundRectStyle`,
                    style: `fill: ${tags.primary.colorAccent};
                           stroke: ${tags.primary.colorDark};`
                },
                {
                    rule: `.${this.styleId}:hover .primaryTagBoundRectStyle`,
                    style: `fill: ${tags.primary.colorShadow};
                           stroke: ${tags.primary.colorAccent};`
                },
                {
                    rule: `.${this.styleId} .primaryTagPolygonStyle`,
                    style: `fill: ${tags.primary.colorShadow};
                            stroke: ${tags.primary.colorPure};`
                },
                {
                    rule: `.${this.styleId}:hover .primaryTagPolygonStyle`,
                    style: `fill: ${tags.primary.colorHighlight};
                            stroke: ${tags.primary.colorPure};`
                },
                {
                    rule: `.regionStyle.selected.${this.styleId} .primaryTagPolygonStyle`,
                    style: `fill: ${tags.primary.colorHighlight};
                            stroke: ${tags.primary.colorPure};`
                },
                {
                    rule: `.regionStyle.${this.styleId} .anchorStyle`,
                    style: `stroke:${tags.primary.colorDark};
                                fill: ${tags.primary.colorPure}`,
                },
                {
                    rule: `.regionStyle.${this.styleId}:hover .anchorStyle`,
                    style: `stroke:#fff;`,
                },
                {
                    rule: `.regionStyle.${this.styleId} .anchorStyle.ghost`,
                    style: `fill:transparent;`,
                },
            ];
    
            this.styleLightMap = [
                {
                    rule: `.${this.styleId} .primaryTagBoundRectStyle`,
                    style: `fill: none;
                           stroke: ${tags.primary.colorDark};`
                },
                {
                    rule: `.regionStyle.selected.${this.styleId} .primaryTagBoundRectStyle`,
                    style: `stroke: ${tags.primary.colorShadow};`
                },
                {
                    rule: `.${this.styleId}:hover .primaryTagBoundRectStyle`,
                    style: `fill: none;
                           stroke: ${tags.primary.colorAccent};`
                },
                {
                    rule: `.${this.styleId} .primaryTagPolygonStyle`,
                    style: `fill: none;
                            stroke: ${tags.primary.colorPure};
                           stroke-width: 0.5px;`
                },
                {
                    rule: `.${this.styleId}:hover .primaryTagPolygonStyle`,
                    style: `fill: ${tags.primary.colorShadow};
                            stroke: ${tags.primary.colorPure};`
                },
                {
                    rule: `.regionStyle.selected.${this.styleId} .primaryTagPolygonStyle`,
                    style: `fill: ${tags.primary.colorShadow};
                            stroke: ${tags.primary.colorPure};`
                },
                {
                    rule: `.regionStyle.${this.styleId} .anchorStyle`,
                    style: `stroke:${tags.primary.colorDark};
                                fill: ${tags.primary.colorPure}`,
                },
                {
                    rule: `.regionStyle.${this.styleId}:hover .anchorStyle`,
                    style: `stroke:#fff;`,
                },
                {
                    rule: `.regionStyle.${this.styleId} .anchorStyle.ghost`,
                    style: `fill:transparent;`,
                },
                {
                    rule: `.regionStyle.${this.styleId} .secondaryTagStyle`,
                    style: `opacity:0.25;`
                }
            ];

            if (tags.secondary !== null && tags.secondary !== undefined) {
                tags.secondary.forEach((tag) => {
                    let rule = {
                        rule: `.secondaryTagStyle.secondaryTag-${tag.name}`,
                        style: `fill: ${tag.colorAccent};`
                    }
        
                    this.styleMap.push(rule);
                    // this.styleLightMap.push(rule);
                })
            }
        }
    }

    protected rebuildTagLabels() {
        // Clear secondary tags -> redraw from scratch
        for (let i = 0; i < this.secondaryTags.length; i++) {
            this.secondaryTags[i].remove();
        }
        this.secondaryTags = [];
        // If there are tags assigned
        if (this.tags) {
            if (this.tags.primary !== undefined) {
                // Primary Tag

            }
            // Secondary Tags
            if (this.tags.secondary && this.tags.secondary.length > 0) {
                let length = this.tags.secondary.length;
                for (let i = 0; i < length; i++) {
                    let stag = this.tags.secondary[i];

                    let s = 2;
                    let x = this.x + this.boundRect.width / 2 + (2 * i - length + 1) * s - s / 2;
                    let y = this.y - s - 1;
                    let tagel = this.paper.rect(x, y, s, s);

                    window.requestAnimationFrame(() => {
                        tagel.addClass("secondaryTagStyle");
                        tagel.addClass(`secondaryTag-${stag.name}`);
                    });

                    this.secondaryTagsNode.add(tagel);
                    this.secondaryTags.push(tagel);
                }
            }
        }
    }

    public redraw() {
        let pointsData = [];
        // let points = this.regionData.points;
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


        let size = 2;
        let cx = this.x + this.width / 2;
        let cy = this.y - size - 1;

        window.requestAnimationFrame(() => {
            this.primaryTagBoundRect.attr({
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
            });

            this.primaryTagPolygon.attr({
                points: pointsData.toString()
            });

            // Secondary Tags
            if (this.secondaryTags && this.secondaryTags.length > 0) {
                let length = this.secondaryTags.length;
                for (let i = 0; i < length; i++) {
                    let stag = this.secondaryTags[i];
                    let x = cx + (2 * i - length + 0.5) * size;

                    stag.attr({
                        x: x,
                        y: cy
                    });
                }
            }
        });
    }
}