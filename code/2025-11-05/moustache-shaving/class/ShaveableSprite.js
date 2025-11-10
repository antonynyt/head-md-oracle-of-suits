import { Particle } from "./Particle.js";

export class ShaveableSprite {
    constructor(options = {}) {
        const {
            x = 0,
            y = 0,
            width = 1,
            image = null,
            eraseRadius = 50,
            rotationNoise = {},
            sampling = {},
            particles = {},
            completionThreshold = 0.99
        } = options;

        this.x = x;
        this.y = y;
        this.w = width;
        this.width = width;
        this.img = image;
        this.eraseRadius = eraseRadius;
        this.rotationNoise = {
            speed: rotationNoise.speed ?? 0.02,
            amplitude: rotationNoise.amplitude ?? 0.5,
            clamp: rotationNoise.clamp ?? 0.2
        };
        this.sampleStep = sampling.sampleStep ?? 6;
        this.alphaThreshold = sampling.alphaThreshold ?? 5;
        this.eraseCompletionThreshold = completionThreshold;

        const defaultForce = {
            x: [-0.05, 0.05],
            y: [-0.2, -0.05]
        };
        const forceX = Array.isArray(particles.forceX) ? particles.forceX : particles.force?.x;
        const forceY = Array.isArray(particles.forceY) ? particles.forceY : particles.force?.y;
        this.particleForceRange = {
            x: Array.isArray(forceX) && forceX.length >= 2 ? forceX : defaultForce.x,
            y: Array.isArray(forceY) && forceY.length >= 2 ? forceY : defaultForce.y
        };
        this.maxParticles = particles.maxCount ?? 200;
        this.particlesPerEmission = particles.perEmission ?? 2;
        this.gravityStrength = particles.gravity ?? 0.12;

        const aspectRatio = this._calculateAspectRatio();
        this.height = Math.max(1, this.w * aspectRatio);
        this.h = this.height;

        this.pg = createGraphics(this.w, this.height);
        this.pg.clear();
        this.pg.imageMode(CENTER);
        if (this.img) {
            this.pg.image(this.img, this.w / 2, this.height / 2, this.w, this.height);
        }

        this.particles = [];
    }

    _calculateAspectRatio() {
        if (this.img && this.img.width > 0) {
            return this.img.height / this.img.width;
        }
        return 0.5;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(options = {}) {
        const normalized = typeof options === "boolean" ? { rotate: options } : options;
        const rotateSprite = normalized.rotate === true;
        const rotationNoise = normalized.rotationNoise ?? this.rotationNoise;

        imageMode(CENTER);
        push();
        translate(this.x, this.y);
        if (rotateSprite) {
            const speed = rotationNoise.speed ?? this.rotationNoise.speed;
            const amplitude = rotationNoise.amplitude ?? this.rotationNoise.amplitude;
            const clamp = rotationNoise.clamp ?? this.rotationNoise.clamp;
            let angle = noise(frameCount * speed) * (amplitude * 2) - amplitude;
            if (typeof clamp === "number") {
                angle = constrain(angle, -clamp, clamp);
            }
            rotate(angle);
        }
        image(this.pg, 0, 0);
        pop();
        this.updateParticles();
    }

    eraseAt(px, py, radius = this.eraseRadius) {
        const offsetX = px - (this.x - this.w / 2);
        const offsetY = py - (this.y - this.height / 2);
        const shouldEmit = this.regionHasInk(offsetX, offsetY, radius);

        this.pg.push();
        this.pg.erase();
        this.pg.noStroke();
        this.pg.ellipse(offsetX, offsetY, radius * 2, radius * 2);
        this.pg.noErase();
        this.pg.pop();

        if (shouldEmit) {
            this.spawnParticles(px, py, radius);
        }
    }

    isIntersectingWith(x, y) {
        return (
            x >= this.x - this.w / 2 &&
            x <= this.x + this.w / 2 &&
            y >= this.y - this.height / 2 &&
            y <= this.y + this.height / 2
        );
    }

    distanceToPoint(x, y) {
        const halfW = this.w / 2;
        const halfH = this.height / 2;
        const dx = Math.max(Math.abs(x - this.x) - halfW, 0);
        const dy = Math.max(Math.abs(y - this.y) - halfH, 0);
        return Math.sqrt(dx * dx + dy * dy);
    }

    getErasedPercentage(sampleStep = this.sampleStep, alphaThreshold = this.alphaThreshold) {
        const imgData = this.pg.get();
        imgData.loadPixels();
        let totalPixels = 0;
        let transparentPixels = 0;

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

        if (totalPixels === 0) {
            return 1;
        }

        return transparentPixels / totalPixels;
    }

    isFullyErased(sampleStep = this.sampleStep, alphaThreshold = this.alphaThreshold) {
        return this.getErasedPercentage(sampleStep, alphaThreshold) >= this.eraseCompletionThreshold;
    }

    spawnParticles(px, py, radius) {
        for (let i = 0; i < this.particlesPerEmission; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            const jitterX = random(-radius * 0.3, radius * 0.3);
            const jitterY = random(-radius * 0.3, radius * 0.3);
            const particle = new Particle(px + jitterX, py + jitterY);
            const forceX = random(this.particleForceRange.x[0], this.particleForceRange.x[1]);
            const forceY = random(this.particleForceRange.y[0], this.particleForceRange.y[1]);
            particle.applyForce(createVector(forceX, forceY));
            this.particles.push(particle);
        }
    }

    updateParticles() {
        const gravity = createVector(0, this.gravityStrength);
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
