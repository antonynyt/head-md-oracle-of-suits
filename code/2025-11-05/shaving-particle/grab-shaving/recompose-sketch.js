function setup() {
    createCanvas(windowWidth, windowHeight);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(220);
}

window.setup = setup;
window.windowResized = windowResized;
window.draw = draw;