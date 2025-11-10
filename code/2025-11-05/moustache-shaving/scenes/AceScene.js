import { BaseScene } from "./BaseScene.js";
import { drawPatternCover } from "./shared.js";
import { Character } from "../class/Character.js";
import { Moustache } from "../class/Moustache.js";

export class AceScene extends BaseScene {
    constructor(shared) {
        super(shared);
        this.pattern = shared.assets.images.pattern;
        this.character = new Character(shared.assets.images.aceOfSpade, {
            maxHeightRatio: 0.8,
            maxWidthRatio: 0.7,
            anchor: { x: 0.5, y: 0.5 },
            offsetY: 0
        });
        this.moustacheImage = shared.assets.images.moustacheEvil;
        this.minDistance = 500;
        this.maxAttempts = 50;
        this.shaveDefinitions = [
            {
                id: "moustache",
                width: 500,
                anchorKey: "moustache",
                eraseRadius: 40,
                drawOptions: { rotate: false },
                proximityRange: 220,
                create: ({ x, y, width, image }) => new Moustache(x, y, width, image),
                image: this.moustacheImage
            }
        ];
        this.shaveTargets = new Map();
    }

    enter() {
        this.shared.setOverlayText({
            info: "Be extremely careful",
            bubble: "What's that? Go away! But be careful not to scratch me!"
        });
        this.shaveTargets.clear();
        this._ensureShaveTargets();
        this.shared.handCursor.showOpenHand();
    }

    draw() {
        background(227, 84, 40);
        //add pattern overlay
        //aspect cover image
        drawPatternCover(this.pattern, width, height);

    const closeness = this.shared.updateHandTracking();
    this.character.draw(width, height);
    const cursorTop = this.shared.handCursor.getTop();
    this._updateCursorProximity(cursorTop);
    const moustache = this.shaveTargets.get("moustache");

        // cursor make the moustache change to a random position away form cursor
        if (closeness && closeness.state === "closed") {
            this.shared.handCursor.showClosedHand();
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
    }

    _ensureShaveTargets({ refreshOnly = false } = {}) {
        for (const definition of this.shaveDefinitions) {
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
        while (attempts < this.maxAttempts) {
            const candidateX = random(sprite.width / 2, width - sprite.width / 2);
            const candidateY = random(sprite.height / 2, height - sprite.height / 2);
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
}
