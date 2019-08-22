import { Rect } from "../../Core/Rect";

import { IEventDescriptor } from "../../Interface/IEventDescriptor";
import { IFreezable } from "../../Interface/IFreezable";
import { IHideable } from "../../Interface/IHideadble";
import { IMovable } from "../../Interface/IMovable";
import { IResizable } from "../../Interface/IResizable";
import { IRegionCallbacks, ChangeEventType } from "../../Interface/IRegionCallbacks";

import * as SNAPSVG_TYPE from "snapsvg";
import { RegionData } from "../../Core/RegionData";
declare var Snap: typeof SNAPSVG_TYPE;

export abstract class RegionComponent implements IHideable, IResizable, IMovable, IFreezable {
    public node: Snap.Element;
    public regionData: RegionData;

    // Manipulation notifiers
    private callbacks: IRegionCallbacks;

    public isVisible: boolean = true;
    public isFrozen: boolean = false;
    public isSelected: boolean = false;

    protected paper: Snap.Paper;
    protected paperRect: Rect;
    
    public get x(): number {
        return this.regionData.x;
    }

    public get y(): number {
        return this.regionData.y;
    }

    public get width(): number {
        return this.regionData.boundRect.width;
    }

    public get height(): number {
        return this.regionData.boundRect.height;
    }

    public get area(): number {
        return this.regionData.area;
    }

    public get boundRect() : Rect {
        return this.regionData.boundRect;
    }

    constructor(paper: Snap.Paper, paperRect: Rect, regionData: RegionData, callbacks: IRegionCallbacks = null) {
        this.paper = paper;
        this.paperRect = paperRect;
        this.regionData = regionData;

        this.callbacks = {
            onChange: null,
            onManipulationBegin: null,
            onManipulationEnd: null
        };

        if (callbacks !== null && callbacks !== undefined) {
            if (callbacks.onManipulationBegin !== undefined) {
                this.callbacks.onManipulationBegin = callbacks.onManipulationBegin;
            }
            if (callbacks.onManipulationEnd !== undefined) {
                this.callbacks.onManipulationEnd = callbacks.onManipulationEnd;
            }
    
            if (callbacks.onChange !== undefined) {
                this.callbacks.onChange = callbacks.onChange;
            }
        }
    }

    public onChange(region: RegionComponent, regionData: RegionData, eventType?: ChangeEventType, multiSelection?: boolean) {
        if (this.callbacks.onChange !== null && this.callbacks.onChange !== undefined) {
            this.callbacks.onChange(region, regionData, eventType, multiSelection);
        }
    };
    public onManipulationBegin(region?: RegionComponent) {
        if (this.callbacks.onManipulationBegin !== null && this.callbacks.onManipulationBegin !== undefined) {
            //let r = (region !== undefined) ? region : this;
            this.callbacks.onManipulationBegin(region);
        }
    };
    
    public onManipulationEnd(region?: RegionComponent) {
        if (this.callbacks.onManipulationEnd !== null && this.callbacks.onManipulationEnd !== undefined) {
            //let r = (region !== undefined) ? region : this;
            this.callbacks.onManipulationEnd(region);
        }
    };

    public hide() {
        this.node.node.setAttribute("visibility", "hidden");
        this.isVisible = false;
    }

    public show() {
        this.node.node.setAttribute("visibility", "visible");
        this.isVisible = true;
    }

    public select() {
        this.isSelected = true;
        this.node.addClass("selected");
    }

    public unselect() {
        this.isSelected = false;
        this.node.removeClass("selected");
    }

    public freeze() {
        this.isFrozen = true;
    }

    public unfreeze() {
        this.isFrozen = false;
    }

    public move(point: IMovable): void;
    public move(x: number, y: number): void;

    public move(arg1: any, arg2?: any): void {
        this.regionData.move(arg1, arg2);
        this.redraw();
    }

    public redraw(): void {
    }

    public resize(width: number, height: number) {
        this.regionData.resize(width, height);
        this.redraw();
    }

    public resizePaper(width: number, height: number) {
        this.paperRect.resize(width, height);
    }

    protected subscribeToEvents(listeners: IEventDescriptor[]) {
        listeners.forEach((e) => {
            e.base.addEventListener(e.event, this.makeFreezable(e.listener.bind(this), e.bypass));
        });
    }

    protected makeFreezable(f: (args: PointerEvent | KeyboardEvent) => void, bypass: boolean = false) {
        return (args: PointerEvent | KeyboardEvent) => {
            if (!this.isFrozen || bypass) {
                f(args);
            }
        };
    }
}
