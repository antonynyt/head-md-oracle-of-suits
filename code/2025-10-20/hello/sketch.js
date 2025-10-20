let img;

function preload() {
  img = loadImage('img/pingu.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(150, 150, 255);
}

function draw() {
  if (mouseIsPressed) {
    fill(0);
    // image(img, mouseX-50, mouseY-50, 100, 100);
    line(mouseX-25, mouseY-25, mouseX+25, mouseY+25);
  }
}

