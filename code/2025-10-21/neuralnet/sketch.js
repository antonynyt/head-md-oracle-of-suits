import { Cross } from './class/Cross.js';
import { Line } from './class/Line.js';

window.setup = setup
window.draw = draw
window.windowResized = windowResized
window.mousePressed = mousePressed

const crosses = [];
const lines = [];
const REST_LENGTH = 250;
const CROSS_SIZE = 20;
const FOLDS = 20;

function setup() {
  createCanvas(windowWidth, windowHeight)
  for (let i = 0; i < 5; i++) {
    const x = noise(i * 50) * width;
    const y = noise(i * 50 + 1000) * height;
    crosses.push(new Cross(x, y, CROSS_SIZE));
  }
  
  // Create lines between all pairs of crosses
  updateLines();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function draw() {
  background(45, 60, 185);

  crosses.forEach(cross => {
    cross.animate();
    cross.draw();
  });

  lines.forEach(line => {
    line.draw();
  });
}

function mousePressed() {
  crosses.push(new Cross(mouseX, mouseY, CROSS_SIZE));
  updateLines();
}

function updateLines() {
  lines.length = 0; // Clear existing lines
  for (let i = 0; i < crosses.length; i++) {
    for (let j = i + 1; j < crosses.length; j++) {
      lines.push(new Line(crosses[i], crosses[j], REST_LENGTH, FOLDS));
    }
  }
}