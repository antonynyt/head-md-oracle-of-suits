import { BaseScene } from "./BaseScene.js";
import { drawPatternCover } from "./shared.js";
import { Character } from "../class/Character.js";
import { Moustache } from "../class/Moustache.js";
import { ShaveableSprite } from "../class/ShaveableSprite.js";

export class AceScene extends BaseScene {
    constructor(shared) {
        super(shared);
        this.pattern = shared.assets.images.pattern;
        this.cardImage = shared.assets.images.emptyCard ?? shared.assets.images.aceOfSpade;
        this.cardDesignImage = shared.assets.images.aceCardDesign ?? shared.assets.images.aceOfSpade;
        this.character = new Character(this.cardImage, {
            maxHeightRatio: 0.8,
            maxWidthRatio: 0.7,
            anchor: { x: 0.5, y: 0.5 },
            anchors: {
                moustache: { x: 0.5, y: 0.5 },
                cardDesign: { x: 0.5, y: 0.5 }
            },
            offsetY: 100
        });
        this.moustacheImage = shared.assets.images.moustacheEvil;
        this.minDistance = 500;
        this.maxAttempts = 50;
        this.shaveDefinitions = [
            {
                id: "cardDesign",
                width: ({ canvasW, canvasH }) => {
                    const size = this.character.getSize(canvasW, canvasH);
                    return size.w * 0.75;
                },
                anchorKey: "cardDesign",
                eraseRadius: 10,
                drawOptions: { rotate: false },
                proximityRange: 200,
                create: ({ x, y, width, image }) => new ShaveableSprite({
                    x,
                    y,
                    width,
                    image,
                    eraseRadius: 30,
                    particles: { perEmission: 0 },
                    completionThreshold: 0.7
                }),
                image: () => this.cardDesignImage,
                scratchRadius: 55,
                recreateOnResize: true
            },
            {
                id: "moustache",
                width: 500,
                anchorKey: "moustache",
                eraseRadius: 10,
                drawOptions: { rotate: true },
                proximityRange: 220,
                create: ({ x, y, width, image }) => new Moustache(x, y, width, image, {
                    //rotation speed fast and small rotation
                    rotationNoise: { speed: 0.05, amplitude: 0.3, clamp: 0.1 },
                }),
                image: this.moustacheImage
            }
        ];
        this.shaveTargets = new Map();

        // Video-related properties
        this.videoPath = shared.assets.videos ? shared.assets.videos.introAce : null;
        this.videoElement = null;
        this.videoPlaying = false;
        this._handleVideoEnded = this._handleVideoEnded.bind(this);
    }

    enter() {
        this.shared.setOverlayText({
            info: "Be careful",
            bubble: "I am the Ace of Spades."
        });
        this.shaveTargets.clear();
        this._ensureShaveTargets();
        this.shared.handCursor.showOpenHand();

        // Ensure and play the video
        this._ensureVideoElement();
        this._playVideo();
    }

    draw() {
        background(166, 84, 40);
        drawPatternCover(this.pattern, width, height);

        const closeness = this.shared.updateHandTracking();
        this.character.draw(width, height);

        if (this.videoPlaying) {
            this.shaveTargets.get('cardDesign')?.draw({ rotate: false });
            return
        } else if (!this.videoPlaying && this.videoElement) {
            this.videoElement.hide();
            this.shared.setOverlayText({
                info: "Be careful",
                bubble: "Back in 1765, during card regulations in the UK I was stamped. Every deck had to pay through me!"
            });
        }
        const cursorTop = this.shared.handCursor.getTop();
        this._updateCursorProximity(cursorTop);
        const moustache = this.shaveTargets.get("moustache");

        if (closeness && closeness.state === "closed") {
            this.shared.handCursor.showClosedHand();

            this._scratchMoustache(cursorTop);
            this._scratchCard(cursorTop);

            if (moustache && moustache.isIntersectingWith(cursorTop.x, cursorTop.y)) {
                this._teleportAwayFrom(moustache, cursorTop);
            }
        } else {
            this.shared.handCursor.showOpenHand();
        }

        this._drawShaveTargets();
        this.shared.handCursor.draw();
    }

    resize() {
        this._ensureShaveTargets({ refreshOnly: true });
        this._updateVideoLayout();
    }

    exit() {
        this._stopVideo();
        //remove video element
        this.videoElement.hide();
        this.videoElement.elt.remove();
        this.videoElement = null;
        this.videoPlaying = false;
    }

    _ensureVideoElement() {
        if (this.videoElement || !this.videoPath) {
            return;
        }

        const video = createVideo([this.videoPath]);
        video.hide();
        video.attribute("playsinline", "");
        video.attribute("muted", "");
        video.attribute("preload", "auto");
        video.volume(0);

        const element = video.elt;
        element.muted = true;
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
        video.volume(0);
        element.muted = true;
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

    _ensureShaveTargets({ refreshOnly = false } = {}) {
        for (const definition of this.shaveDefinitions) {
            if (refreshOnly && definition.recreateOnResize) {
                this.shaveTargets.delete(definition.id);
            }
            const anchorPos = this.character.getAnchorPosition(width, height, definition.anchorKey);
            const posX = anchorPos.x + (definition.offsetX || 0);
            const posY = anchorPos.y + (definition.offsetY || 0);
            const existing = this.shaveTargets.get(definition.id);

            if (existing) {
                existing.setPosition(posX, posY);
                continue;
            }

            if (refreshOnly) {
                continue;
            }

            const resolvedWidth = typeof definition.width === "function"
                ? definition.width({ canvasW: width, canvasH: height })
                : definition.width;
            const resolvedImage = typeof definition.image === "function"
                ? definition.image(this.shared.assets)
                : definition.image;

            const sprite = definition.create
                ? definition.create({ x: posX, y: posY, width: resolvedWidth, image: resolvedImage })
                : new Moustache(posX, posY, resolvedWidth, resolvedImage);

            this.shaveTargets.set(definition.id, sprite);
        }
    }

    _drawShaveTargets() {
        for (const definition of this.shaveDefinitions) {
            const sprite = this.shaveTargets.get(definition.id);
            if (!sprite) continue;
            sprite.draw(definition.drawOptions || false);
        }
    }

    _teleportAwayFrom(sprite, cursor) {
        let targetX = sprite.x;
        let targetY = sprite.y;
        let attempts = 0;

        // confine to the central band so we stay clear of the top bubble and bottom info banner
        const topSafeBand = height * 0.25;
        const bottomSafeBand = height * 0.75;

        // clamp candidate ranges so the sprite stays fully on screen and inside the safe band
        const minX = sprite.width / 2;
        const maxX = width - sprite.width / 2;
        let minY = Math.max(sprite.height / 2, topSafeBand);
        let maxY = Math.min(height - sprite.height / 2, bottomSafeBand);

        if (minY >= maxY) {
            minY = height / 2;
            maxY = height / 2;
        }

        while (attempts < this.maxAttempts) {
            const candidateX = random(minX, maxX);
            const candidateY = random(minY, maxY);
            if (dist(candidateX, candidateY, cursor.x, cursor.y) >= this.minDistance) {
                targetX = candidateX;
                targetY = candidateY;
                break;
            }
            attempts++;
        }
        sprite.setPosition(targetX, targetY);
    }

    _updateCursorProximity(cursorTop) {
        if (!cursorTop) {
            this.shared.handCursor.updateShaveProximity(null);
            return;
        }

        let best = null;
        for (const definition of this.shaveDefinitions) {
            const sprite = this.shaveTargets.get(definition.id);
            if (!sprite) continue;

            const range = definition.proximityRange ?? Math.max(sprite.w, sprite.height);
            if (!(range > 0)) continue;
            const distance = sprite.distanceToPoint(cursorTop.x, cursorTop.y);
            const normalized = distance / range;

            if (!best || normalized < best.normalized) {
                best = { distance, range, normalized };
            }
        }

        if (best) {
            this.shared.handCursor.updateShaveProximity(best.distance, best.range);
        } else {
            this.shared.handCursor.updateShaveProximity(null);
        }
    }

    _scratchCard(cursorTop) {
        const design = this.shaveTargets.get("cardDesign");
        if (!design || !cursorTop) {
            return;
        }
        if (!design.isIntersectingWith(cursorTop.x, cursorTop.y)) {
            return;
        }
        const definition = this.shaveDefinitions.find((def) => def.id === "cardDesign");
        const radius = definition?.scratchRadius ?? definition?.eraseRadius ?? 45;
        design.eraseAt(cursorTop.x, cursorTop.y, radius);

        if (design.isFullyErased()) {
            console.log("Card design fully erased!");
            this.shared.switchScene("aceEnd");
        }
    }

    _scratchMoustache(cursorTop) {
        const moustache = this.shaveTargets.get("moustache");
        if (!moustache || !cursorTop) {
            return;
        }
        if (!moustache.isIntersectingWith(cursorTop.x, cursorTop.y)) {
            return;
        }
        const definition = this.shaveDefinitions.find((def) => def.id === "moustache");
        const radius = definition?.scratchRadius ?? definition?.eraseRadius ?? 40;
        moustache.eraseAt(cursorTop.x, cursorTop.y, radius);
    }
}
