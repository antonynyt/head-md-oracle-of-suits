import { Cross } from './class/Cross.js';
import { Line } from './class/Line.js';
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

window.setup = setup
window.draw = draw
window.windowResized = windowResized

const REST_LENGTH = 250;
const CROSS_SIZE = 20;
const FOLDS = 20;

let handLandmarker;
let runningMode = "VIDEO";
let video;
let lastVideoTime = -1;

// Finger tip indices in MediaPipe hand landmarks
const FINGER_TIPS = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
const WRIST_INDEX = 0; // Wrist landmark

// Track crosses for each hand (0 and 1) and finger
const handCrosses = {
  0: {}, // First hand
  1: {}  // Second hand
};

let activeCrosses = [];

// Video display dimensions
let videoDisplay = { x: 0, y: 0, width: 0, height: 0 };

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
    numHands: 2, // Support 2 hands
  });
};

async function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Setup video capture
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  await createHandLandmarker();
  
  // Initialize crosses for each hand and finger (10 crosses total)
  for (let handIndex = 0; handIndex < 2; handIndex++) {
    FINGER_TIPS.forEach(tipIndex => {
      const cross = new Cross(0, 0, CROSS_SIZE);
      handCrosses[handIndex][tipIndex] = cross;
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Check if finger is extended by comparing distance to wrist
function isFingerExtended(landmarks, fingerIndex) {
  const tipIndex = FINGER_TIPS[fingerIndex];
  const wrist = landmarks[WRIST_INDEX];
  const tip = landmarks[tipIndex];
  
  // Calculate 3D distance between tip and wrist
  const dx = tip.x - wrist.x;
  const dy = tip.y - wrist.y;
  const dz = tip.z - wrist.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Threshold varies by finger (thumb is shorter, pinky is shorter)
  const thresholds = [0.15, 0.20, 0.22, 0.21, 0.18]; // Thumb, Index, Middle, Ring, Pinky
  
  return distance > thresholds[fingerIndex];
}

function draw() {
  background(45, 60, 185);

  // Draw video background with opacity and aspect ratio
  if (video && video.loadedmetadata) {
    push();
    tint(255, 20); // 20/255 opacity
    
    // Calculate aspect ratio scaling
    const videoAspect = video.width / video.height;
    const canvasAspect = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (canvasAspect > videoAspect) {
      // Canvas is wider - fit to width
      drawWidth = width;
      drawHeight = width / videoAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      // Canvas is taller - fit to height
      drawHeight = height;
      drawWidth = height * videoAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    }
    
    // Store video display dimensions for landmark mapping
    videoDisplay = { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
    
    // Flip horizontally for mirror effect
    translate(drawX + drawWidth, drawY);
    scale(-1, 1);
    image(video, 0, 0, drawWidth, drawHeight);
    pop();
  }

  // Detect hand landmarks
  if (handLandmarker && video.loadedmetadata) {
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.time()) {
      lastVideoTime = video.time();
      const results = handLandmarker.detectForVideo(video.elt, startTimeMs);
      
      activeCrosses = [];
      
      if (results.landmarks && results.landmarks.length > 0) {
        // Update crosses for each detected hand
        results.landmarks.forEach((landmarks, handIndex) => {
          if (handIndex < 2) { // Only process first 2 hands
            FINGER_TIPS.forEach((tipIndex, fingerIndex) => {
              // Only add cross if finger is extended
              if (isFingerExtended(landmarks, fingerIndex)) {
                const tip = landmarks[tipIndex];
                
                // Map normalized coordinates to video display area
                const x = videoDisplay.x + (1 - tip.x) * videoDisplay.width; // Mirror x
                const y = videoDisplay.y + tip.y * videoDisplay.height;
                
                const cross = handCrosses[handIndex][tipIndex];
                cross.x = x;
                cross.y = y;
                activeCrosses.push(cross);
              }
            });
          }
        });
      }
    }
  }

  // Draw crosses
  activeCrosses.forEach(cross => {
    cross.draw();
  });

  // Draw lines between active crosses
  for (let i = 0; i < activeCrosses.length; i++) {
    for (let j = i + 1; j < activeCrosses.length; j++) {
      const line = new Line(activeCrosses[i], activeCrosses[j], REST_LENGTH, FOLDS);
      line.draw();
    }
  }
}