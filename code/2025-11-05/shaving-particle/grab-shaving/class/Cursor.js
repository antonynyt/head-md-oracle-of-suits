export class Cursor {
    constructor() {
        this.x = -100;
        this.y = -100;
        this.radius = 50;
        this.baseAlpha = 50;
        this.alpha = this.baseAlpha;
        this.lerpAmount = 0.95;
        this.fadeTime = 500;
        this.fadeDuration = 3000;
        this.lastMoveTime = 0;
    }

    update(targetX, targetY) {
        const distance = dist(this.x, this.y, targetX, targetY);
        if (distance > 1) {
            this.lastMoveTime = millis();
        }

        this.x = lerp(this.x, targetX, this.lerpAmount);
        this.y = lerp(this.y, targetY, this.lerpAmount);

        const timeSinceMove = millis() - this.lastMoveTime;
        if (timeSinceMove < this.fadeTime) {
            this.alpha = this.baseAlpha;
        } else {
            const fadeProgress = (timeSinceMove - this.fadeTime) / this.fadeDuration;
            this.alpha = max(0, this.baseAlpha * (1 - fadeProgress));
        }
    }

    setRadius(radius) {
        this.radius = radius;
    }

    draw() {
        noStroke();
        fill(0, 0, 0, this.alpha);
        rect(this.x - this.radius, this.y - this.radius / 2, this.radius * 2, this.radius / 2);
    }
}