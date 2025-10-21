const grid = []
const spacing = 20
let gridXSize
let gridYSize

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);

  gridXSize = Math.floor(windowWidth / spacing);
  gridYSize = Math.floor(windowHeight / spacing);

  // noLoop();
  frameRate(20);
}

function draw() {
  background(255);
  for (let x = 0; x < gridXSize; x++) {
    for (let y = 0; y < gridYSize; y++) {
      push(); // Save transformation state


      // Center the grid in the canvas
      const offsetX = (windowWidth - (gridXSize - 1) * spacing) / 2;
      const offsetY = (windowHeight - (gridYSize - 1) * spacing) / 2;
      translate(x * spacing + offsetX, y * spacing + offsetY);
      // rotate(random(TWO_PI)); // Random rotation

      noStroke();

      let n = noise(x / 10 + frameCount / 100, y / 10 + frameCount / 100);
      const val = n > 0.5 ? 1 : 0;

      if (val === 1) {
        //new noise for color 2 colors
        const nColor = noise(x / 5 + frameCount / 50, y / 5 + frameCount / 50);
        if (nColor > 0.5) {
          fill(25, 80, 100);
        } else {
          fill(255, 50, 50);
        }
      }

      rect(0, 0, spacing, spacing);


      pop(); // Restore transformation state

    }
  }
}