export class Moustache {
    constructor(x, y, w, img) {
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

        // create an offscreen graphics buffer for the moustache size of img
        this.pg = createGraphics(this.w, this.height);
        this.pg.clear();
        this.pg.imageMode(CENTER);

        // draw initial moustache into the buffer
        this.pg.image(this.img, this.w / 2, this.height / 2, this.w, this.height);
    }

    // erase a circular area on the moustache buffer (make it transparent)
    eraseAt(px, py, radius) {
        // offset px, py to moustache buffer coords
        const offsetX = px - (this.x - this.w / 2);
        const offsetY = py - (this.y - this.height / 2);

        this.pg.push();
        this.pg.erase();
        this.pg.noStroke();
        this.pg.ellipse(offsetX, offsetY, radius * 2, radius * 2);
        this.pg.noErase();
        this.pg.pop();
    }

    draw(rotateMoustache = false) {
        imageMode(CENTER);
        push();
        translate(this.x, this.y);
        if (rotateMoustache) {
            let rotationSpeed = 0.02;
            let noiseValue = noise(frameCount * rotationSpeed) * 1.0 - 0.5;
            //clamp the rotation to a smaller range
            noiseValue = constrain(noiseValue, -0.2, 0.2);
            rotate(noiseValue);
        }
        image(this.pg, 0, 0);
        pop();
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
    // detect 95% transparency
    isFullyErased(sampleStep = 6, alphaThreshold = 5) {

        const imgData = this.pg.get();
        imgData.loadPixels();
        let totalPixels = 0;
        let transparentPixels = 0;

        // count transparent pixels
        for (let y = 0; y < imgData.height; y += sampleStep) {
            for (let x = 0; x < imgData.width; x += sampleStep) {
                const index = (y * imgData.width + x) * 4;
                const alpha = imgData.pixels[index + 3];
                totalPixels++;
                if (alpha <= alphaThreshold) {
                    transparentPixels++;
                }
            }
        }
        if ((transparentPixels / totalPixels) >= 0.98) {
            return true;
        }
        return false

    }
}