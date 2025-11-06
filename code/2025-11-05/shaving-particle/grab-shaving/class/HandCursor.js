export class HandCursor {
    constructor(imgs, sound) {
        this.x = -100;
        this.y = -100;
        this.lerpAmount = 0.95;
        this.imgSrc = imgs;
        this.currentImg = this.imgSrc.open;
        this.sound = sound;
    }

    move(targetX, targetY) {
        this.x = lerp(this.x, targetX, this.lerpAmount);
        this.y = lerp(this.y, targetY, this.lerpAmount);
    }

    showOpenHand() {
        this.currentImg = this.imgSrc.open;
        this.sound.stop();
    }

    showClosedHand() {
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