export class Moustache {
    constructor(x, y, w, img = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.img = img; // optional image of moustache
        // offscreen buffer same size as canvas so coordinates match directly
        this.pg = createGraphics(width, height);
        this.pg.clear();
        this.pg.imageMode(CENTER);
        // draw initial moustache into the buffer
        if (this.img) {
            this.pg.image(this.img, this.x, this.y, this.w, this.w * (this.img.height/this.img.width));
        } else {
            // fallback: paint a simple moustache shape
            this.pg.fill(35, 80, 60);
            this.pg.noStroke();
            this.pg.ellipse(this.x - this.w * 0.25, this.y, this.w * 0.5, this.w * 0.25);
            this.pg.ellipse(this.x + this.w * 0.25, this.y, this.w * 0.5, this.w * 0.25);
        }
    }

    // call this when shaving
    eraseAt(canvasX, canvasY, radius) {
        // pg.erase clears pixels in erase mode
        this.pg.push();
        this.pg.erase();
        this.pg.noStroke();
        this.pg.ellipse(canvasX, canvasY, radius * 2, radius * 2);
        this.pg.noErase();
        this.pg.pop();
    }

    draw() {
        // draw the buffer with current erased areas on top of the king
        imageMode(CORNER);
        image(this.pg, 0, 0);
        // optionally draw any additional effects (foam, particles) here
    }
}