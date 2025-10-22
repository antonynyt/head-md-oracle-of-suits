import {
    HandLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { Cross } from "./class/Cross.js";


let capture;
let handLandmarker;
let hands;
let runningMode = "IMAGE";

// Rotation state
let previousAngle = 0;
let currentAngle = 0;
let angularVelocity = 0;

const FINGER = {
    THUMB: 4,
    INDEX: 8,
    MIDDLE: 12,
    RING: 16,
    PINKY: 20,
};

function setup() {
    // create canvas full window size but camera keep original aspect ratio
    createCanvas(windowWidth, windowHeight);

    capture = createCapture(VIDEO, { flipped: true });
    capture.hide();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    // background(0);

    //image keep aspect ratio and centered
    let aspectRatio = capture.width / capture.height;
    let newWidth, newHeight;
    if (width / height > aspectRatio) {
        newHeight = height;
        newWidth = height * aspectRatio;
    } else {
        newWidth = width;
        newHeight = width / aspectRatio;
    }
    image(capture, (width - newWidth) / 2, (height - newHeight) / 2, newWidth, newHeight);

    if (handLandmarker) {
        hands = handLandmarker.detect(capture.canvas);

        if (hands.landmarks.length > 0) {
            let hand = hands.landmarks[0]

            // compute pixel positions for thumb tip and index tip
            const thumbTip = createVector(hand[FINGER.THUMB].x * width, hand[FINGER.THUMB].y * height);
            const indexTip = createVector(hand[FINGER.MIDDLE].x * width, hand[FINGER.MIDDLE].y * height);

            // target angle from thumb to index
            let targetAngle = atan2(
                hand[FINGER.MIDDLE].y - hand[FINGER.THUMB].y,
                hand[FINGER.MIDDLE].x - hand[FINGER.THUMB].x
            );

            // calculate angular difference (handle wrap-around)
            let angleDiff = targetAngle - previousAngle;
            if (angleDiff > PI) angleDiff -= TWO_PI;
            if (angleDiff < -PI) angleDiff += TWO_PI;

            // apply force based on angular difference (only clockwise)
            let angularForce = angleDiff * 0.3; // strength of force
            angularVelocity += angularForce;

            // store for next frame
            previousAngle = targetAngle;

            // size = diameter of the larger circle, which should touch the index tip
            // radius = distance from thumb tip to index tip
            let radius = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
            let size = radius * 2; // diameter

            // place the Cross centered at the thumb tip
            new Cross(thumbTip.x, thumbTip.y, size, currentAngle).draw();
        }
    }

    // apply damping and update angle every frame (outside hand detection)
    angularVelocity *= 0.95; // adjust for more/less inertia
    angularVelocity = max(angularVelocity, 0.01); // maintain minimum rotation
    currentAngle += angularVelocity;
}

const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
        },
        runningMode: runningMode,
        numHands: 1,
    });
};
createHandLandmarker();

window.setup = setup;
window.draw = draw;