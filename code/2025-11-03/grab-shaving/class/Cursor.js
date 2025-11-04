export class Cursor {
    constructor() {
        this.x = -100;
        this.y = -100;
        this.targetX = 0;
        this.targetY = 0;
        this.radius = 50;
        this.baseAlpha = 50;
        this.alpha = this.baseAlpha;
        this.lerpAmount = 0.95;
        this.fadeTime = 500; // milliseconds
        this.fadeDuration = 3000; // milliseconds
        this.lastMoveTime = 0;
    }

    update(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;

        // check if hand moved significantly
        const distance = dist(this.x, this.y, this.targetX, this.targetY);
        if (distance > 1) {
            this.lastMoveTime = millis();
        }

        // lerp from current position to target position
        this.x = lerp(this.x, this.targetX, this.lerpAmount);
        this.y = lerp(this.y, this.targetY, this.lerpAmount);

        // calculate fade based on time since last movement
        const timeSinceMove = millis() - this.lastMoveTime;
        if (timeSinceMove < this.fadeTime) {
            this.alpha = this.baseAlpha;
        } else {
            // fade out over fadeDuration milliseconds
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