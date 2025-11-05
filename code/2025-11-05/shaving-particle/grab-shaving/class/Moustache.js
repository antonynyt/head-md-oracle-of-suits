export class Moustache {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.scale = size / 854;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.width = 854 * this.scale;
        this.height = 209 * this.scale;
    }

    _moustacheShape() {
        beginShape();
        vertex(426.855, 145.816);
        bezierVertex(370.282, 146.918, 316.578, 195.802, 259.873, 205.676);
        bezierVertex(239.309, 209.246, 218.171, 208.365, 197.387, 206.293);
        bezierVertex(162.393, 202.811, 127.399, 195.846, 95.6265, 180.815);
        bezierVertex(63.854, 165.784, 35.3911, 142.201, 18.9753, 111.125);
        bezierVertex(1.23563, 77.4921, -1.23557, 37.9526, 0.441312, 0);
        bezierVertex(38.5683, 42.3606, 96.156, 63.8715, 153.082, 67.0893);
        bezierVertex(210.008, 70.3071, 266.713, 56.8187, 320.638, 38.2612);
        bezierVertex(338.554, 32.09, 356.602, 25.3018, 375.534, 24.1557);
        bezierVertex(394.465, 23.0096, 414.852, 28.6518, 426.811, 43.3303);
        bezierVertex(438.77, 28.6077, 459.157, 23.0537, 478.088, 24.1557);
        bezierVertex(497.019, 25.2577, 515.068, 32.09, 532.984, 38.2612);
        bezierVertex(586.909, 56.8187, 643.57, 70.3071, 700.54, 67.0893);
        bezierVertex(757.466, 63.8715, 815.053, 42.3606, 853.18, 0);
        bezierVertex(854.901, 37.9526, 852.43, 77.5361, 834.646, 111.125);
        bezierVertex(818.231, 142.201, 789.768, 165.784, 757.995, 180.815);
        bezierVertex(726.223, 195.846, 691.185, 202.811, 656.235, 206.293);
        bezierVertex(635.45, 208.365, 614.357, 209.246, 593.749, 205.676);
        bezierVertex(537.044, 195.758, 486.34, 148.372, 426.767, 145.816);
        endShape(CLOSE);
    }

    draw() {

        push();
        translate(this.x, this.y);
        scale(this.scale);
        translate(-427, -104.5);
        noStroke();
        fill(20, 100, 100);
        this._moustacheShape();
        pop();
    }

    float() {
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.85;
        this.vy *= 0.85;
        this.ax = 0;
        this.ay = 0;

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
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const closestX = constrain(cursorX, this.x - halfWidth, this.x + halfWidth);
        const closestY = constrain(cursorY, this.y - halfHeight, this.y + halfHeight);
        const distance = dist(cursorX, cursorY, closestX, closestY);
        return distance < cursorRadius;
    }

    jumpAway(cursorX, cursorY) {
        const dx = this.x - cursorX;
        const dy = this.y - cursorY;
        const distance = dist(this.x, this.y, cursorX, cursorY);

        if (distance > 0) {
            const jumpSpeed = 12;
            this.vx = (dx / distance) * jumpSpeed;
            this.vy = (dy / distance) * jumpSpeed;
        }
    }
}