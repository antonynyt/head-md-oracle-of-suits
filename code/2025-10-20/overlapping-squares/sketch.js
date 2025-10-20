const rectangles = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    // switch the color mode to HSB
    colorMode(HSB, 360, 100, 100, 100);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let w = random(50, 150);
            let h = w;
            rectangles.push({ x: random(width), y: random(height), w, h });
        }
    }

}

function draw() {
    background(255);
    noStroke();

    for (let rect of rectangles) {
        createRectangle(rect.x, rect.y, rect.w, rect.h);
    }


    
}

function createRectangle(x, y, w, h) {
    // the values of HSB are hue (0-360), saturation (0-100), brightness (0-100), and alpha (0-100)
    fill(18, 100, 100, 50); // HSB color with transparency
    rect(x, y, w, h);
}

