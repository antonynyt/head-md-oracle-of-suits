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
let kingCharacter;

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
    kingCharacter = new Character(king, { anchor: { x: 0.48, y: 0.47 }, offsetY: 40 });
    const moustachePos = kingCharacter.getMoustachePosition(width, height);
    // keep moustache width as before (500) or tune to image size if needed
    moustache = new Moustache(moustachePos.x, moustachePos.y, 600, moustacheImg[0]);
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

    kingCharacter.draw(width, height);
    let closeness = handleLandmarks(detections, gestureClassifier, handCursor, moustache, width, height, videoElement.width, videoElement.height);

    if (moustache.isFullyErased()) {
        //go to page recompose.html preserve history
        window.location.href = "recompose.html";
    }

    moustache.draw(true);

    if (closeness && closeness.state === 'closed') {
        handCursor.showClosedHand();
        const cursorTop = handCursor.getTop();
        moustache.eraseAt(cursorTop.x, cursorTop.y, 50);
    } else {
        handCursor.showOpenHand();
    }

    handCursor.draw();
}


window.setup = setup;
window.draw = draw;
window.preload = preload;
window.windowResized = windowResized;