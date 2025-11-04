import { GestureClassifier } from "./class/Gesture.js";
import { Cursor } from "./class/Cursor.js";
import { Moustache } from "./class/Moustache.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

let videoElement;
let hands;
let detections = null;
let cam;
let selfieMode = true;
let gesture;
let cursor;
let moustache;
let shavingPath = [];
let isShaving = false;

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
        maxNumHands: 1,
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
    cursor = new Cursor();
    moustache = new Moustache(width / 2, height / 2, 200);
}

function onHandsResults(results) {
    detections = results;
}

function draw() {
    background(360, 0, 90); // white background (H=0, S=0, B=100)

    // draw landmarks and gesture labels
    if (detections && detections.multiHandLandmarks) {
        for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
            const landmarks = detections.multiHandLandmarks[i];
            const closeness = gesture.classify(landmarks);

            let targetX = 0;
            let targetY = 0;
            for (let j = 0; j < landmarks.length; j++) {
                targetX += landmarks[j].x * width;
                targetY += landmarks[j].y * height;
            }
            targetX /= landmarks.length;
            targetY /= landmarks.length;

            cursor.update(targetX, targetY);

            if (closeness.state === 'closed') {
                cursor.setRadius(50);

                if (!isShaving) isShaving = true;
                shavingPath.push(createVector(cursor.x, cursor.y));
            } else {
                cursor.setRadius(20);
                if (isShaving) isShaving = false;
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

    if (shavingPath.length > 1) {
        noFill();
        stroke(0, 0, 100); // black stroke
        strokeWeight(50);
        beginShape();
        for (let point of shavingPath) {
            vertex(point.x, point.y);
        }
        endShape();
    }

    if (moustache.isTouching(cursor.x, cursor.y, cursor.radius)) {
        moustache.jumpAway(cursor.x, cursor.y);
    }

    moustache.float();
    moustache.draw();
    cursor.draw();
}

window.setup = setup;
window.draw = draw;