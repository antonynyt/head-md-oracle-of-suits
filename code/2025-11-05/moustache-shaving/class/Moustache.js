import { Particle } from "./Particle.js";

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

        this.particles = [];
        this.maxParticles = 200;
    }

    // erase a circular area on the moustache buffer (make it transparent)
    eraseAt(px, py, radius) {
        // offset px, py to moustache buffer coords
        const offsetX = px - (this.x - this.w / 2);
        const offsetY = py - (this.y - this.height / 2);

        const shouldEmit = this.regionHasInk(offsetX, offsetY, radius);

        this.pg.push();
        this.pg.erase();
        this.pg.noStroke();
        this.pg.ellipse(offsetX, offsetY, radius * 2, radius * 2);
        this.pg.noErase();
        this.pg.pop();

        // if (shouldEmit) {
        //     this.spawnParticles(px, py, radius);
        // }
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
        // this.updateParticles();
    }

    // Check whether the moustache buffer is fully erased (all transparent)
    // detect 99% transparency
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
        if ((transparentPixels / totalPixels) >= 0.99) {
            return true;
        }
        return false

    }

    spawnParticles(px, py, radius) {
        for (let i = 0; i < 2; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            const jitterX = random(-radius * 0.3, radius * 0.3);
            const jitterY = random(-radius * 0.3, radius * 0.3);
            const particle = new Particle(px + jitterX, py + jitterY);
            particle.applyForce(createVector(random(-0.05, 0.05), random(-0.2, -0.05)));
            this.particles.push(particle);
        }
    }

    updateParticles() {
        const gravity = createVector(0, 0.12);
        for (const particle of this.particles) {
            particle.applyForce(gravity);
            particle.update();
            particle.show();
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].finished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    regionHasInk(offsetX, offsetY, radius) {
        this.pg.loadPixels();
        const rSquared = radius * radius;
        const step = Math.max(1, Math.floor(radius / 3));
        for (let dy = -radius; dy <= radius; dy += step) {
            for (let dx = -radius; dx <= radius; dx += step) {
                if (dx * dx + dy * dy > rSquared) continue;
                const sx = Math.floor(offsetX + dx);
                const sy = Math.floor(offsetY + dy);
                if (sx < 0 || sy < 0 || sx >= this.pg.width || sy >= this.pg.height) continue;
                const index = (sy * this.pg.width + sx) * 4 + 3;
                if (this.pg.pixels[index] > 10) {
                    return true;
                }
            }
        }
        return false;
    }
}