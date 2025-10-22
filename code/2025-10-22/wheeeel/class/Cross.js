export class Cross {
  constructor(x, y, size, angle = PI / 4) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.angle = angle;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    strokeWeight(2);
    stroke(255);
    strokeCap(SQUARE);
    line(-this.size / 2, 0, this.size / 2, 0);
    line(0, -this.size / 2, 0, this.size / 2);
    noFill();
    circle(0, 0, this.size);
    circle(0, 0, this.size / 2);
    pop();
  }

  animate () {
    // Animate position with Perlin noise
    const time = frameCount * 0.01;
    this.x += (noise(this.x * 0.01, time) - 0.5) * 2;
    this.y += (noise(this.y * 0.01, time + 1000) - 0.5) * 2;

    // Physics update
    this.vx += this.ax;
    this.vy += this.ay;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95; // damping
    this.vy *= 0.95;
    this.ax = 0;
    this.ay = 0;
  }

  applyForce(fx, fy) {
    this.ax += fx;
    this.ay += fy;
  }
}