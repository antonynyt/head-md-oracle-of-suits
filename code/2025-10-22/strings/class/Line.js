export class Line {
  constructor(crossA, crossB, restLength = 250, folds = 20) {
    this.crossA = crossA;
    this.crossB = crossB;
    this.restLength = restLength;
    this.folds = folds;
  }

  getPoints() {
    // Generate and return the folding points
    let a = this.crossA;
    let b = this.crossB;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let distanceBetweenPoints = sqrt(dx * dx + dy * dy);

    let points = [];
    for (let k = 0; k <= this.folds; k++) {
      let t = k / this.folds;
      let x = lerp(a.x, b.x, t);
      let y = lerp(a.y, b.y, t);

      if (distanceBetweenPoints < this.restLength) {
        let slackDroop = (this.restLength - distanceBetweenPoints) * 0.5 * sin(PI * t);
        y += slackDroop;
      }
      points.push({ x, y });
    }
    return points;
  }

  draw() {
    let points = this.getPoints();

    push();
    stroke(255, 120);
    noFill();
    beginShape();
    points.forEach(pt => vertex(pt.x, pt.y));
    endShape();
    pop();
  }
}