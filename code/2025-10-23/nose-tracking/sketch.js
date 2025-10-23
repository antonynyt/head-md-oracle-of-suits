// the blendshapes we are going to track
let leftEyeBlink = 0.0;
let rightEyeBlink = 0.0;
let jawOpen = 0.0;
let videoDisplay = { x: 0, y: 0, width: 0, height: 0 };
let drawingLayer; // Graphics layer for persistent drawing

// Calibration variables
let calibrationTarget = null;
let calibrationPoints = [];
let isBlinking = false;
let blinkThreshold = 0.5;
let minCalibrationPoints = 9; // 3x3 grid
let isCalibrated = false;

// Nose cursor
let noseCursor = { x: 0, y: 0 };
let showNoseCursor = true;

// Smoothing for nose position
let noseHistory = [];
let noseHistorySize = 5;

// Calibration transform (will be computed from calibration points)
let calibrationTransform = null;

function setup() {
  // full window canvas
  createCanvas(windowWidth, windowHeight);
  drawingLayer = createGraphics(windowWidth, windowHeight); // Create drawing layer
  drawingLayer.clear(); // Start with transparent layer
  setupFace({ selfieMode: false });
  setupVideo(false);
  
  // Create first target
  createNewTarget();
}

function createNewTarget() {
  // Create targets in a grid pattern for better calibration
  if (calibrationPoints.length < minCalibrationPoints) {
    const cols = 3;
    const rows = 3;
    const margin = 150;
    const gridIndex = calibrationPoints.length;
    const col = gridIndex % cols;
    const row = Math.floor(gridIndex / cols);
    
    calibrationTarget = {
      x: map(col, 0, cols - 1, margin, width - margin),
      y: map(row, 0, rows - 1, margin, height - margin),
      size: 30
    };
  } else {
    // After calibration, random targets for testing
    calibrationTarget = {
      x: random(100, width - 100),
      y: random(100, height - 100),
      size: 30
    };
  }
}

function computeCalibrationTransform() {
  if (calibrationPoints.length < minCalibrationPoints) return;
  
  // Simple polynomial regression for mapping nose position to screen
  // Using least squares to find best fit
  let sumX = 0, sumY = 0, sumNX = 0, sumNY = 0;
  let sumNX2 = 0, sumNY2 = 0, sumXNX = 0, sumYNY = 0;
  
  for (let pt of calibrationPoints) {
    sumX += pt.target.x;
    sumY += pt.target.y;
    sumNX += pt.nose.x;
    sumNY += pt.nose.y;
    sumNX2 += pt.nose.x * pt.nose.x;
    sumNY2 += pt.nose.y * pt.nose.y;
    sumXNX += pt.target.x * pt.nose.x;
    sumYNY += pt.target.y * pt.nose.y;
  }
  
  const n = calibrationPoints.length;
  
  // Linear regression coefficients
  const slopeX = (n * sumXNX - sumNX * sumX) / (n * sumNX2 - sumNX * sumNX);
  const interceptX = (sumX - slopeX * sumNX) / n;
  
  const slopeY = (n * sumYNY - sumNY * sumY) / (n * sumNY2 - sumNY * sumNY);
  const interceptY = (sumY - slopeY * sumNY) / n;
  
  calibrationTransform = {
    slopeX, interceptX,
    slopeY, interceptY
  };
  
  isCalibrated = true;
  console.log('Calibration terminée!', calibrationTransform);
}

function mapNoseToScreen(noseX, noseY) {
  if (!isCalibrated || !calibrationTransform) {
    // Fallback to simple mapping
    return {
      x: map(noseX, 0, videoElement.width, 0, width),
      y: map(noseY, 0, videoElement.height, 0, height)
    };
  }
  
  // Use calibration transform
  return {
    x: calibrationTransform.slopeX * noseX + calibrationTransform.interceptX,
    y: calibrationTransform.slopeY * noseY + calibrationTransform.interceptY
  };
}

function smoothNose(x, y) {
  noseHistory.push({ x, y });
  if (noseHistory.length > noseHistorySize) {
    noseHistory.shift();
  }
  
  let sumX = 0, sumY = 0;
  for (let pt of noseHistory) {
    sumX += pt.x;
    sumY += pt.y;
  }
  
  return {
    x: sumX / noseHistory.length,
    y: sumY / noseHistory.length
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recreate drawing layer on resize
  let oldLayer = drawingLayer;
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.image(oldLayer, 0, 0);
  
  // Reset calibration on resize
  isCalibrated = false;
  calibrationPoints = [];
  calibrationTransform = null;
  createNewTarget();
}

function draw() {
  // Clear main canvas and redraw video
  background(0);
  
  // Show video smaller in corner during calibration
  push();
  let videoSize = 160;
  image(videoElement, width - videoSize - 10, 10, videoSize, videoSize * videoElement.height / videoElement.width);
  pop();

  // Draw calibration target
  if (calibrationTarget) {
    push();
    
    // Pulse animation
    let pulse = sin(frameCount * 0.1) * 5 + calibrationTarget.size;
    
    fill(255, 100, 100, 200);
    noStroke();
    circle(calibrationTarget.x, calibrationTarget.y, pulse);
    
    // Inner circle
    fill(255, 50, 50);
    circle(calibrationTarget.x, calibrationTarget.y, 10);
    
    // Progress indicator
    if (calibrationPoints.length < minCalibrationPoints) {
      fill(255);
      textAlign(CENTER);
      textSize(16);
      text(`${calibrationPoints.length + 1}/${minCalibrationPoints}`, 
           calibrationTarget.x, calibrationTarget.y + pulse/2 + 20);
    }
    pop();
  }

  // get detected faces
  let faces = getFaceLandmarks();

  // if we have at least one face
  if (faces && faces.length > 0) {
    // Get blink scores
    leftEyeBlink = getBlendshapeScore('eyeBlinkLeft', 0);
    rightEyeBlink = getBlendshapeScore('eyeBlinkRight', 0);
    
    // Detect blink (both eyes)
    let bothEyesBlink = (leftEyeBlink > blinkThreshold && rightEyeBlink > blinkThreshold);
    
    // Get nose tip position (landmark index 4 is typically the nose tip)
    const noseTip = faces[0][4]; // Nose tip landmark
    
    let noseX = 0, noseY = 0;
    let hasNose = false;
    
    if (noseTip) {
      // Convert normalized coordinates to pixel coordinates
      noseX = noseTip.x * videoElement.width;
      noseY = noseTip.y * videoElement.height;
      hasNose = true;
      
      // Draw nose position on video
      push();
      let videoSize = 160;
      let scale = videoSize / videoElement.width;
      let vx = width - videoSize - 10;
      let vy = 10;
      fill(255, 255, 0);
      noStroke();
      circle(vx + noseX * scale, vy + noseY * scale, 8);
      pop();
    }
    
    // Update nose cursor position with calibration
    if (hasNose) {
      let mapped = mapNoseToScreen(noseX, noseY);
      let smoothed = smoothNose(mapped.x, mapped.y);
      noseCursor.x = smoothed.x;
      noseCursor.y = smoothed.y;
    }
    
    // Check for blink to validate target
    if (bothEyesBlink && !isBlinking && calibrationTarget) {
      // Save calibration point
      calibrationPoints.push({
        target: { x: calibrationTarget.x, y: calibrationTarget.y },
        nose: { x: noseX, y: noseY }
      });
      
      console.log('Point calibré:', calibrationPoints.length);
      
      // Compute transform when we have enough points
      if (calibrationPoints.length === minCalibrationPoints) {
        computeCalibrationTransform();
      }
      
      // Create new target
      createNewTarget();
      
      isBlinking = true;
    } else if (!bothEyesBlink) {
      isBlinking = false;
    }
  }
  
  // Draw nose cursor
  if (showNoseCursor) {
    push();
    noFill();
    
    // Color based on calibration state
    if (isCalibrated) {
      stroke(0, 255, 0);
    } else {
      stroke(255, 200, 0);
    }
    
    strokeWeight(2);
    circle(noseCursor.x, noseCursor.y, 30);
    strokeWeight(1);
    line(noseCursor.x - 15, noseCursor.y, noseCursor.x + 15, noseCursor.y);
    line(noseCursor.x, noseCursor.y - 15, noseCursor.x, noseCursor.y + 15);
    pop();
  }
  
  // Display calibration info
  push();
  fill(255);
  textAlign(LEFT);
  textSize(20);
  
  if (!isCalibrated) {
    text(`Calibration: ${calibrationPoints.length}/${minCalibrationPoints}`, 10, 30);
    text(`Pointez le nez vers la cible et clignez`, 10, 60);
  } else {
    text(`✓ Calibré - Nose tracking actif`, 10, 30);
    text(`'R' pour recalibrer`, 10, 60);
  }
  
  text(`Position nez: (${int(noseCursor.x)}, ${int(noseCursor.y)})`, 10, height - 20);
  pop();
}

// Reset calibration with 'R' key
function keyPressed() {
  if (key === 'r' || key === 'R') {
    isCalibrated = false;
    calibrationPoints = [];
    calibrationTransform = null;
    noseHistory = [];
    createNewTarget();
    console.log('Calibration réinitialisée');
  }
}