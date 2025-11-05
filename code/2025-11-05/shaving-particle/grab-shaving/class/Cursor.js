export class Cursor {
    constructor(imgs, sound) {
        this.x = -100;
        this.y = -100;
        this.baseAlpha = 50;
        this.alpha = this.baseAlpha;
        this.lerpAmount = 0.95;
        this.fadeTime = 500;
        this.fadeDuration = 3000;
        this.lastMoveTime = 0;
        this.imgSrc = imgs;
        this.currentImg = this.imgSrc.open;
        this.sound = sound;
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

    open() {
        this.currentImg = this.imgSrc.open;
        this.sound.stop();
    }

    close() {
        this.currentImg = this.imgSrc.closed;
        this.sound.play();
    }

    draw() {
        imageMode(CENTER);
        image(this.currentImg, this.x, this.y, this.currentImg.width * 0.3, this.currentImg.height * 0.3);
    }

    getTop() {
        const drawHeight = this.currentImg.height * 0.3;
        return { x: this.x, y: this.y - drawHeight / 2 };
    }
}