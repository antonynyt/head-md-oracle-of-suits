import { BaseScene } from "./BaseScene.js";
import { drawPatternCover } from "./shared.js";

export class RecomposeScene extends BaseScene {
    constructor(shared) {
        super(shared);
        this.pattern = shared.assets.images.pattern;
        this.videoPath = shared.assets.videos ? shared.assets.videos.recompose : null;
        this.videoElement = null;
        this.videoPlaying = false;
        this._handleVideoEnded = this._handleVideoEnded.bind(this);
    }

    enter() {
        this.shared.setOverlayText({ info: "", bubble: "" });
        this.shared.handCursor.updateShaveProximity(null);
        this.shared.handCursor.showOpenHand();
        this._ensureVideoElement();
        this._playVideo();
    }

    draw() {
        background(227, 84, 40);
        // drawPatternCover(this.pattern, width, height);
    }

    resize() {
        this._updateVideoLayout();
    }

    exit() {
        this._stopVideo();
    }

    _ensureVideoElement() {
        if (this.videoElement || !this.videoPath) {
            return;
        }

        const video = createVideo([this.videoPath]);
        video.hide();
        video.attribute("playsinline", "");
        // video.attribute("muted", "");
        video.attribute("preload", "auto");
        video.volume(1);

        const element = video.elt;
        // element.muted = true;
        element.loop = false;
        element.controls = false;
        element.playsInline = true;
        element.style.position = "fixed";
        element.style.top = "0";
        element.style.left = "0";
        element.style.width = "100vw";
        element.style.height = "100vh";
        element.style.objectFit = "contain";
        element.style.pointerEvents = "none";
        element.style.zIndex = "10";
        element.style.backgroundColor = "transparent";
        element.style.display = "none";
        element.style.opacity = "0";
        element.style.transition = "opacity 200ms ease-out";
        element.addEventListener("ended", this._handleVideoEnded);

        this.videoElement = video;
        this._updateVideoLayout();
    }

    _playVideo() {
        if (!this.videoElement) {
            return;
        }

        const video = this.videoElement;
        const element = video.elt;
        video.show();
        video.time(0);
        element.style.display = "block";
        requestAnimationFrame(() => {
            element.style.opacity = "1";
        });
        this._updateVideoLayout();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                // Autoplay may fail in some browsers; keep the scene visible even if paused.
            });
        }
        this.videoPlaying = true;
    }

    _stopVideo() {
        if (!this.videoElement) {
            return;
        }

        const video = this.videoElement;
        const element = video.elt;
        video.pause();
        video.time(0);
        element.style.opacity = "0";
        element.style.display = "none";
        video.hide();
        this.videoPlaying = false;
    }

    _handleVideoEnded() {
        if (!this.videoPlaying) {
            return;
        }
        this.videoPlaying = false;
        this.shared.switchScene("ace");
    }

    _updateVideoLayout() {
        if (!this.videoElement) {
            return;
        }
        const element = this.videoElement.elt;
        element.style.width = `${windowWidth}px`;
        element.style.height = `${windowHeight}px`;
        element.style.left = "0px";
        element.style.top = "0px";
    }
}
