export class Character {
    constructor(img, options = {}) {
        this.img = img;
    this.anchor = options.anchor || { x: 0.5, y: 0.5 };
    this.anchors = { moustache: this.anchor, ...(options.anchors || {}) };
    this.defaultAnchorKey = options.defaultAnchorKey || "moustache";
        // how big the character may become relative to canvas
        this.maxHeightRatio = options.maxHeightRatio || 0.8;
        this.maxWidthRatio = options.maxWidthRatio || 1.0;
        // vertical offset applied when positioning the image's center (same as your previous +100)
        this.offsetY = options.offsetY || 0;
    }

    // compute scaled width/height for current canvas
    getSize(canvasW, canvasH) {
        let w = this.img.width;
        let h = this.img.height;
        const maxH = canvasH * this.maxHeightRatio;
        const maxW = canvasW * this.maxWidthRatio;

        if (h > maxH) {
            const s = maxH / h;
            h = maxH;
            w = w * s;
        }
        if (w > maxW) {
            const s = maxW / w;
            w = maxW;
            h = h * s;
        }
        return { w, h };
    }

    // return draw center x,y and width/height
    getDrawParams(canvasW, canvasH) {
        const { w, h } = this.getSize(canvasW, canvasH);
        const x = canvasW / 2;
        const y = canvasH / 2 + this.offsetY;
        return { x, y, w, h };
    }

    getAnchorPosition(canvasW, canvasH, anchorKey = this.defaultAnchorKey) {
        const anchor = this.anchors[anchorKey] || this.anchors.moustache || { x: 0.5, y: 0.5 };
        const params = this.getDrawParams(canvasW, canvasH);
        const topLeftX = params.x - params.w / 2;
        const topLeftY = params.y - params.h / 2;
        const relativeX = anchor.x ?? 0.5;
        const relativeY = anchor.y ?? 0.5;
        const offsetX = anchor.offsetX || 0;
        const offsetY = anchor.offsetY || 0;
        return {
            x: topLeftX + relativeX * params.w + offsetX,
            y: topLeftY + relativeY * params.h + offsetY
        };
    }

    // return absolute moustache anchor position on canvas (px)
    getMoustachePosition(canvasW, canvasH) {
        return this.getAnchorPosition(canvasW, canvasH, "moustache");
    }

    // convenience draw
    draw(canvasW, canvasH) {
        const p = this.getDrawParams(canvasW, canvasH);
        imageMode(CENTER);
        image(this.img, p.x, p.y, p.w, p.h);
    }
}