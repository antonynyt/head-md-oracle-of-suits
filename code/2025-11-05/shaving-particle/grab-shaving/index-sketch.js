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
let handCursor;
let moustache;

//images
let king;
let moustacheImg = [];
let pattern;
let handCursorImgs = {};

//sound
let shavingSound;

function preload() {
    king = loadImage("./assets/img/king.png");
    moustacheImg.push(loadImage("./assets/img/moustache-0.png"));
    pattern = loadImage("./assets/img/pattern.png");
    handCursorImgs.open = loadImage("./assets/img/hand-open.png");
    handCursorImgs.closed = loadImage("./assets/img/hand-closed.png");

    //load sound
    shavingSound = loadSound("./assets/sounds/rasor.mp3");
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    videoElement = createCapture(VIDEO, { flipped: selfieMode });
    videoElement.size(640, 480);
    videoElement.hide();

    colorMode(HSB, 360, 100, 100, 100);

    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.1,
        selfieMode: selfieMode,
    });

    hands.onResults(onHandsResults);

    cam = new Camera(videoElement.elt, {
        onFrame: async () => {
            await hands.send({ image: videoElement.elt });
        },
        width: width,
        height: height
    });

    cam.start();
    gesture = new GestureClassifier();
    handCursor = new Cursor(handCursorImgs, shavingSound);
    moustache = new Moustache(width / 2 - 10, height * 0.62, 500, moustacheImg[0]);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function onHandsResults(results) {
    detections = results;
}

function draw() {
    background(227, 84, 40);
    //add pattern overlay
    //aspect cover image
    imageMode(CORNER);
    let patternWidth = pattern.width;
    let patternHeight = pattern.height;
    const maxPatternHeight = height;
    if (patternHeight > maxPatternHeight) {
        const scale = maxPatternHeight / patternHeight;
        patternHeight = maxPatternHeight;
        patternWidth = patternWidth * scale;
    }
    image(pattern, 0, 0, patternWidth, patternHeight);

    imageMode(CENTER);
    let imgWidth = king.width;
    let imgHeight = king.height;
    const maxImgHeight = height * 0.8;
    const maxImgWidth = width;
    if (imgHeight > maxImgHeight) {
        const scale = maxImgHeight / imgHeight;
        imgHeight = maxImgHeight;
        imgWidth = imgWidth * scale;
    }
    if (imgWidth > maxImgWidth) {
        const scale = maxImgWidth / imgWidth;
        imgWidth = maxImgWidth;
        imgHeight = imgHeight * scale;
    }

    image(king, width / 2, height - imgHeight / 2 + 100, imgWidth, imgHeight);

    landmarks();

    if (moustache.isFullyErased()) {
        // If the moustache is fully erased, trigger a "shaving" event
        window.location.href = "recompose.html";
    }

    moustache.draw();
    handCursor.draw();
}

function landmarks() {
    if (detections && detections.multiHandLandmarks) {
        for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
            const landmarks = detections.multiHandLandmarks[i];
            const closeness = gesture.classify(landmarks);

            let targetX = 0;
            let targetY = 0;
            for (let j = 0; j < landmarks.length; j++) {
                targetX += landmarks[j].x;
                targetY += landmarks[j].y;
            }
            targetX /= landmarks.length;
            targetY /= landmarks.length;

            const videoAspect = 640 / 480;
            const canvasAspect = width / height;

            let mappedX, mappedY;
            if (canvasAspect > videoAspect) {
                const scaledHeight = width / videoAspect;
                const offsetY = (height - scaledHeight) / 2;
                mappedX = targetX * width;
                mappedY = targetY * scaledHeight + offsetY;
            } else {
                const scaledWidth = height * videoAspect;
                const offsetX = (width - scaledWidth) / 2;
                mappedX = targetX * scaledWidth + offsetX;
                mappedY = targetY * height;
            }

            handCursor.update(mappedX, mappedY);

            if (closeness.state === 'closed') {
                handCursor.close();
                // erase moustache under the cursor (use canvas coords)
                moustache.eraseAt(mappedX, mappedY, handCursor.radius || 50);
            } else {
                handCursor.open();
            }

            fill(0, 0, 0);
            textSize(16);
            textAlign(LEFT, TOP);
            text(`Closeness: ${closeness.closure.toFixed(2)}`, 10, 10);
        }
    }
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
window.windowResized = windowResized;