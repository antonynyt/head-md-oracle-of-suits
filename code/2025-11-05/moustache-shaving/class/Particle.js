export class Particle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius; // used as a base size
        this.alpha = 255;

        // physics
        this.vx = random(-0.5, 0.5);
        this.vy = random(1, 3);
        this.gravity = 0.12;
        this.friction = 0.995;

        // visual for a small "line" particle
        this.length = random(6, 18);
        this.thickness = random(1, 3);
        this.angle = random(TWO_PI);
        this.color = 0; // black by default, change if needed
    }

    update() {
        // physics
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        // rotate slowly
        this.angle += this.vx * 0.05;

        // fade out
        this.alpha -= 4;
    }

    isAlive() {
        return this.alpha > 5 && this.y < height + 50;
    }

    draw() {
        stroke(this.color, this.alpha);
        strokeWeight(this.thickness);
        // draw a short line with rotation
        const dx = cos(this.angle) * this.length;
        const dy = sin(this.angle) * this.length;
        line(this.x - dx * 0.5, this.y - dy * 0.5, this.x + dx * 0.5, this.y + dy * 0.5);
    }
}
