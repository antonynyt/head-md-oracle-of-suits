export class Character {
    constructor(img, options = {}) {
        this.img = img;
        this.anchor = options.anchor || { x: 0.5, y: 0.5 };
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

    // return absolute moustache anchor position on canvas (px)
    getMoustachePosition(canvasW, canvasH) {
        const p = this.getDrawParams(canvasW, canvasH);
        const topLeftX = p.x - p.w / 2;
        const topLeftY = p.y - p.h / 2;
        const mx = topLeftX + this.anchor.x * p.w;
        const my = topLeftY + this.anchor.y * p.h;
        return { x: mx, y: my };
    }

    // convenience draw
    draw(canvasW, canvasH) {
        const p = this.getDrawParams(canvasW, canvasH);
        imageMode(CENTER);
        image(this.img, p.x, p.y, p.w, p.h);
    }
}