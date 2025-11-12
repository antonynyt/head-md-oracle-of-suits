import { BaseScene } from "./BaseScene.js";
import { drawPatternCover } from "./shared.js";
import { Character } from "../class/Character.js";
import { Moustache } from "../class/Moustache.js";

export class KingScene extends BaseScene {
    constructor(shared) {
        super(shared);
        this.pattern = shared.assets.images.pattern;
        this.character = new Character(shared.assets.images.king, { anchor: { x: 0.48, y: 0.47 }, offsetY: 40 });
        this.moustacheImage = shared.assets.images.moustachePrimary;
        this.shaveDefinitions = [
            {
                id: "moustache",
                width: 600,
                eraseRadius: 50,
                anchorKey: "moustache",
                drawOptions: { rotate: true },
                proximityRange: 260,
                create: ({ x, y, width, image }) => new Moustache(x, y, width, image),
                image: this.moustacheImage
            }
        ];
        this.shaveTargets = new Map();
    }

    enter() {
        this.shared.setOverlayText({
            info: "Shave that ugly moustache away!",
            bubble: "I'm the King of Hearts. The only king with a spotless face! My moustache was lost due to misprint. Wait... what's that?"
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

        this.character.draw(width, height);
        const closeness = this.shared.updateHandTracking();
        const cursorTop = this.shared.handCursor.getTop();
        this._updateCursorProximity(cursorTop);

        if (this._areAllTargetsCleared()) {
            this.shared.switchScene("recompose");
            return;
        }

        this._drawShaveTargets();

        if (closeness && closeness.state === "closed") {
            this.shared.handCursor.showClosedHand();
            this._handleShaving(cursorTop);
        } else {
            this.shared.handCursor.showOpenHand();
        }

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

    _handleShaving(cursorTop) {
        for (const definition of this.shaveDefinitions) {
            const sprite = this.shaveTargets.get(definition.id);
            if (!sprite || sprite.isFullyErased()) continue;
            if (!sprite.isIntersectingWith(cursorTop.x, cursorTop.y)) continue;
            const radius = definition.eraseRadius ?? undefined;
            sprite.eraseAt(cursorTop.x, cursorTop.y, radius);
        }
    }

    _areAllTargetsCleared() {
        for (const definition of this.shaveDefinitions) {
            const sprite = this.shaveTargets.get(definition.id);
            if (sprite && !sprite.isFullyErased()) {
                return false;
            }
        }
        return true;
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
            if (typeof sprite.isFullyErased === "function" && sprite.isFullyErased()) continue;

            const distance = sprite.distanceToPoint(cursorTop.x, cursorTop.y);
            const range = definition.proximityRange ?? Math.max(sprite.w, sprite.height);
            if (!(range > 0)) continue;
            const normalized = distance / range;
            if (!best || normalized < best.normalized) {
                best = {
                    distance,
                    range,
                    normalized
                };
            }
        }

        if (best) {
            this.shared.handCursor.updateShaveProximity(best.distance, best.range);
        } else {
            this.shared.handCursor.updateShaveProximity(null);
        }
    }
}
