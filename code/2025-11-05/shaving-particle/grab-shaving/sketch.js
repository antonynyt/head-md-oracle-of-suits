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
let isShaving = false;

//images
let king;
let moustacheImg;

function preload() {
    king = loadImage("./assets/img/king.png");
    moustacheImg = loadImage("./assets/img/moustache.png");
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
    cursor = new Cursor();
    moustache = new Moustache(width / 2, height / 2 - 50, 300, moustacheImg);
}

function onHandsResults(results) {
    detections = results;
}

function draw() {
    background(222, 21, 100);
    
    imageMode(CENTER);
    let imgWidth = king.width;
    let imgHeight = king.height;
    const maxImgHeight = height * 0.95;
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
    image(king, width / 2, height / 2, imgWidth, imgHeight);
    
    landmarks();
    
    moustache.draw();
    cursor.draw();
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
            
            cursor.update(mappedX, mappedY);
            
            if (closeness.state === 'closed') {
                cursor.setRadius(50);
                isShaving = true;
            } else {
                cursor.setRadius(20);
                isShaving = false;
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