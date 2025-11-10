import { SceneManager } from "./class/SceneManager.js";
import { GestureClassifier } from "./class/GestureClassifier.js";
import { HandCursor } from "./class/HandCursor.js";
import { handleLandmarks } from "./utils/HandleLandmarks.js";
import { KingScene, AceScene, RecomposeScene } from "./scenes/index.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

let initialSceneName = "king";
let assets;
let videoElement;
let hands;
let cam;
let detections = null;
let gestureClassifier;
let handCursor;
let sceneManager;
let sharedContext;
let infoElement;
let textBubbleElement;

const urlScene = new URLSearchParams(window.location.search).get("scene");
if (typeof urlScene === "string" && urlScene.length > 0) {
	initialSceneName = urlScene;
}

function preload() {
	assets = loadAssets();
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	colorMode(HSB, 360, 100, 100, 100);

	if (!infoElement) {
		infoElement = document.getElementById("info");
	}
	if (!textBubbleElement) {
		textBubbleElement = document.getElementById("textBubble");
	}

	gestureClassifier = new GestureClassifier();
	handCursor = new HandCursor({ open: assets.images.handOpen, closed: assets.images.handClosed }, assets.sounds.shaving);

	initialiseHands();

	sharedContext = {
		assets,
		handCursor,
		gestureClassifier,
		setOverlayText: ({ info, bubble } = {}) => {
			if (typeof info === "string" && infoElement) {
				infoElement.textContent = info;
			}
			if (typeof bubble === "string" && textBubbleElement) {
				textBubbleElement.textContent = bubble;
			}
		},
		updateHandTracking: () => handleLandmarks(
			detections,
			gestureClassifier,
			handCursor,
			width,
			height,
			videoElement.width,
			videoElement.height
		)
	};

	sceneManager = new SceneManager(sharedContext);
	sharedContext.switchScene = (name, params = {}) => sceneManager.switchTo(name, params);

	const scenes = {
		king: new KingScene(sharedContext),
		ace: new AceScene(sharedContext),
		recompose: new RecomposeScene(sharedContext)
	};

	Object.entries(scenes).forEach(([name, sceneInstance]) => {
		sceneManager.register(name, sceneInstance);
	});

	const targetScene = scenes[initialSceneName] ? initialSceneName : "king";
	sceneManager.switchTo(targetScene);
}

function draw() {
	sceneManager.draw();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	sceneManager.resize(width, height);
}

function initialiseHands() {
	const selfieMode = true;
	videoElement = createCapture(VIDEO, { flipped: selfieMode });
	videoElement.size(640, 480);
	videoElement.hide();

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

	hands.onResults((results) => {
		detections = results;
	});

	cam = new Camera(videoElement.elt, {
		onFrame: async () => {
			await hands.send({ image: videoElement.elt });
		},
		width: width,
		height: height
	});

	cam.start();
}

function loadAssets() {
	const king = loadImage("./assets/img/king.png");
	const pattern = loadImage("./assets/img/pattern.png");
	const moustachePrimary = loadImage("./assets/img/moustache-0.png");
	const moustacheAlt = loadImage("./assets/img/moustache-1.png");
	const moustacheEvil = loadImage("./assets/img/moustache-evil.png");
	const aceOfSpade = loadImage("./assets/img/aceofspade.png");
	const handOpen = loadImage("./assets/img/hand-open.png");
	const handClosed = loadImage("./assets/img/hand-closed.png");
	const shaving = loadSound("./assets/sounds/rasor.mp3");
	const recomposeVideo = "./assets/videos/recomposing.webm";

	return {
		images: {
			king,
			pattern,
			moustachePrimary,
			moustacheAlt,
			moustacheEvil,
			aceOfSpade,
			handOpen,
			handClosed
		},
		sounds: {
			shaving
		},
		videos: {
			recompose: recomposeVideo
		}
	};
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;