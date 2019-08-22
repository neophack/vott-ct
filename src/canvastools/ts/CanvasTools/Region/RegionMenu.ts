import { Rect } from "../Core/Rect";
import { RegionData } from "../Core/RegionData";

import { IMovable } from "../Interface/IMovable";
import { IRegionCallbacks } from "../Interface/IRegionCallbacks";

import { RegionComponent } from "./Component/RegionComponent";

import * as SNAPSVG_TYPE from "snapsvg";
declare var Snap: typeof SNAPSVG_TYPE;

/* MenuElement
 * Used internally to show actions menu for the region
*/
export class MenuElement extends RegionComponent {
    public static PathCollection = {
        delete: {
            iconSize: 96,
            path: "M 83.4 21.1 L 74.9 12.6 L 48 39.5 L 21.1 12.6 L 12.6 21.1 L 39.5 48 L 12.6 74.9 " +
                  "L 21.1 83.4 L 48 56.5 L 74.9 83.4 L 83.4 74.9 L 56.5 48 Z",
        },
    };

    // Menu group
    public menuGroup: Snap.Paper;
    public menuRect: Snap.Element;
    public menuItemsGroup: Snap.Element;
    public menuItems: Snap.Element[];

    // Menu Item Size
    private menuItemSize: number = 20;
    // Menu position;
    private mx: number;
    private my: number;
    private mw: number = this.menuItemSize + 10;
    private mh: number = 30;

    // threshold for positioning menu inside/outside
    private dh: number = 20;
    // threshold for positioning menu left/right
    private dw: number = 5;

    private region: RegionComponent;

    constructor(paper: Snap.Paper, paperRect: Rect = null, regionData: RegionData, callbacks: IRegionCallbacks) {
        super(paper, paperRect, regionData, callbacks);
        this.buildOn(this.paper);
    }

    public addAction(action: string, icon: string, actor: (RegionComponent) => void) {
        const item = this.menuGroup.g();
        const itemBack = this.menuGroup.rect(5, 5, this.menuItemSize, this.menuItemSize, 5, 5);
        itemBack.addClass("menuItemBack");

        const itemIcon = this.menuGroup.path(MenuElement.PathCollection.delete.path);
        itemIcon.transform(`scale(0.2) translate(26 26)`);

        itemIcon.addClass("menuIcon");
        itemIcon.addClass("menuIcon-" + icon);

        const itemRect = this.menuGroup.rect(5, 5, this.menuItemSize, this.menuItemSize, 5, 5);
        itemRect.addClass("menuItem");

        item.add(itemBack);
        item.add(itemIcon);
        item.add(itemRect);

        item.click((e) => {
            actor(this.region);
        });

        this.menuItemsGroup.add(item);
        this.menuItems.push(item);
    }

    public attachTo(region: RegionComponent) {
        this.region = region;
        this.regionData.initFrom(region.regionData);
        this.rearrangeMenuPosition();

        window.requestAnimationFrame(() => {
            this.menuGroup.attr({
                x: this.mx,
                y: this.my,
            });
        });
    }

    public move(point: IMovable): void;
    public move(x: number, y: number): void;
    public move(arg1: any, arg2?: any): void {
        super.move(arg1, arg2);

        this.rearrangeMenuPosition();

        window.requestAnimationFrame(() => {
            this.menuGroup.attr({
                x: this.mx,
                y: this.my,
            });
        });
    }

    public resize(width: number, height: number) {
        super.resize(width, height);

        this.rearrangeMenuPosition();

        window.requestAnimationFrame(() => {
            this.menuGroup.attr({
                x: this.mx,
                y: this.my,
            });
        });
    }

    // IHideable -> hide()
    public hide() {
        window.requestAnimationFrame(() => {
            this.menuGroup.attr({
                visibility: "hidden",
            });
        });

    }

    // IHideable -> show()
    public show() {
        window.requestAnimationFrame(() => {
            this.menuGroup.attr({
                visibility: "visible",
            });
        });
    }

    public showOnRegion(region: RegionComponent) {
        this.attachTo(region);
        this.show();
    }

    private buildOn(paper: Snap.Paper) {
        const menuSVG = this.paper.svg(this.mx, this.my, this.mw, this.mh,
                                     this.mx, this.my, this.mw, this.mh) as SVGGraphicsElement;

        // Snap.Paper
        this.menuGroup = Snap(menuSVG).paper;
        this.menuGroup.addClass("menuLayer");

        this.rearrangeMenuPosition();

        this.menuRect = this.menuGroup.rect(0, 0, this.mw, this.mh, 5, 5);
        this.menuRect.addClass("menuRectStyle");

        this.menuItemsGroup = this.menuGroup.g();
        this.menuItemsGroup.addClass("menuItems");

        this.menuItems = new Array<Snap.Element>();

        this.menuGroup.add(this.menuRect);
        this.menuGroup.add(this.menuItemsGroup);

        this.menuGroup.mouseover((e) => {
            this.onManipulationBegin();
        });

        this.menuGroup.mouseout((e) => {
            this.onManipulationEnd();
        });
    }

    private rearrangeMenuPosition() {
        /* // position menu inside
        if (this.mh <= this.boundRect.height - this.dh) {
            this.my = this.y + this.boundRect.height / 2 - this.mh / 2;
            // position menu on the right side
            if (this.x + this.boundRect.width + this.mw / 2 + this.dw < this.paperRect.width) {
                this.mx = this.x + this.boundRect.width - this.mw / 2;
            } else if (this.x - this.mw / 2 - this.dw > 0) { // position menu on the left side
                this.mx = this.x - this.mw / 2;
            } else { // position menu on the right side INSIDE
                this.mx = this.x + this.boundRect.width - this.mw - this.dw;
            }
        } else { // position menu outside
            if (this.y + this.mh > this.paperRect.height) {
                this.my = this.paperRect.height - this.mh - this.dw;
            } else {
                this.my = this.y;
            }
            // position menu on the right side
            if (this.x + this.boundRect.width + this.mw + 2 * this.dw < this.paperRect.width) {
                this.mx = this.x + this.boundRect.width + this.dw;
            } else if (this.x - this.mw - 2 * this.dw > 0) { // position menu on the left side
                this.mx = this.x - this.mw - this.dw;
            } else { // position menu on the right side INSIDE
                this.mx = this.x + this.boundRect.width - this.mw - this.dw;
            }
        } */

        // position menu outside
        if (this.y + this.mh + this.dw > this.paperRect.height) {
            this.my = this.paperRect.height - this.mh - this.dw;
        } else {
            this.my = this.y + this.dw;
        }
        // position menu on the right side
        if (this.x + this.boundRect.width + this.mw + 2 * this.dw < this.paperRect.width) {
            this.mx = this.x + this.boundRect.width + this.dw;
        } else if (this.x - this.mw - 2 * this.dw > 0) { // position menu on the left side
            this.mx = this.x - this.mw - this.dw;
        } else { // position menu on the right side INSIDE
            this.mx = this.x + this.boundRect.width - this.mw - this.dw;
        }

    }
}
