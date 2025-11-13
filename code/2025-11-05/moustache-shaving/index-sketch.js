import { SceneManager } from "./class/SceneManager.js";
import { GestureClassifier } from "./class/GestureClassifier.js";
import { HandCursor } from "./class/HandCursor.js";
import { handleLandmarks } from "./utils/HandleLandmarks.js";
import { KingScene, AceScene, RecomposeScene, AceEndScene, TBCScene } from "./scenes/index.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

let initialSceneName = "king";
let assets;
let videoElement;
let hands;
let cam;
let detections = null;
let gestureClassifier;
let smoothedGestureState = "open";
let openCandidateStartMs = null;
let handCursor;
let sceneManager;
let sharedContext;
let infoElement;
let textBubbleElement;
const OPEN_DEBOUNCE_MS = 300;

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

	if (assets.sounds.music) {
        assets.sounds.music.setLoop(true);
        assets.sounds.music.play();
		//volume set in p5js is from 0 to 1
		assets.sounds.music.setVolume(0.5);
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
		updateHandTracking: () => {
			const result = handleLandmarks(
				detections,
				gestureClassifier,
				handCursor,
				width,
				height,
				videoElement.width,
				videoElement.height
			);
			return smoothGestureResult(result);
		}
	};

	sceneManager = new SceneManager(sharedContext);
	sharedContext.switchScene = (name, params = {}) => sceneManager.switchTo(name, params);

	const scenes = {
		king: new KingScene(sharedContext),
		ace: new AceScene(sharedContext),
		recompose: new RecomposeScene(sharedContext),
		aceEnd: new AceEndScene(sharedContext),
		tbc: new TBCScene(sharedContext)
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

function smoothGestureResult(rawResult) {
	if (!rawResult) {
		openCandidateStartMs = null;
		return rawResult;
	}

	const now = (typeof performance !== "undefined" && typeof performance.now === "function")
		? performance.now()
		: Date.now();
	const rawState = rawResult.state || "open";
	const previousState = smoothedGestureState;

	if (rawState === "closed") {
		smoothedGestureState = "closed";
		openCandidateStartMs = null;
	} else if (rawState === "open") {
		if (previousState === "closed") {
			if (openCandidateStartMs === null) {
				openCandidateStartMs = now;
			}
			if (now - openCandidateStartMs >= OPEN_DEBOUNCE_MS) {
				smoothedGestureState = "open";
				openCandidateStartMs = null;
			} else {
				smoothedGestureState = "closed";
			}
		} else {
			smoothedGestureState = "open";
			openCandidateStartMs = null;
		}
	} else {
		smoothedGestureState = rawState;
		openCandidateStartMs = null;
	}

	return { ...rawResult, state: smoothedGestureState };
}

function loadAssets() {
	const king = loadImage("./assets/img/king.png");
	const pattern = loadImage("./assets/img/pattern.png");
	const moustachePrimary = loadImage("./assets/img/moustache-0.png");
	const moustacheAlt = loadImage("./assets/img/moustache-1.png");
	const moustacheEvil = loadImage("./assets/img/moustache-evil.png");
	const aceOfSpade = loadImage("./assets/img/aceofspade.png");
	const emptyCard = loadImage("./assets/img/empty-card.png");
	const aceCardDesign = loadImage("./assets/img/ace-card-design.png");
	const handOpen = loadImage("./assets/img/hand-open.png");
	const handClosed = loadImage("./assets/img/hand-closed.png");
	const shaving = loadSound("./assets/sounds/rasor.mp3");
	const music = loadSound("./assets/sounds/music.mp3");
	const recomposeVideo = "./assets/videos/recomposing.webm";
	const introAceVideo = "./assets/videos/intro-aceofspade.webm";
	const endAceVideo = "./assets/videos/end-aceofspade.webm";
	const tbcVideo = "./assets/videos/tbc.webm";

	return {
		images: {
			king,
			pattern,
			moustachePrimary,
			moustacheAlt,
			moustacheEvil,
			aceOfSpade,
			emptyCard,
			aceCardDesign,
			handOpen,
			handClosed
		},
		sounds: {
			shaving,
			music
		},
		videos: {
			recompose: recomposeVideo,
			introAce: introAceVideo,
			endAce: endAceVideo,
			tbc: tbcVideo
		}
	};
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;