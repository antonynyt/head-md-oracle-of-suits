import { BaseScene } from "./BaseScene.js";
import { tilePattern } from "./shared.js";
import { Moustache } from "../class/Moustache.js";

export class RecomposeScene extends BaseScene {
    constructor(shared) {
        super(shared);
        this.pattern = shared.assets.images.pattern;
        this.moustacheImage = shared.assets.images.moustacheAlt;
        this.moustache = null;
    }

    enter() {
        this.shared.setOverlayText({
            info: "Take a breath—the moustache is recomposing itself for the encore.",
            bubble: "The universe bends to my curls once more!"
        });
        this._ensureMoustache();
        this.shared.handCursor.showOpenHand();
    }

    draw() {
        background(227, 84, 40);
        tilePattern(this.pattern, width, height);

        //draw a big white star background shape
        noStroke();
        fill(0, 0, 100, 80);
        beginShape();
        const cx = width / 2;
        const cy = height / 2;
        const spikes = 10;
        const outerRadius = max(width / 2, height / 2);
        const innerRadius = outerRadius * 0.6;
        const angle = TWO_PI / spikes;
        const halfAngle = angle / 2.0;
        for (let a = 0; a < TWO_PI; a += angle) {
            let sx = cx + cos(a) * outerRadius;
            let sy = cy + sin(a) * outerRadius;
            vertex(sx, sy);
            sx = cx + cos(a + halfAngle) * innerRadius;
            sy = cy + sin(a + halfAngle) * innerRadius;
            vertex(sx, sy);
        }
        endShape(CLOSE);

        this.moustache.draw(false);
    }

    resize() {
        if (!this.moustache) return;
        const cx = width / 2 - 10;
        const cy = height * 0.5;
        this.moustache.x = cx;
        this.moustache.y = cy;
    }

    _ensureMoustache() {
        const cx = width / 2 - 10;
        const cy = height * 0.5;
        this.moustache = new Moustache(cx, cy, 500, this.moustacheImage);
    }
}
