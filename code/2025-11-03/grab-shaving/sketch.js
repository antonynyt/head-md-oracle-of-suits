import { GestureClassifier } from "./class/Gesture.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

let videoElement;
let hands;
let detections = null;
let cam;
let selfieMode = true;
let gesture;

function setup() {
    createCanvas(windowWidth, windowHeight);

    // hidden video capture used by MediaPipe Camera util
    videoElement = createCapture(VIDEO, { flipped: selfieMode });
    videoElement.size(640, 480);
    videoElement.hide();

    colorMode(HSB, 360, 100, 100, 100);

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
    gesture = new GestureClassifier();
}

function onHandsResults(results) {
    detections = results;
}


let circleRadius = 50;
const BASE_CIRCLE_ALPHA = 50;
let circleAlpha = BASE_CIRCLE_ALPHA;
let cx = -100;
let cy = -100;
let targetX = 0;
let targetY = 0;
const LERP_AMOUNT = 0.95;
const FADE_TIME = 500;
const FADE_DURATION = 3000;
let lastMoveTime = 0;

function draw() {
    background(360, 0, 90); // white background (H=0, S=0, B=100)

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
            cx = lerp(cx, targetX, LERP_AMOUNT);
            cy = lerp(cy, targetY, LERP_AMOUNT);

            if (closeness.state === 'closed') {
                circleRadius = 50;
            } else {
                circleRadius = 20;
            }

            // draw label
            fill(0, 0, 0); // black text (H=0, S=0, B=0)
            textSize(16);
            textAlign(LEFT, TOP);
            text(`Closeness: ${closeness.closure.toFixed(2)}`, 10, 10);

            // draw hand
            //gesture.drawHands(landmarks);
        }
    }

    // calculate fade based on time since last movement
    const timeSinceMove = millis() - lastMoveTime;
    if (timeSinceMove < FADE_TIME) {
        circleAlpha = BASE_CIRCLE_ALPHA;
    } else {
        // fade out over FADE_DURATION seconds
        const fadeProgress = (timeSinceMove - FADE_TIME) / FADE_DURATION;
        circleAlpha = max(0, BASE_CIRCLE_ALPHA * (1 - fadeProgress));
    }
    // pointer with HSB color and alpha
    noStroke();
    fill(0, 0, 0, circleAlpha);
    // circle(cx, cy, circleRadius);
    rect(cx - circleRadius, cy - circleRadius / 2, circleRadius*2, circleRadius/2);
    rect(cx - circleRadius/4, cy, circleRadius/2, circleRadius*2);
}

window.setup = setup;
window.draw = draw;