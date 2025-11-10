export class HandCursor {
    constructor(imgs, sound) {
        this.x = -100;
        this.y = -100;
        this.lerpAmount = 0.95;
        this.imgSrc = imgs;
        this.currentImg = this.imgSrc.open;
        this.sound = sound;
        this.soundPlaying = false;
        this.baseVolume = 0.25;
        this.maxVolume = 1.0;
        this.maxProximityDistance = 200;
        this.currentProximityDistance = null;
    }

    move(targetX, targetY) {
        this.x = lerp(this.x, targetX, this.lerpAmount);
        this.y = lerp(this.y, targetY, this.lerpAmount);
    }

    showOpenHand() {
        this.currentImg = this.imgSrc.open;
        if (this.sound && this.soundPlaying) {
            this.sound.stop();
            this.soundPlaying = false;
        }
        this._setSoundVolume(this.baseVolume);
    }

    showClosedHand() {
        this.currentImg = this.imgSrc.closed;
        if (!this.sound) return;
        this._applyProximityVolume();
        if (!this.soundPlaying) {
            this.sound.play();
            this.soundPlaying = true;
        } else if (!this.sound.isPlaying()) {
            this.soundPlaying = false;
        } else {
            this._applyProximityVolume();
        }
    }

    draw() {
        imageMode(CENTER);
        image(this.currentImg, this.x, this.y, this.currentImg.width * 0.3, this.currentImg.height * 0.3);
    }

    getTop() {
        const drawHeight = this.currentImg.height * 0.3;
        return { x: this.x, y: this.y - drawHeight / 2 };
    }

    updateShaveProximity(distance, maxDistance = this.maxProximityDistance) {
        if (typeof maxDistance === "number" && maxDistance > 0) {
            this.maxProximityDistance = maxDistance;
        }
        this.currentProximityDistance = typeof distance === "number" && distance >= 0 ? distance : null;
        this._applyProximityVolume();
    }

    _applyProximityVolume() {
        if (!this.sound) return;
        let targetVolume = this.baseVolume;
        if (this.currentProximityDistance !== null) {
            const clamped = constrain(this.currentProximityDistance, 0, this.maxProximityDistance);
            const proximityFactor = 1 - clamped / this.maxProximityDistance;
            targetVolume = lerp(this.baseVolume, this.maxVolume, proximityFactor);
        }
        this._setSoundVolume(targetVolume);
    }

    _setSoundVolume(volume) {
        if (!this.sound || typeof this.sound.setVolume !== "function") return;
        this.sound.setVolume(volume);
    }
}