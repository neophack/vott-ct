
import { FilterPipeline } from "./CanvasTools.Filter";

import { Rect } from "./Core/Rect";
import { RegionData } from "./Core/RegionData";

import { RegionComponent } from "./Region/Component/RegionComponent";
import { RegionsManager } from "./Region/RegionsManager";

import { AreaSelector, SelectionMode } from "./Selection/AreaSelector";

import { ToolbarItemType } from "./Toolbar/ToolbarIcon";
import { Toolbar } from "./Toolbar/Toolbar";

import * as SNAPSVG_TYPE from "snapsvg";
// import  "svg-pan-zoom/dist/svg-pan-zoom.js";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";

// import createPanZoom from 'panzoom';
let panzoom = require('panzoom')

// import * as Selector from "./Selection/Selector";

declare var Snap: typeof SNAPSVG_TYPE;

export var factor: number = 1;



type ToolbarIconDescription = {
    type: ToolbarItemType.SELECTOR | ToolbarItemType.SWITCH,
    action: string,
    iconFile: string,
    tooltip: string,
    keycode: string,
    actionCallback: (action: string, rm: RegionsManager, sl: AreaSelector, tf) => void,
    width?: number,
    height?: number,
    activate: boolean
} | {
    type: ToolbarItemType.SEPARATOR,
}



export class Editor {
    private static SVGDefsTemplate = `
        <defs>
            <filter id="black-glow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="0" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.8" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>`;

    private toolbar: Toolbar;
    private regionsManager: RegionsManager;
    private areaSelector: AreaSelector;
    private filterPipeline: FilterPipeline;

    private editorSVG: SVGSVGElement;
    private contentCanvas: HTMLCanvasElement;
    private embedSVG: HTMLEmbedElement;

    private editorDiv: HTMLDivElement;

    private isRMFrozen: boolean = false;

    public autoResize: boolean = true;

    private sourceWidth: number;
    private sourceHeight: number;

    private frameWidth: number;
    private frameHeight: number;

    private zoomposx: number;
    private zoomposy: number;

    private inithpadding = 0;
    private initvpadding = 0;

    // private panzoom: createPanZoom;


    // private lastfactor: number = 1;

    constructor(editorZone: HTMLDivElement) {
        // Create SVG Element
        this.contentCanvas = this.createCanvasElement();
        this.editorSVG = this.createSVGElement();
        this.embedSVG = this.createEmbedElement();

        this.editorDiv = editorZone;

        this.editorDiv.classList.add("CanvasToolsEditor");
        this.editorDiv.append(this.contentCanvas);
        // this.embedSVG.append(this.editorSVG);
        this.editorDiv.append(this.editorSVG);
        var area = document.querySelector('.CanvasToolsEditor') as HTMLElement;
        var instance = panzoom(area, {
            beforeWheel: function(e) {
                // allow wheel-zoom only if altKey is down. Otherwise - ignore
                var shouldIgnore = !e.altKey;
                return shouldIgnore;
            },
            filterKey: function(/* e, dx, dy, dz */) {
                // don't let panzoom handle this event:
                return true;
            },
            zoomDoubleClickSpeed: 1, 
            onDoubleClick: function(e) {
                // `e` - is current double click event.

                return false; // tells the library to not preventDefault, and not stop propagation
            }
        });
        instance.on('zoom', function(e) {
            factor=instance.getTransform().scale;
            // console.log('Fired when `element` is zoomed', e,factor);
            var rects = document.querySelectorAll('.primaryTagRectStyle') as NodeListOf<SVGSVGElement>;
            rects.forEach((item) => {item.style['stroke-width']=(2/factor);});
            var ploygons = document.querySelectorAll('.primaryTagPolygonStyle') as NodeListOf<SVGSVGElement>;
            ploygons.forEach((item) => {item.style['stroke-width']=(2/factor);});
            var ploylines = document.querySelectorAll('.primaryTagPolylineStyle') as NodeListOf<SVGSVGElement>;
            ploylines.forEach((item) => {item.style['stroke-width']=(2/factor);});
            var circles = document.querySelectorAll('.anchorStyle') as NodeListOf<SVGSVGElement>;
            circles.forEach((item) => {item.style['r']=(5/factor);item.style['stroke-width']=(2/factor);});
            var circles2 = document.querySelectorAll('.nextPointStyle') as NodeListOf<SVGSVGElement>;
            circles2.forEach((item) => {item.style['r']=(5/factor);item.style['stroke-width']=(2/factor);});
            var crosslines = document.querySelectorAll('.crossStyle') as NodeListOf<SVGSVGElement>;
            crosslines.forEach((item) => {item.style['stroke-width']=(2/factor);});
            var circles3 = document.querySelectorAll('.dragPointStyle') as NodeListOf<SVGSVGElement>;
            circles3.forEach((item) => {item.style['r']=(5/factor);item.style['stroke-width']=(2/factor);});
            var circles3 = document.querySelectorAll('.pointStyle') as NodeListOf<SVGSVGElement>;
            circles3.forEach((item) => {item.style['r']=(5/factor);item.style['stroke-width']=(2/factor);});
            
            
        });
        instance.pause(); 
        // this.panzoom.getTransform();

        // automatically resize internals on window resize
        window.addEventListener("resize", (e) => {
            if (this.autoResize) {
                this.resize(this.editorDiv.offsetWidth, this.editorDiv.offsetHeight);
            }
        });
        window.addEventListener("keydown", (e) => {
            if (e.altKey) {
                // console.log(e);
                this.regionsManager.freeze();
                instance.resume(); 
                // this.areaSelector.setSelectionMode(SelectionMode.NONE);
                }
            if (e.keyCode==90) {//keyZ
                // console.log(e,instance.getTransform());
                // let t=instance.getTransform();
                
                instance.zoomAbs(0,0,1); 
                instance.moveTo(0,0);
             }
        });
        window.addEventListener("keyup", (e) => {
            instance.pause(); 
            this.regionsManager.unfreeze();
            if (e.keyCode==90) {//keyZ
                // console.log(e,instance.getTransform());
                // let t=instance.getTransform();
                
                instance.zoomAbs(0,0,1); 
                instance.moveTo(0,0);
           }
                
        });
        // window.addEventListener("mousedown", (e) => {
            
        //     if (e.altKey) {
        //         console.log(e);
                
        //     }
        // });

        // window.addEventListener("wheel", (e) => {
        //     // console.log(this.panzoom.getTransform());
        //     console.log(instance.getTransform());
        //     factor=instance.getTransform().scale;
        //     if (e.altKey) {
                
                
        //         // factor -= e.deltaY / 1000.;
        //         // if (factor < 0.3) {
        //         //     factor = 0.3;
        //         // }
        //         // if (factor > 7) {
        //         //     factor = 7;
        //         // }
        //         // this.zoomposx = e.pageX;
        //         // this.zoomposy = e.pageY;
        //         // this.zoom(this.editorDiv.offsetWidth, this.editorDiv.offsetHeight);

        //     }
        //     // console.log(e);

        // }, false);

        this.regionsManager = new RegionsManager(this.editorSVG,
            (region?: RegionComponent) => {
                this.areaSelector.hide();
                this.onRegionManipulationBegin(region);
            },
            (region?: RegionComponent) => {
                this.areaSelector.show();
                this.onRegionManipulationEnd(region);
            });

        this.regionsManager.onRegionSelected = (id: string, multiselection: boolean) => {
            this.onRegionSelected(id, multiselection);
        };

        this.regionsManager.onRegionMove = (id: string, regionData: RegionData) => {
            this.onRegionMove(id, regionData);
        };

        this.regionsManager.onRegionDelete = (id: string) => {
            this.onRegionDelete(id);
        };

        this.areaSelector = new AreaSelector(this.editorSVG,
            {
                onSelectionBegin: () => {
                    this.isRMFrozen = this.regionsManager.isFrozen;
                    this.regionsManager.freeze();

                    this.onSelectionBegin();
                },
                onSelectionEnd: (regionData: RegionData) => {
                    if (!this.isRMFrozen) {
                        this.regionsManager.unfreeze();
                    }

                    this.onSelectionEnd(regionData);
                }
            });

        this.filterPipeline = new FilterPipeline();

        this.resize(editorZone.offsetWidth, editorZone.offsetHeight);

    }

    

    private createSVGElement(): SVGSVGElement {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.innerHTML = Editor.SVGDefsTemplate;
        svg.id = "svg";
        return svg;
    }

    private createCanvasElement(): HTMLCanvasElement {
        let canvas = document.createElement("canvas");
        return canvas;
    }

    private createEmbedElement(): HTMLEmbedElement {
        let embed = document.createElement("embed");
        return embed;
    }

    public onRegionManipulationBegin(region?: RegionComponent): void {
        // do something
    }

    public onRegionManipulationEnd(region?: RegionComponent): void {
        // do something
    }

    public onRegionSelected(id: string, multiselection: boolean) {
        // do something
    }

    public onRegionMove(id: string, regionData: RegionData) {
        // do something
    }

    public onRegionDelete(id: string) {
        // do something
    }

    public onSelectionBegin(): void {
        // do something
    }

    public onSelectionEnd(commit): void {
        // do something          
    }

    private onKeyUp(e: KeyboardEvent) {
        // Holding shift key enable square drawing mode
        if (e.code === "keyK") {
            console.log('keytest');
        }
    }


    public static FullToolbarSet: Array<ToolbarIconDescription> = [
        {
            type: ToolbarItemType.SELECTOR,
            action: "none-select",
            iconFile: "none-selection.svg",
            tooltip: "区域操作 (X)",
            keycode: 'KeyX',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.NONE);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SEPARATOR
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "point-select",
            iconFile: "point-selection.svg",
            tooltip: "画点 (P)",
            keycode: 'KeyP',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.POINT);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "rect-select",
            iconFile: "rect-selection.svg",
            tooltip: "画矩形框 (R)",
            keycode: 'KeyR',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.RECT);
            },
            activate: true
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "copy-select",
            iconFile: "copy-t-selection.svg",
            tooltip: "模板框 (T)",
            keycode: 'KeyT',
            actionCallback: (action, rm, sl) => {
                let rs = rm.getSelectedRegionsBounds();
                if (rs !== undefined && rs.length > 0) {
                    let r = rs[0];
                    sl.setSelectionMode(SelectionMode.COPYRECT, { template: new Rect(r.width, r.height) });
                } else {
                    sl.setSelectionMode(SelectionMode.COPYRECT, { template: new Rect(40, 40) });
                }
            },
            activate: false
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "polyline-select",
            iconFile: "polyline-selection.svg",
            tooltip: "画多线段 (A)",
            keycode: 'KeyA',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.POLYLINE);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "polygon-select",
            iconFile: "polygon-selection.svg",
            tooltip: "画多边形 (D)",
            keycode: 'KeyD',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.POLYGON);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "polygon3D-select",
            iconFile: "polygon3d-selection.svg",
            tooltip: "画3D多边形 (Y)",
            keycode: 'KeyY',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.POLYGON3D);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SEPARATOR
        },
        {
            type: ToolbarItemType.SWITCH,
            action: "selection-lock",
            iconFile: "selection-lock.svg",
            tooltip: "锁定解锁区域 (L)",
            keycode: 'KeyL',
            actionCallback: (action, rm, sl) => {
                rm.toggleFreezeMode();
            },
            activate: false
        },
        {
            type: ToolbarItemType.SEPARATOR
        },
        // {
        //     type: ToolbarItemType.SWITCH,
        //     action: "zoom-in",
        //     iconFile: "none-zoomin.svg",
        //     tooltip: "放大 (F))",
        //     keycode: 'KeyF',
        //     actionCallback: (action, rm, sl, ft) => {
        //         // factor += 0.1;
        //         // // if (factor < 0.3) {
        //         // //     factor = 0.3;
        //         // // }
        //         // if (factor > 7) {
        //         //     factor = 7;
        //         // }
        //         // ft.zoom(ft.editorDiv.offsetWidth, ft.editorDiv.offsetHeight);
        //     },
        //     activate: false
        // },
        // {
        //     type: ToolbarItemType.SWITCH,
        //     action: "zoom-out",
        //     iconFile: "none-zoomout.svg",
        //     tooltip: "缩小 (G)",
        //     keycode: 'KeyG',
        //     actionCallback: (action, rm, sl, ft) => {
        //     //     factor -= 0.1;
        //     //     if (factor < 0.3) {
        //     //         factor = 0.3;
        //     //     }
        //     //     // if (factor > 4) {
        //     //     //     factor = 4;
        //     //     // }
        //     //     ft.zoom(ft.editorDiv.offsetWidth, ft.editorDiv.offsetHeight);
        //     },
        //     activate: false
        // },
        // {
        //     type: ToolbarItemType.SWITCH,
        //     action: "zoom-reset",
        //     iconFile: "none-zoomreset.svg",
        //     tooltip: "复位大小 (V)",
        //     keycode: 'KeyV',
        //     actionCallback: (action, rm, sl, ft) => {
        //         ft.resize(ft.editorDiv.offsetWidth, ft.editorDiv.offsetHeight);
        //         ft.resize(ft.editorDiv.offsetWidth, ft.editorDiv.offsetHeight);
        //     },
        //     activate: false
        // },
    ];

    public static RectToolbarSet: Array<ToolbarIconDescription> = [
        {
            type: ToolbarItemType.SELECTOR,
            action: "none-select",
            iconFile: "none-selection.svg",
            tooltip: "Regions Manipulation (X)",
            keycode: 'KeyX',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.NONE);
            },
            activate: false
        },
        {
            type: ToolbarItemType.SEPARATOR
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "rect-select",
            iconFile: "rect-selection.svg",
            tooltip: "Rectangular box (R)",
            keycode: 'KeyR',
            actionCallback: (action, rm, sl) => {
                sl.setSelectionMode(SelectionMode.RECT);
            },
            activate: true
        },
        {
            type: ToolbarItemType.SELECTOR,
            action: "copy-select",
            iconFile: "copy-t-selection.svg",
            tooltip: "Template-based box (T)",
            keycode: 'KeyT',
            actionCallback: (action, rm, sl) => {
                let rs = rm.getSelectedRegionsBounds();
                if (rs !== undefined && rs.length > 0) {
                    let r = rs[0];
                    sl.setSelectionMode(SelectionMode.COPYRECT, { template: new Rect(r.width, r.height) });
                } else {
                    sl.setSelectionMode(SelectionMode.COPYRECT, { template: new Rect(40, 40) });
                }
            },
            activate: false
        },
        {
            type: ToolbarItemType.SEPARATOR
        },
        {
            type: ToolbarItemType.SWITCH,
            action: "selection-lock",
            iconFile: "selection-lock.svg",
            tooltip: "Lock/unlock regions (L)",
            keycode: 'KeyL',
            actionCallback: (action, rm, sl) => {
                rm.toggleFreezeMode();
            },
            activate: false
        }

    ];

    public addToolbar(toolbarZone: HTMLDivElement, toolbarSet: Array<ToolbarIconDescription>, iconsPath: string) {
        let svg = this.createSVGElement();
        toolbarZone.append(svg);

        this.toolbar = new Toolbar(svg);

        if (toolbarSet === null) {
            toolbarSet = Editor.FullToolbarSet;
        }

        let activeSelector: string;
        toolbarSet.forEach((item) => {
            if (item.type == ToolbarItemType.SEPARATOR) {
                this.toolbar.addSeparator();
            } else if (item.type == ToolbarItemType.SELECTOR) {
                this.toolbar.addSelector({
                    action: item.action,
                    iconUrl: iconsPath + item.iconFile,
                    tooltip: item.tooltip,
                    keycode: item.keycode,
                    width: item.width,
                    height: item.height
                }, (action) => {
                    item.actionCallback(action, this.regionsManager, this.areaSelector, this);
                })

                if (item.activate) {
                    activeSelector = item.action;
                }
            } else if (item.type == ToolbarItemType.SWITCH) {
                this.toolbar.addSwitch({
                    action: item.action,
                    iconUrl: iconsPath + item.iconFile,
                    tooltip: item.tooltip,
                    keycode: item.keycode,
                    width: item.width,
                    height: item.height
                }, (action) => {
                    item.actionCallback(action, this.regionsManager, this.areaSelector, this);
                })

                this.toolbar.setSwitch(item.action, item.activate);
            }


        })

        this.toolbar.select(activeSelector);
    }

    public async addContentSource(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): Promise<void> {
        let buffCnvs = document.createElement("canvas");
        let context = buffCnvs.getContext("2d");

        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            this.sourceWidth = source.width;
            this.sourceHeight = source.height;
        } else if (source instanceof HTMLVideoElement) {
            this.sourceWidth = source.videoWidth;
            this.sourceHeight = source.videoHeight;
        }

        buffCnvs.width = this.sourceWidth;
        buffCnvs.height = this.sourceHeight;

        context.drawImage(source, 0, 0, buffCnvs.width, buffCnvs.height);
        this.areaSelector.show();

        return this.filterPipeline.applyToCanvas(buffCnvs).then((bcnvs) => {
            // Copy buffer to the canvas on screen
            this.contentCanvas.width = bcnvs.width;
            this.contentCanvas.height = bcnvs.height;
            let imgContext = this.contentCanvas.getContext("2d");
            imgContext.drawImage(bcnvs, 0, 0, bcnvs.width, bcnvs.height);
        }).then(() => {
            // resize the editor size to adjust to the new content size
            this.resize(this.editorDiv.offsetWidth, this.editorDiv.offsetHeight);
        });
    }

    public zoom(containerWidth: number, containerHeight: number) {

        this.frameWidth = containerWidth;
        this.frameHeight = containerHeight;

        let imgRatio = this.contentCanvas.width / this.contentCanvas.height;
        let containerRatio = containerWidth / containerHeight;

        // let hpadding = 0;
        // let vpadding = 0;

        if (imgRatio > containerRatio) {
            // vpadding = (containerHeight - containerWidth / imgRatio) / 2;

            // this.editorDiv.style.height = `calc(100 * ${factor}% - ${this.initvpadding * factor * 2}px)`;
            // this.editorDiv.style.width = `calc(100 * ${factor}%)`;
        } else {
            // hpadding = (containerWidth - containerHeight * imgRatio) / 2;
            // this.editorDiv.style.height = `calc(100 * ${factor}%)`;
            // this.editorDiv.style.width = `calc(100 * ${factor}% - ${this.inithpadding * factor * 2}px)`;
        }

        // this.editorDiv.style.padding = `${this.initvpadding * factor}px ${this.inithpadding * factor}px`;
        // this.editorDiv.style.position = 'relative';
        // if (this.editorDiv.style.left) {
        //     this.editorDiv.style.left = `calc(${this.editorDiv.style.left} + ${(-this.zoomposx * (factor - this.lastfactor)).toString() + 'px'})`;
        //     this.editorDiv.style.top = `calc(${this.editorDiv.style.top} + ${(-this.zoomposy * (factor - this.lastfactor)).toString() + 'px'})`;
        // } else {
        //     this.editorDiv.style.left = (-this.zoomposx * (factor - this.lastfactor)).toString() + 'px';
        //     this.editorDiv.style.top = (-this.zoomposy * (factor - this.lastfactor)).toString() + 'px';
        // }

        // this.lastfactor = factor;

        this.frameWidth = this.editorSVG.clientWidth;
        this.frameHeight = this.editorSVG.clientHeight;

        this.areaSelector.resize(this.frameWidth, this.frameHeight);
        this.regionsManager.resize(this.frameWidth, this.frameHeight);
    }

    public resize(containerWidth: number, containerHeight: number) {
        this.frameWidth = containerWidth;
        this.frameHeight = containerHeight;

        let imgRatio = this.contentCanvas.width / this.contentCanvas.height;
        let containerRatio = containerWidth / containerHeight;

        let hpadding = 0;
        let vpadding = 0;

        // this.editorDiv.style.left = '';
        // this.editorDiv.style.top = '';

        if (imgRatio > containerRatio) {
            vpadding = (containerHeight - containerWidth / imgRatio) / 2;
            this.editorDiv.style.height = `calc(100% - ${vpadding * 2}px)`;
            this.editorDiv.style.width = "";
        } else {
            hpadding = (containerWidth - containerHeight * imgRatio) / 2;
            this.editorDiv.style.height = "";
            this.editorDiv.style.width = `calc(100% - ${hpadding * 2}px)`;
        }

        this.editorDiv.style.padding = `${vpadding}px ${hpadding}px`;

        // factor = 1;
        // this.lastfactor = 1;
        this.initvpadding = vpadding;
        this.inithpadding = hpadding;


        this.frameWidth = this.editorSVG.clientWidth;
        this.frameHeight = this.editorSVG.clientHeight;

        this.areaSelector.resize(this.frameWidth, this.frameHeight);
        this.regionsManager.resize(this.frameWidth, this.frameHeight);
    }

    public get RM(): RegionsManager {
        return this.regionsManager;
    }

    public get FilterPipeline(): FilterPipeline {
        return this.filterPipeline;
    }

    public scaleRegionToSourceSize(regionData: RegionData, sourceWidth?: number, sourceHeight?: number): RegionData {
        let sw = (sourceWidth !== undefined) ? sourceWidth : this.sourceWidth;
        let sh = (sourceHeight !== undefined) ? sourceHeight : this.sourceHeight;

        let xf = sw / this.frameWidth;
        let yf = sh / this.frameHeight;

        let rd = regionData.copy();
        rd.scale(xf, yf);
        return rd;
    }

    public scaleRegionToFrameSize(regionData: RegionData, sourceWidth?: number, sourceHeight?: number): RegionData {
        let sw = (sourceWidth !== undefined) ? sourceWidth : this.sourceWidth;
        let sh = (sourceHeight !== undefined) ? sourceHeight : this.sourceHeight;

        let xf = this.frameWidth / sw;
        let yf = this.frameHeight / sh;

        let rd = regionData.copy();
        rd.scale(xf, yf);
        return rd;
    }
}