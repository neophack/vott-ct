import { Point2D } from "../Core/Point2D";
import { Rect } from "../Core/Rect";
import { RegionData, RegionDataType } from "../Core/RegionData";

import { IEventDescriptor } from "../Interface/IEventDescriptor";
import { IMovable } from "../Interface/IMovable";
import { ISelectorCallbacks } from "../Interface/ISelectorCallbacks";

import { CrossElement } from "./CrossElement";
import { Selector } from "./Selector";

import * as g from "../CanvasTools.Editor";

import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE;

export class PolygonSelector3D extends Selector {
  private parentNode: SVGSVGElement;

  private crossA: CrossElement;
  private nextPoint: Snap.Element;
  private nextL1: Snap.Element;
  private nextLN: Snap.Element;
  private nextSegment: Snap.Element;

  private pointsGroup: Snap.Element;
  private polygon: Snap.Element;

  private points: Point2D[];
  private scalepoints: Point2D[];
  private lastPoint: Point2D;
  private tmplastPoint: Point2D;
  private scalelastPoint: Point2D;

  private pointRadius: number = 3;
  // private allPoints: number = 0;

  private isCapturing: boolean = false;
  private capturePointerId: number;
  private isAltKey: boolean = false;

  constructor(parent: SVGSVGElement, paper: Snap.Paper, boundRect: Rect, callbacks?: ISelectorCallbacks) {
    super(paper, boundRect, callbacks);
    this.parentNode = parent;

    this.buildUIElements();
    this.reset();
    this.hide();
  }

  public resize(width: number, height: number) {
    super.resize(width, height);
    this.crossA.resize(width, height);
    this.scalepoints = [];
    this.points.forEach((p) => {
      this.scalepoints.push(new Point2D(p.x, p.y));
    });
    let pointsStr = "";
    this.scalepoints.forEach((p) => {
      pointsStr += `${p.x},${p.y},`;
    });

    this.polygon.attr({
      points: pointsStr.substr(0, pointsStr.length - 1),
    });
    if (this.lastPoint != null) {
      this.scalelastPoint = new Point2D(this.tmplastPoint.x, this.tmplastPoint.y);
    }
    let ps = this.pointsGroup.children();
    for (var i = 0; i < ps.length; i++) {
      ps[i].attr({
        cx: this.scalepoints[i].x.toString(),
        cy: this.scalepoints[i].y.toString(),
      });

    }
  }

  public hide() {
    super.hide();
    this.crossA.hide();
    this.nextPoint.node.setAttribute("visibility", "hidden");
    this.nextSegment.node.setAttribute("visibility", "hidden");
    this.polygon.node.setAttribute("visibility", "hidden");
    this.pointsGroup.node.setAttribute("visibility", "hidden");
  }

  public show() {
    super.show();
    this.crossA.show();
    this.nextPoint.node.setAttribute("visibility", "visible");
    this.nextSegment.node.setAttribute("visibility", "visible");
    this.polygon.node.setAttribute("visibility", "visible");
    this.pointsGroup.node.setAttribute("visibility", "visible");
  }

  private buildUIElements() {
    this.node = this.paper.g();
    this.node.addClass("polygonSelector");

    this.crossA = new CrossElement(this.paper, this.boundRect);
    this.nextPoint = this.paper.circle(0, 0, this.pointRadius);
    this.nextPoint.addClass("nextPointStyle");

    this.nextSegment = this.paper.g();
    this.nextL1 = this.paper.line(0, 0, 0, 0);
    this.nextLN = this.paper.line(0, 0, 0, 0);
    this.nextL1.addClass("nextSegmentStyle");
    this.nextLN.addClass("nextSegmentStyle");
    this.nextSegment.add(this.nextL1);
    this.nextSegment.add(this.nextLN);

    this.pointsGroup = this.paper.g();
    this.pointsGroup.addClass("polygonGroupStyle");

    this.polygon = this.paper.polygon([]);
    this.polygon.addClass("polygonStyle");

    this.node.add(this.polygon);
    this.node.add(this.pointsGroup);
    this.node.add(this.crossA.node);
    this.node.add(this.nextSegment);
    this.node.add(this.nextPoint);

    const listeners: IEventDescriptor[] = [
      { event: "pointerenter", listener: this.onPointerEnter, base: this.parentNode, bypass: false },
      { event: "pointerleave", listener: this.onPointerLeave, base: this.parentNode, bypass: false },
      { event: "pointerdown", listener: this.onPointerDown, base: this.parentNode, bypass: false },
      { event: "click", listener: this.onClick, base: this.parentNode, bypass: false },
      { event: "pointermove", listener: this.onPointerMove, base: this.parentNode, bypass: false },
      // { event: "dblclick", listener: this.onDoubleClick, base: this.parentNode, bypass: false },
      { event: "keydown", listener: this.onKeyDown, base: window, bypass: false },
      { event: "keyup", listener: this.onKeyUp, base: window, bypass: true },
    ];

    this.subscribeToEvents(listeners);
  }

  private reset() {
    this.points = new Array<Point2D>();
    this.lastPoint = null;
    let ps = this.pointsGroup.children();
    while (ps.length > 0) {
      ps[0].remove();
      ps = this.pointsGroup.children();
    }

    this.polygon.attr({
      points: "",
    });

    if (this.isCapturing) {
      this.isCapturing = false;
    }
  }

  private moveCross(cross: CrossElement, pointTo: IMovable, square: boolean = false, refCross: IMovable = null) {
    cross.moveCross(pointTo, this.boundRect, square, refCross);
  }

  private movePoint(element: Snap.Element, pointTo: Point2D) {
    element.attr({
      cx: pointTo.x,
      cy: pointTo.y,
    });
  }

  private moveLine(element: Snap.Element, pointFrom: Point2D, pointTo: Point2D) {
    element.attr({
      x1: pointFrom.x,
      x2: pointTo.x,
      y1: pointFrom.y,
      y2: pointTo.y,
    });
  }

  private addPoint(x: number, y: number) {
    this.points.push(new Point2D(x , y ));
    this.scalepoints.push(new Point2D(x, y));

    const point = this.paper.circle(x, y, this.pointRadius);
    point.addClass("polygonPointStyle");

    this.pointsGroup.add(point);

    let pointsStr = "";
    this.scalepoints.forEach((p) => {
      pointsStr += `${p.x},${p.y},`;
    });

    this.polygon.attr({
      points: pointsStr.substr(0, pointsStr.length - 1),
    });
  }

  private onPointerEnter(e: PointerEvent) {
    window.requestAnimationFrame(() => {
      this.show();
    });
  }

  private onPointerLeave(e: PointerEvent) {
    if (!this.isCapturing) {
      window.requestAnimationFrame(() => {
        this.hide();
      });
    } else {
      const rect = this.parentNode.getClientRects();
      const p = new Point2D((e.clientX - rect[0].left)/g.factor, (e.clientY - rect[0].top)/g.factor);

      this.moveCross(this.crossA, p);
      this.movePoint(this.nextPoint, p);
    }
  }

  private onPointerDown(e: PointerEvent) {
    if (!this.isAltKey) {
    if (!this.isCapturing) {
      this.isCapturing = true;

      if (typeof this.callbacks.onSelectionBegin === "function") {
        this.callbacks.onSelectionBegin();
      }
    }
    }
  }

  private onClick(e: MouseEvent) {
    if (!this.isAltKey) {
    // console.log(e);
    if (e.detail <= 1) {
      window.requestAnimationFrame(() => {
        const p = new Point2D(this.crossA.x, this.crossA.y);
        // this.allPoints += 1;
       
        this.addPoint(p.x, p.y);
        
        this.lastPoint = p;
        this.tmplastPoint = new Point2D(this.crossA.x , this.crossA.y );
        this.scalelastPoint = null;
         if (this.points.length >= 3) {
         
          this.submitPolyline();
          // this.allPoints = 0;
        }
        
         
      });
    }
    }
  }

  private onPointerMove(e: PointerEvent) {
    window.requestAnimationFrame(() => {
      if (this.points.length != 3) {
        const rect = this.parentNode.getClientRects();
        const p = new Point2D((e.clientX - rect[0].left)/g.factor, (e.clientY - rect[0].top)/g.factor);

        this.show();
        this.moveCross(this.crossA, p);
        this.movePoint(this.nextPoint, p);

        if (this.lastPoint != null) {
          if (this.scalelastPoint != null) {
            this.moveLine(this.nextLN, this.scalelastPoint, p);
          } else {
            this.moveLine(this.nextLN, this.lastPoint, p);
          }
          // this.moveLine(this.nextL1, this.scalepoints[0], p);
        } else {
          this.moveLine(this.nextLN, p, p);
          this.moveLine(this.nextL1, p, p);
        }

      } else {
        const rect = this.parentNode.getClientRects();
        
        let p = new Point2D(this.lastPoint.x, e.clientY - rect[0].top);
        this.show();
        this.moveCross(this.crossA, p);
        this.movePoint(this.nextPoint, p);

        if (this.lastPoint != null) {
          if (this.scalelastPoint != null) {
            p = new Point2D(this.scalelastPoint.x, e.clientY - rect[0].top);
            this.moveLine(this.nextLN, this.scalelastPoint, p);
          } else {
            
            this.moveLine(this.nextLN, this.lastPoint, p);
          }
          this.moveLine(this.nextL1, this.scalepoints[0], p);
        } else {
          this.moveLine(this.nextLN, p, p);
          this.moveLine(this.nextL1, p, p);
        }
      }
    });


    e.preventDefault();
  }



  private submitPolyline() {
    if (typeof this.callbacks.onSelectionEnd === "function") {
      const box = this.polygon.getBBox();

      this.callbacks.onSelectionEnd(new RegionData(box.x, box.y, box.width, box.height,
        this.scalepoints.map((p) => p.copy()), RegionDataType.Polygon3D));
    }
    this.reset();
  }



  public disable() {
    this.reset();
    super.disable();
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
