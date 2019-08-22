import { Point2D } from "../Core/Point2D";
import { Rect } from "../Core/Rect";
import { RegionData } from "../Core/RegionData";

import { IEventDescriptor } from "../Interface/IEventDescriptor";
import { IMovable } from "../Interface/IMovable";
import { ISelectorCallbacks } from "../Interface/ISelectorCallbacks";

import { CrossElement } from "./CrossElement";
import { Selector } from "./Selector";

import * as g from "../CanvasTools.Editor";

import * as SNAPSVG_TYPE from "snapsvg";
import { SSL_OP_NO_TLSv1_1 } from "constants";
declare var Snap: typeof SNAPSVG_TYPE;

export class PointSelector extends Selector {
    private parentNode: SVGSVGElement;

    private crossA: CrossElement;
    private point: Snap.Element;

    private pointRadius: number = 6;
    private isAltKey: boolean = false;

    constructor(parent: SVGSVGElement, paper: Snap.Paper, boundRect: Rect, callbacks?: ISelectorCallbacks) {
        super(paper, boundRect, callbacks);
        this.parentNode = parent;
        this.buildUIElements();
        this.hide();
    }

    public resize(width: number, height: number) {
        super.resize(width, height);
        this.crossA.resize(width, height);
    }

    public hide() {
        super.hide();
        this.crossA.hide();
        this.point.node.setAttribute("visibility", "hidden");
    }

    public show() {
        super.show();
        this.crossA.show();
        this.point.node.setAttribute("visibility", "visible");
    }

    private buildUIElements() {
        this.node = this.paper.g();
        this.node.addClass("pointSelector");

        this.crossA = new CrossElement(this.paper, this.boundRect);
        this.point = this.paper.circle(0, 0, this.pointRadius);
        this.point.addClass("pointStyle");

        this.node.add(this.crossA.node);
        this.node.add(this.point);

        const listeners: IEventDescriptor[] = [
            { event: "pointerenter", listener: this.onPointerEnter, base: this.parentNode, bypass: false },
            { event: "pointerleave", listener: this.onPointerLeave, base: this.parentNode, bypass: false },
            { event: "pointerdown", listener: this.onPointerDown, base: this.parentNode, bypass: false },
            { event: "pointerup", listener: this.onPointerUp, base: this.parentNode, bypass: false },
            { event: "pointermove", listener: this.onPointerMove, base: this.parentNode, bypass: false },
            { event: "keydown", listener: this.onKeyDown, base: window, bypass: false },
            { event: "keyup", listener: this.onKeyUp, base: window, bypass: true },
        ];

        this.subscribeToEvents(listeners);
    }

    private moveCross(cross: CrossElement, p: IMovable, square: boolean = false, refCross: IMovable = null) {

        cross.moveCross(p, this.boundRect, square, refCross);
    }

    private movePoint(point: Snap.Element, crossA: CrossElement) {
        point.attr({
            cx: crossA.x,
            cy: crossA.y,
        });
    }

    private onPointerEnter(e: PointerEvent) {
        window.requestAnimationFrame(() => {
            this.show();
        });
    }

    private onPointerLeave(e: PointerEvent) {
        window.requestAnimationFrame(() => {
            this.hide();
        });
    }

    private onPointerDown(e: PointerEvent) {
        if (!this.isAltKey) {
        window.requestAnimationFrame(() => {
            this.show();
            this.movePoint(this.point, this.crossA);
            if (typeof this.callbacks.onSelectionBegin === "function") {
                this.callbacks.onSelectionBegin();
            }
        });
        }
    }

    private onPointerUp(e: PointerEvent) {
         if (!this.isAltKey) {
        window.requestAnimationFrame(() => {
            if (typeof this.callbacks.onSelectionEnd === "function") {
                this.callbacks.onSelectionEnd(RegionData.BuildPointRegionData(this.crossA.x, this.crossA.y));
            }
        });
         }
    }

    private onPointerMove(e: PointerEvent) {
        window.requestAnimationFrame(() => {
            const rect = this.parentNode.getClientRects();
            // const p = new Point2D(e.clientX - rect[0].left, e.clientY - rect[0].top);
            const p = new Point2D((e.clientX - rect[0].left)/g.factor, (e.clientY - rect[0].top)/g.factor);
            // p.x=p.x/1.5;
            // p.y=p.y/1.5;
            this.show();
            this.moveCross(this.crossA, p);
            this.movePoint(this.point, this.crossA);
        });

        e.preventDefault();
    }

     private onKeyDown(e: KeyboardEvent) {
        if (e.altKey ) {
            this.isAltKey = true;
        }
    }

    private onKeyUp(e: KeyboardEvent) {
        this.isAltKey = false;
    }
}
