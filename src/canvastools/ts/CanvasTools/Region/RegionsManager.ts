import { Point2D } from "../Core/Point2D";
import { Rect } from "../Core/Rect";
import { ManipulationFunction, ChangeEventType } from "../Interface/IRegionCallbacks";
import { TagsDescriptor } from "../Core/TagsDescriptor";
import { ITagsUpdateOptions } from "../Interface/ITagsUpdateOptions";
import { RectRegion } from "./Rect/RectRegion";
import { PointRegion } from "./Point/PointRegion";
import { PolygonRegion } from "./Polygon/PolygonRegion";
import { PolygonRegion3D } from "./Polygon3D/PolygonRegion";
import { PolylineRegion } from "./Polyline/PolylineRegion";
import { MenuElement } from "./RegionMenu";
import { RegionData, RegionDataType } from "../Core/RegionData";
import { Region } from "./Region";

import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE;

export class RegionsManager {
    private baseParent: SVGSVGElement;
    private paper: Snap.Paper;
    private paperRect: Rect;

    private regions: Array<Region>;

    private menuLayer: Snap.Element;
    private menu: MenuElement;

    public onManipulationBegin: ManipulationFunction;
    public onManipulationEnd: ManipulationFunction;

    public onRegionSelected: Function;
    public onRegionMove: Function;
    public onRegionDelete: Function;

    private regionManagerLayer: Snap.Element;

    private __isFrozen: boolean = false;

    public get isFrozen(): boolean {
        return this.__isFrozen;
    }

    private frozenNuance: string;

    private tagsUpdateOptions: ITagsUpdateOptions = {
        showRegionBackground: true
    };

    constructor(svgHost: SVGSVGElement, onManipulationBegin: ManipulationFunction, onManipulationEnd: ManipulationFunction) {
        this.baseParent = svgHost;
        this.paper = Snap(svgHost);
        this.paperRect = new Rect(svgHost.width.baseVal.value, svgHost.height.baseVal.value);

        this.regions = new Array<Region>();
        this.onManipulationBegin = onManipulationBegin;
        this.onManipulationEnd = onManipulationEnd;

        this.buildOn(this.paper);
        this.subscribeToEvents();
    }

    private buildOn(paper: Snap.Paper) {
        this.regionManagerLayer = paper.g();
        this.regionManagerLayer.addClass("regionManager");
        
        this.menuLayer = paper.g();
        this.menuLayer.addClass("menuManager");
        this.menu = new MenuElement(paper, this.paperRect, new RegionData(0, 0, 0, 0), {
            onChange: null,
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        });
        
        this.menu.addAction("delete", "trash", (region: Region) => {
            this.deleteRegion(region);
            this.menu.hide();
        })
        this.menuLayer.add(this.menu.menuGroup);
        this.menu.hide();
    }

    private subscribeToEvents() {
        this.regionManagerLayer.mouseover((e: MouseEvent) => {
            this.onManipulationBegin();
        })

        this.regionManagerLayer.mouseout((e: MouseEvent) => {
            this.onManipulationEnd();
        })

        window.addEventListener("keyup", (e) => {
            if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
                if (!this.isFrozen) {
                    switch (e.keyCode) {
                        // tab
                        case 9:
                            this.selectNextRegion();
                            break;

                        // delete, backspace
                        case 46:
                        case 8:
                            this.deleteSelectedRegions();
                            break;
                        // ctrl + up
                        case 38:
                            if (e.ctrlKey) {
                                if (!e.shiftKey && !e.altKey) {
                                    this.moveSelectedRegions(0, -5);
                                } else if (e.shiftKey && !e.altKey) {
                                    this.resizeSelectedRegions(0, -5);
                                } else if (e.altKey && !e.shiftKey) {
                                    this.resizeSelectedRegions(0, -5, true);
                                }
                            }
                            break;
                        // ctrl + down
                        case 40:
                            if (e.ctrlKey) {
                                if (!e.shiftKey && !e.altKey) {
                                    this.moveSelectedRegions(0, 5);
                                } else if (e.shiftKey && !e.altKey) {
                                    this.resizeSelectedRegions(0, 5);
                                } else if (e.altKey && !e.shiftKey) {
                                    this.resizeSelectedRegions(0, 5, true);
                                }
                            }
                            break;
                        // ctrl + left
                        case 37:
                            if (e.ctrlKey) {
                                if (!e.shiftKey && !e.altKey) {
                                    this.moveSelectedRegions(-5, 0);
                                } else if (e.shiftKey && !e.altKey) {
                                    this.resizeSelectedRegions(-5, 0);
                                } else if (e.altKey && !e.shiftKey) {
                                    this.resizeSelectedRegions(-5, 0, true);
                                }
                            }
                            break;
                        // ctrl + right
                        case 39:
                            if (e.ctrlKey) {
                                if (!e.shiftKey && !e.altKey) {
                                    this.moveSelectedRegions(5, 0);
                                } else if (e.shiftKey && !e.altKey) {
                                    this.resizeSelectedRegions(5, 0);
                                } else if (e.altKey && !e.shiftKey) {
                                    this.resizeSelectedRegions(5, 0, true);
                                }
                            }
                            break;
                        // default
                        default: return;
                    }
                    e.preventDefault();
                }
            }
        });
        window.addEventListener("keydown", (e) => {
            if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
                if (!this.isFrozen) {
                    switch (e.code) {
                        // ctrl + A, ctrl + a
                        case "KeyA":
                        case "Numpad1":
                            if (e.ctrlKey) {
                                this.selectAllRegions();
                            }
                            break;
                        // ctrl + B, ctrl + b
                        case "KeyB":
                            if (e.ctrlKey) {
                                this.toggleBackground();
                            }
                            break;
                        // default
                        default: return;
                    }
                    //e.preventDefault(); 
                }
            }
        });
    }

    private registerRegion(region:Region) {
        this.unselectRegions();
        region.select();

        this.regionManagerLayer.add(region.node);
        this.regions.push(region);

        this.menu.showOnRegion(region);
    }

    public addRegion(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        if (regionData.type === RegionDataType.Point) {
            this.addPointRegion(id, regionData, tagsDescriptor);
        } else if (regionData.type === RegionDataType.Polyline) {
            this.addPolylineRegion(id, regionData, tagsDescriptor);
        } else if (regionData.type === RegionDataType.Rect) {
            this.addRectRegion(id, regionData, tagsDescriptor);
        } else if (regionData.type === RegionDataType.Polygon) {
            this.addPolygonRegion(id, regionData, tagsDescriptor);
        } else if (regionData.type === RegionDataType.Polygon3D) {
            this.addPolygonRegion3D(id, regionData, tagsDescriptor);
        }
        this.sortRegionsByArea();
        this.redrawAllRegions();
    }

    // SETUP NEW REGION
    public addRectRegion(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();

        let region = new RectRegion(this.paper, this.paperRect, regionData, id, tagsDescriptor, {
            onChange: this.onRegionChange.bind(this),
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        }, this.tagsUpdateOptions);

        this.registerRegion(region);
    }

    public addPointRegion(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();

        let region = new PointRegion(this.paper, this.paperRect, regionData, id, tagsDescriptor, {
            onChange: this.onRegionChange.bind(this),
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        }, this.tagsUpdateOptions);

        this.registerRegion(region);
    }

    public addPolylineRegion(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();

        let region = new PolylineRegion(this.paper, this.paperRect, regionData, id, tagsDescriptor,{
            onChange: this.onRegionChange.bind(this),
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        }, this.tagsUpdateOptions);

        this.registerRegion(region);
    }

    public addPolygonRegion(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();

        let region = new PolygonRegion(this.paper, this.paperRect, regionData, id, tagsDescriptor,{
            onChange: this.onRegionChange.bind(this),
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        }, this.tagsUpdateOptions);

        this.registerRegion(region);
    }
    public addPolygonRegion3D(id: string, regionData: RegionData, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();

        let region = new PolygonRegion3D(this.paper, this.paperRect, regionData, id, tagsDescriptor,{
            onChange: this.onRegionChange.bind(this),
            onManipulationBegin: this.onManipulationBegin_local.bind(this),
            onManipulationEnd: this.onManipulationEnd_local.bind(this)
        }, this.tagsUpdateOptions);

        this.registerRegion(region);
    }

/*     // REGION CREATION
    public drawRegion(x: number, y: number, rect: Rect, id: string, tagsDescriptor: TagsDescriptor) {
        this.menu.hide();
        let region = new RectRegion(this.paper, this.paperRect, new Point2D(x, y), rect, id, tagsDescriptor,
            this.onManipulationBegin_local.bind(this),
            this.onManipulationEnd_local.bind(this),
            this.tagsUpdateOptions);
        region.area = rect.height * rect.width;
        region.onChange = this.onRegionChange.bind(this);

        region.updateTags(region.tags, this.tagsUpdateOptions);
        this.regionManagerLayer.add(region.node);
        this.regions.push(region);
        // Need to do a check for invalid stacking from user generated or older saved json
        if (this.regions.length > 1) {
            this.sortRegionsByArea();
            this.redrawAllRegions();
        }
        //this.menu.showOnRegion(region);  
    } */

    // REDRAW ALL REGIONS (corrects z-order changes)
    public redrawAllRegions() {
        let sr = this.regions;

        // re-add all elements to DOM based on new order
        window.requestAnimationFrame((e) => {
            this.regions.forEach((region) => {
                let node = region.node.remove();
                this.regionManagerLayer.add(node);
            });
        })
    }

    // QUICKSORT REGIONS BY AREA DESCENDING
    private sortRegionsByArea() {
        function quickSort(arr: Array<Region>, left: number, right: number) {
            var pivot, partitionIndex;

            if (left < right) {
                pivot = right;
                partitionIndex = partition(arr, pivot, left, right);

                //sort left and right
                quickSort(arr, left, partitionIndex - 1);
                quickSort(arr, partitionIndex + 1, right);
            }
            return arr;
        }

        function partition(arr: Array<Region>, pivot: number, left: number, right: number) {
            var pivotValue = arr[pivot].area,
                partitionIndex = left;

            for (var i = left; i < right; i++) {
                if (arr[i].area > pivotValue) {
                    swap(arr, i, partitionIndex);
                    partitionIndex++;
                }
            }
            swap(arr, right, partitionIndex);
            return partitionIndex;
        }

        function swap(arr: Array<Region>, i: number, j: number) {
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        let length = this.regions.length;
        if (length > 1) {
            quickSort(this.regions, 0, this.regions.length - 1);
        }
    }

    // REGIONS LOOKUP
    private lookupRegionByID(id: string): Region {
        let region: Region = null;
        let i = 0;
        while (i < this.regions.length && region == null) {
            if (this.regions[i].ID == id) {
                region = this.regions[i];
            }
            i++
        }

        return region;
    }

    private lookupSelectedRegions(): Array<Region> {
        let collection = Array<Region>();

        for (var i = 0; i < this.regions.length; i++) {
            if (this.regions[i].isSelected) {
                collection.push(this.regions[i]);
            }
        }

        return collection;
    }

    public getSelectedRegionsBounds() {
        let regions = this.lookupSelectedRegions().map((region) => {
            return {
                id: region.ID,
                x: region.x,
                y: region.y,
                width: region.boundRect.width,
                height: region.boundRect.height
            };
        });
        return regions;
    }

    // REGIONS DELETE
    private deleteRegion(region: Region) {
        // remove style
        region.removeStyles();

        // remove element
        region.node.remove();
        this.regions = this.regions.filter((r) => { return r != region });

        if ((typeof this.onRegionDelete) == "function") {
            this.onRegionDelete(region.ID);
        }
    }

    private deleteSelectedRegions() {
        let collection = this.lookupSelectedRegions();
        for (var i = 0; i < collection.length; i++) {
            this.deleteRegion(collection[i]);
        }

        this.menu.hide();
        this.selectNextRegion();
        this.onManipulationEnd();
    }

    public deleteRegionById(id: string) {
        let region = this.lookupRegionByID(id);

        if (region != null) {
            this.deleteRegion(region);
        }
        this.menu.hide();
        this.onManipulationEnd();
    }

    public deleteAllRegions() {
        for (let i = 0; i < this.regions.length; i++) {
            let r = this.regions[i];
            r.removeStyles();
            r.node.remove();
        }
        this.regions = [];
        this.menu.hide();
    }

    // REGIONS TAGS UPDATE
    public updateTagsById(id: string, tagsDescriptor: TagsDescriptor) {
        let region = this.lookupRegionByID(id);

        if (region != null) {
            region.updateTags(tagsDescriptor, this.tagsUpdateOptions);
        }
    }

    public updateTagsForSelectedRegions(tagsDescriptor: TagsDescriptor) {
        let regions = this.lookupSelectedRegions();

        regions.forEach(region => {
            region.updateTags(tagsDescriptor, this.tagsUpdateOptions);
        });
    }

    // REGIONS SELECTION
    private selectRegion(region: Region) {
        if (region != null) {
            this.unselectRegions(region);
            region.select();

            this.menu.showOnRegion(region);
            if ((typeof this.onRegionSelected) == "function") {
                this.onRegionSelected(region.ID);
            }
        }
    }

    private selectAllRegions() {
        let r = null;
        for (let i = 0; i < this.regions.length; i++) {
            let r = this.regions[i];
            r.select();

            if ((typeof this.onRegionSelected) == "function") {
                this.onRegionSelected(r.ID);
            }
        }
        if (r != null) {
            this.menu.showOnRegion(r);
        }
    }

    public selectRegionById(id: string) {
        let region = this.lookupRegionByID(id);
        this.selectRegion(region);
    }

    private selectNextRegion() {
        let region = null;
        let i = 0;
        let length = this.regions.length;

        if (length == 1) {
            region = this.regions[0];
        }
        else if (length > 1) {
            while (i < length && region == null) {
                if (this.regions[i].isSelected) {
                    region = (i == length - 1) ? this.regions[0] : this.regions[i + 1];
                }
                i++
            }
        }

        if (region == null && length > 0) {
            region = this.regions[0];
        }

        this.selectRegion(region);
    }

    // REGIONS MOVE/RESIZE
    private reshapeRegion(region: Region, dx: number, dy: number, dw: number, dh: number, inverse: boolean = false) {
        let w: number;
        let h: number;
        let x: number;
        let y: number;
        if (!inverse) {
            w = region.boundRect.width + Math.abs(dw);
            h = region.boundRect.height + Math.abs(dh);
            x = region.x + dx + (dw > 0 ? 0 : dw);
            y = region.y + dy + (dh > 0 ? 0 : dh);
        } else {
            w = Math.max(0, region.boundRect.width - Math.abs(dw));
            h = Math.max(0, region.boundRect.height - Math.abs(dh));

            x = region.x + dx + (dw < 0 ? 0 : dw);
            y = region.y + dy + (dh < 0 ? 0 : dh);
        }

        let p1 = new Point2D(x, y).boundToRect(this.paperRect);
        let p2 = new Point2D(x + w, y + h).boundToRect(this.paperRect);

        region.move(p1);
        region.resize(p2.x - p1.x, p2.y - p1.y);
    }

    private moveSelectedRegions(dx: number, dy: number) {
        let regions = this.lookupSelectedRegions();
        regions.forEach(r => {
            this.reshapeRegion(r, dx, dy, 0, 0);
        });
        this.menu.showOnRegion(regions[0]);
    }

    private resizeSelectedRegions(dw: number, dh: number, inverse: boolean = false) {
        let regions = this.lookupSelectedRegions();
        regions.forEach(r => {
            this.reshapeRegion(r, 0, 0, dw, dh, inverse);
        });
        this.menu.showOnRegion(regions[0]);
    }

    // MANAGER RESIZE
    public resize(width: number, height: number) {
        let tw = width / this.paperRect.width;
        let th = height / this.paperRect.height;

        this.paperRect.resize(width, height);

        this.menu.hide();

        // recalculate size/position for all regions;
        for (var i = 0; i < this.regions.length; i++) {
            let r = this.regions[i];

            r.move(new Point2D(r.x * tw, r.y * th));
            r.resize(r.boundRect.width * tw, r.boundRect.height * th);
        }
    }

    private onManipulationBegin_local(region: Region) {
        this.onManipulationBegin();
    }
    private onManipulationEnd_local(region: Region) {
        this.onManipulationEnd();
    }


    private justManipulated = false;

    private onRegionChange(region: Region, regionData: RegionData, state: ChangeEventType, multiSelection: boolean = false) {
        // resize or drag begin
        if (state === ChangeEventType.MOVEBEGIN) {
            if (!multiSelection) {
                this.unselectRegions(region);
            }
            this.menu.hide();
            if ((typeof this.onRegionSelected) == "function") {
                this.onRegionSelected(region.ID);
            }
            this.justManipulated = false;
            // resizing or dragging            
        } else if (state === ChangeEventType.MOVING) {
            if ((typeof this.onRegionMove) == "function") {
                this.onRegionMove(region.ID, regionData);
            }
            this.justManipulated = true;
            // resize or drag end
        } else if (state === ChangeEventType.MOVEEND) {
            if (this.justManipulated) {
                region.select();
                this.menu.showOnRegion(region);
                this.sortRegionsByArea();
                this.redrawAllRegions();
            }
        } else if (state === ChangeEventType.SELECTIONTOGGLE && !this.justManipulated) {
            // select
            if (!region.isSelected) {
                if (!multiSelection) {
                    this.unselectRegions(region);
                }
                region.select();
                this.menu.showOnRegion(region);
                if ((typeof this.onRegionSelected) == "function") {
                    this.onRegionSelected(region.ID);
                }
                // unselect
            } else {
                region.unselect();
                this.menu.hide();
                if ((typeof this.onRegionSelected) == "function") {
                    this.onRegionSelected("");
                }
            }
        }
    }

    private unselectRegions(except?: Region) {
        for (var i = 0; i < this.regions.length; i++) {
            let r = this.regions[i];
            if (r != except) {
                r.unselect();
            }
        }
    }

    private toggleBackground() {
        this.tagsUpdateOptions.showRegionBackground = !this.tagsUpdateOptions.showRegionBackground;

        this.regions.forEach((r) => {
            r.updateTags(r.tags, this.tagsUpdateOptions);
        });
    }

    public freeze(nuance?: string) {
        this.regionManagerLayer.addClass("frozen");
        if (nuance !== undefined) {
            this.regionManagerLayer.addClass(nuance);
            this.frozenNuance = nuance;
        } else {
            this.frozenNuance = "";
        }
        this.menu.hide();
        this.regions.forEach((region) => {
            region.freeze();
        })

        this.__isFrozen = true;
    }

    public unfreeze() {
        this.regionManagerLayer.removeClass("frozen");
        if (this.frozenNuance !== "") {
            this.regionManagerLayer.removeClass(this.frozenNuance);
        }

        let selectedRegions = this.lookupSelectedRegions();

        if (selectedRegions.length > 0) {
            this.menu.showOnRegion(selectedRegions[0]);
        }

        this.regions.forEach((region) => {
            region.unfreeze();
        })

        this.__isFrozen = false;
    }

    public toggleFreezeMode() {
        if (this.isFrozen) {
            this.unfreeze();
        } else {
            this.freeze();
        }
    }
}