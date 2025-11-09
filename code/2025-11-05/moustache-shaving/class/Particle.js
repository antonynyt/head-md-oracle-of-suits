// Particle System Simulation with Random Rotation
// The Nature of Code
// The Coding Train / Daniel Shiffman

export class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(0.5, 2));
    this.acc = createVector(0, 0);
    this.w = 20;
    this.h = 1;
    this.lifetime = 255;

    // NEW: Add rotation and spin
    this.angle = random(TWO_PI);
    this.angularVelocity = random(-0.1, 0.1); // random spin speed
  }

  finished() {
    return this.lifetime < 0;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    this.lifetime -= 5;

    // Update rotation
    this.angle += this.angularVelocity;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);

    //stroke color red


    const color = 150;
    fill(color, this.lifetime);
    rectMode(CENTER); // so rotation looks centered
    rect(0, 0, this.w, this.h);

    pop();
  }
}
