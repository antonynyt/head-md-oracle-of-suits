import { Moustache } from "./class/Moustache.js";

let moustache;

//images
let moustacheImg = [];
let pattern;

function preload() {
    moustacheImg.push(loadImage("./assets/img/moustache-0.png"));
    moustacheImg.push(loadImage("./assets/img/moustache-1.png"));
    pattern = loadImage("./assets/img/pattern.png");
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    moustache = new Moustache(width / 2 - 10, height * 0.5, 500, moustacheImg[1]);

    colorMode(HSB, 360, 100, 100, 100);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(227, 84, 40);

    // draw patterned background
    let patternWidth = pattern.width;
    let patternHeight = pattern.height;

    for (let x = 0; x < width; x += patternWidth) {
        for (let y = 0; y < height; y += patternHeight) {
            image(pattern, x, y);
        }
    }

    //draw a big white star background shape
    noStroke();
    fill(0, 0, 100, 80);
    beginShape();
    const cx = width / 2;
    const cy = height / 2;
    const spikes = 10;
    const outerRadius = max(width / 2, height / 2);
    const innerRadius = outerRadius * 0.6;
    let angle = TWO_PI / spikes;
    let halfAngle = angle / 2.0;
    
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = cx + cos(a) * outerRadius;
        let sy = cy + sin(a) * outerRadius;
        vertex(sx, sy);
        sx = cx + cos(a + halfAngle) * innerRadius;
        sy = cy + sin(a + halfAngle) * innerRadius;
        vertex(sx, sy);
    }
    endShape(CLOSE);

    moustache.draw(false);
}

window.setup = setup;
window.windowResized = windowResized;
window.draw = draw;
window.preload = preload;