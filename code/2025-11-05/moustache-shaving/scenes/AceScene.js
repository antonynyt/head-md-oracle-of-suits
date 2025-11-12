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
            offsetY: 0
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
                    eraseRadius: 45,
                    particles: { perEmission: 0 }
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
