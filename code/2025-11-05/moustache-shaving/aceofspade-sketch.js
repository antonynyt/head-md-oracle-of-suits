import { GestureClassifier } from "./class/GestureClassifier.js";
import { HandCursor } from "./class/HandCursor.js";
import { Moustache } from "./class/Moustache.js";
import { Character } from "./class/Character.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
import { handleLandmarks } from "./utils/HandleLandmarks.js";

let videoElement;
let hands;
let detections = null;
let cam;
let selfieMode = true;
let gestureClassifier;
let handCursor;
let moustache;
let aceofspadeCharacter;

//images
let aceofspadeImg;
let moustacheImg;
let pattern;
let handCursorImgs = {};

//sound
let shavingSound;

function preload() {
    aceofspadeImg = loadImage("./assets/img/aceofspade.png");
    moustacheImg = loadImage("./assets/img/moustache-evil.png");
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
        maxNumHands: 3,
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
    gestureClassifier = new GestureClassifier();
    handCursor = new HandCursor(handCursorImgs, shavingSound);

    // create character and place moustache at its anchor
    aceofspadeCharacter = new Character(aceofspadeImg, {
        maxHeightRatio: 0.8,
        maxWidthRatio: 0.7,
        anchor: { x: 0.5, y: 0.5 }, offsetY: 0
    });

    const moustachePos = aceofspadeCharacter.getMoustachePosition(width, height);
    moustache = new Moustache(moustachePos.x, moustachePos.y, 500, moustacheImg);
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

    let closeness = handleLandmarks(detections, gestureClassifier, handCursor, moustache, width, height, videoElement.width, videoElement.height);
    aceofspadeCharacter.draw(width, height);



    // cursor make the moustache change to a random position away form cursor

    moustache.draw(false);
    handCursor.draw();

    if (closeness && closeness.state === 'closed') {
        handCursor.showClosedHand();

        const cursor = handCursor.getTop();

        if (moustache.isIntersectingWith(cursor.x, cursor.y)) {
            //get a random position not too close from cursor
            
            let targetX, targetY;
            const minDistance = 500;
            const maxAttempts = 50;
            let attempts = 0;
            do {
                targetX = random(width);
                targetY = random(height);
                attempts++;
            } while (dist(targetX, targetY, cursor.x, cursor.y) < minDistance && attempts < maxAttempts);
            
            moustache.moveTo(targetX, targetY);
        }

    } else {
        handCursor.showOpenHand();
    }
}

window.setup = setup;
window.draw = draw;
window.preload = preload;
window.windowResized = windowResized;