let grid = []
let gridXSize
let gridYSize

let spacing = 50

function setup() {
	createCanvas(windowWidth, windowHeight);

  	for (let i = 0; i < width / spacing; i++) {
      grid.push([])
      for (let j = 0; j < height / spacing; j++) {
        grid[i].push(Math.round(noise(i / 10, j / 10) * 1.2))
      }
	  }

	// Precache grid size
	gridXSize = grid.length
	gridYSize = grid[0].length

	// no borders
	noStroke()
  background(220, 220, 220)
  frameRate(50)
}

function draw() {
  // Use noise to create a slowly changing threshold
  let threshold = noise(frameCount / 100)
  
  // Create spreading centers using Perlin noise
  let centerX = noise(frameCount / 300) * gridXSize
  let centerY = noise(frameCount / 300) * gridYSize
  let spreadRadius = noise(frameCount / 200 + 2000) * 50 + 10
  
  for (let i = 0; i < gridXSize; i++) {
    for (let j = 0; j < gridYSize; j++) {
      // Calculate distance from spreading center
      let dist = sqrt(pow(i - centerX, 2) + pow(j - centerY, 2))
      let distFactor = 1 - (dist / spreadRadius)
      
      let n = noise(
        i / 10 + frameCount / 100,
        j / 10 + frameCount / 100
      )
      
      // Add distance factor to influence spreading
      let val = (n + distFactor * 0.5) > threshold ? 1 : 0
      
      if (val !== grid[i][j]) {
        grid[i][j] = val
        if (val === 1) {
          fill(255, 0, 255)
          rect(i * spacing, j * spacing, spacing, spacing)
        } else {
          fill(220, 220, 220)
          rect(i * spacing, j * spacing, spacing, spacing)
        }
      }
    }
  }
}