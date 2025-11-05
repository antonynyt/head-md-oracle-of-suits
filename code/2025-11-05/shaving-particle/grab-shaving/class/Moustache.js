export class Moustache {
    constructor(x, y, w, img = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.img = img;

        // physics properties for new movement methods
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;

        // size properties used by new methods (width/height)
        this.width = this.w;
        if (this.img) {
            const h = this.img.height;
            this.height = h > 0 ? (this.w * (h / this.img.width)) : this.w * 0.5;
        } else {
            this.height = this.w * 0.5;
        }

        // offscreen buffer same size as canvas
        // this.pg = createGraphics(width, height);
        // this.pg.clear();
        // this.pg.imageMode(CENTER);
        // // draw initial moustache into the buffer
        // if (this.img) {
        //     const h = this.img.height;
        //     const ratio = h > 0 ? (this.img.width / h) : 1;
        //     this.pg.image(this.img, this.x, this.y, this.w, this.w * (h / this.img.width));
        // } else {
        //     this.pg.noStroke();
        //     this.pg.fill(30, 80, 40);
        //     this.pg.ellipse(this.x - this.w * 0.25, this.y, this.w * 0.5, this.w * 0.25);
        //     this.pg.ellipse(this.x + this.w * 0.25, this.y, this.w * 0.5, this.w * 0.25);
        // }
    }

    // erase a circular area on the moustache buffer (make it transparent)
    eraseAt(px, py, radius) {
        if (!this.pg) return;
        this.pg.push();
        this.pg.erase();
        this.pg.noStroke();
        this.pg.ellipse(px, py, radius * 2, radius * 2);
        this.pg.noErase();
        this.pg.pop();
    }

    draw() {
        imageMode(CENTER);
        push();
        translate(this.x, this.y);
        //rotate(sin(frameCount * 0.05) * 0.1);
        let rotationSpeed = 0.02;
        let noiseValue = noise(frameCount * rotationSpeed) * 1.0 - 0.5;
        //clamp the rotation to a smaller range
        noiseValue = constrain(noiseValue, -0.3, 0.3);
        rotate(noiseValue);
        image(this.img, 0, 0, this.w, this.w * (this.img.height / this.img.width));
        pop();
        // draw moustache buffer on top of the king image
    }

    float() {
        // Animate position with Perlin noise
        const time = frameCount * 0.005; // Slower time increment
        //this.x += (noise(time) - 0.5) * 0.3; // Small, slow jiggle
        //this.y += (noise(time + 1000) - 0.5) * 0.3; // Small, slow jiggle

        // Physics update
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.85; // less damping for faster movement
        this.vy *= 0.85;
        this.ax = 0;
        this.ay = 0;

        // Hard clamp to ensure it never goes out of bounds
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        this.x = constrain(this.x, halfWidth, width - halfWidth);
        this.y = constrain(this.y, halfHeight, height - halfHeight);
    }

    jumpTo(x, y) {
        // make the moustache move to new position with lerp
        this.x = lerp(this.x, x, 0.1);
        this.y = lerp(this.y, y, 0.1);
    }

    isTouching(cursorX, cursorY, cursorRadius) {
        // Rectangle collision detection with circle
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        // Find closest point on rectangle to cursor center
        const closestX = constrain(cursorX, this.x - halfWidth, this.x + halfWidth);
        const closestY = constrain(cursorY, this.y - halfHeight, this.y + halfHeight);

        // Calculate distance from cursor center to closest point
        const distance = dist(cursorX, cursorY, closestX, closestY);

        return distance < cursorRadius;
    }

    jumpAway(cursorX, cursorY) {
        // Calculate direction away from cursor
        const dx = this.x - cursorX;
        const dy = this.y - cursorY;
        const distance = dist(this.x, this.y, cursorX, cursorY);

        if (distance > 0) {
            // Immediate velocity impulse away from cursor (no lerp)
            const jumpSpeed = 12; // tune this value for stronger/weaker jump
            this.vx = (dx / distance) * jumpSpeed;
            this.vy = (dy / distance) * jumpSpeed;
        }
    }

    // Check whether the moustache buffer is fully erased (all transparent)
    // sampleStep: number of pixels to skip per axis for faster checks (>=1)
    // alphaThreshold: alpha value (0-255) above which a pixel counts as non-transparent
    isFullyErased(sampleStep = 6, alphaThreshold = 5) {
        // If no buffer or it's empty, consider it erased
        if (!this.pg) return true;

        // Use pg.get(x,y) which handles pixel density internally.
        const w = this.pg.width;
        const h = this.pg.height;

        // Small optimization: if the buffer was never drawn to (no pixels), treat as erased
        // But since we draw at construction, we inspect pixels.
        for (let y = 0; y < h; y += sampleStep) {
            for (let x = 0; x < w; x += sampleStep) {
                const c = this.pg.get(x, y); // returns [r,g,b,a]
                if (c && c[3] > alphaThreshold) {
                    return false; // found an opaque (or semi-opaque) pixel
                }
            }
        }

        return true;
    }
}