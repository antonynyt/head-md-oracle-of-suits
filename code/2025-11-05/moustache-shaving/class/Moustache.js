import { ShaveableSprite } from "./ShaveableSprite.js";

export class Moustache extends ShaveableSprite {
    constructor(x, y, width, img, options = {}) {
        super({
            x,
            y,
            width,
            image: img,
            eraseRadius: options.eraseRadius ?? 50,
            rotationNoise: {
                speed: options.rotationSpeed ?? 0.02,
                amplitude: options.rotationAmplitude ?? 0.5,
                clamp: options.rotationClamp ?? 0.2
            },
            sampling: {
                sampleStep: options.sampleStep ?? 6,
                alphaThreshold: options.alphaThreshold ?? 5
            },
            particles: options.particles ?? {},
            completionThreshold: options.completionThreshold ?? 0.99
        });
    }

    draw(options = false) {
        super.draw(options);
    }
}