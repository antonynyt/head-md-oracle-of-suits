let circles = [];
let playerCircle;

class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.targetR = r; // target radius for smooth growth

    this.offsetX = random(1000);
    this.offsetY = random(1000);
    this.fillColor = color(255, 100, 150);
  }
  
  collidesWith(other) {
    for (let o of other) {
      if (o !== this) {
        let d = dist(this.x, this.y, o.x, o.y);
        if (d < this.r + o.r) {
          return o;
        }
      }
    }
  }

  draw() {
    this.x += (noise(this.offsetX) - 0.5) * 2;
    this.y += (noise(this.offsetY) - 0.5) * 2;
    
    this.offsetX += 0.01;
    this.offsetY += 0.01;
    
    // Smoothly interpolate radius to target
    this.r = lerp(this.r, this.targetR, 0.1);
    
    fill(this.fillColor);
    noStroke();
    circle(this.x, this.y, this.r * 2);

    let collided = this.collidesWith(circles);
    if (collided) {
      // the bigger circle eats the smaller one
      if (this.r < collided.r) {
        collided.targetR += this.r; // add to target instead of directly
        circles.splice(circles.indexOf(this), 1);
      } else {
        this.targetR += collided.r; // add to target instead of directly
        circles.splice(circles.indexOf(collided), 1);
      }
    }
  }
}

class PlayerCircle extends Circle {
  constructor(x, y, r) {
    super(x, y, r);
    this.fillColor = color(50, 150, 250);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < (width * height / 10000); i++) {
    circles.push(new Circle(random(width), random(height), random(5, 10)));
  }
  playerCircle = new PlayerCircle(mouseX, mouseY, 10);
  circles.push(playerCircle);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  // Move player circle towards mouse position very slowly no acceleration
  playerCircle.x += (mouseX - playerCircle.x) * 0.02;
  playerCircle.y += (mouseY - playerCircle.y) * 0.02;

  for (let c of circles) {
    c.draw();
  }

  if (circles.indexOf(playerCircle) === -1) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Game Over!", width / 2, height / 2);
    noLoop();
  }

}
