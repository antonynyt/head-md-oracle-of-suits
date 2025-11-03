import { GestureClassifier } from "./class/Gesture.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

let videoElement;
let hands;
let detections = null;
let cam;
let selfieMode = true;
let gesture; // <- new

function setup() {
    createCanvas(windowWidth, windowHeight);

    // hidden video capture used by MediaPipe Camera util
    videoElement = createCapture(VIDEO, { flipped: selfieMode });
    videoElement.size(640, 480);
    videoElement.hide();

    colorMode(HSB);

    // Initialize MediaPipe Hands
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.1,
        selfieMode: selfieMode,
    });

    hands.onResults(onHandsResults);

    // feed frames from the p5 video element to MediaPipe
    cam = new Camera(videoElement.elt, {
        onFrame: async () => {
            await hands.send({ image: videoElement.elt });
        },
        width: 640,
        height: 480
    });

    cam.start();

    // instantiate classifier (ensure gesture.js is loaded before sketch.js)
    gesture = new GestureClassifier();
}

function onHandsResults(results) {
    detections = results;
}


let circleRadius = 50;
let cx = 0;
let cy = 0;
let targetX = 0;
let targetY = 0;
const lerpAmount = 0.95;
const fadeTime = 2; // seconds
let lastMoveTime = 0;
let circleAlpha = 255;

function draw() {
    background(200);

    // draw landmarks and gesture labels
    if (detections && detections.multiHandLandmarks) {
        for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
            const landmarks = detections.multiHandLandmarks[i];

            const closeness = gesture.classify(landmarks);

            targetX = 0;
            targetY = 0;
            for (let j = 0; j < landmarks.length; j++) {
                targetX += landmarks[j].x * width;
                targetY += landmarks[j].y * height;
            }
            targetX /= landmarks.length;
            targetY /= landmarks.length;

            // check if hand moved significantly
            const distance = dist(cx, cy, targetX, targetY);
            if (distance > 1) {
                lastMoveTime = millis();
            }

            // lerp from current position to target position
            cx = lerp(cx, targetX, lerpAmount);
            cy = lerp(cy, targetY, lerpAmount);

            if (closeness.state === 'closed') {
                circleRadius = 20;
            } else {
                circleRadius = 50;
            }

            // draw label
            fill(0, 0, 100); // white in HSB
            textSize(16);
            textAlign(LEFT, TOP);
            text(`Closeness: ${closeness.closure.toFixed(2)}`, 10, 10);

            // draw hand
            //gesture.drawHands(landmarks);
        }
    }

    // calculate fade based on time since last movement
    const timeSinceMove = (millis() - lastMoveTime) / 1000;
    if (timeSinceMove < fadeTime) {
        circleAlpha = 100; // full brightness in HSB
    } else {
        circleAlpha = max(0, 100 - ((timeSinceMove - fadeTime) * 100));
    }

    // pointer with HSB color and alpha
    noStroke();
    fill(300, 100, circleAlpha); // H=300 (magenta), S=100, B=circleAlpha
    circle(cx, cy, circleRadius);
}

window.setup = setup;
window.draw = draw;