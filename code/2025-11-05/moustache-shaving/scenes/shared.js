export function drawPatternCover(patternImg, canvasW, canvasH) {
    if (!patternImg) return;
    imageMode(CORNER);
    let patternWidth = patternImg.width;
    let patternHeight = patternImg.height;
    const maxPatternHeight = canvasH;
    if (patternHeight > maxPatternHeight) {
        const scale = maxPatternHeight / patternHeight;
        patternHeight = maxPatternHeight;
        patternWidth *= scale;
    }
    for (let x = 0; x < canvasW; x += patternWidth) {
        image(patternImg, x, 0, patternWidth, patternHeight);
    }
}

export function tilePattern(patternImg, canvasW, canvasH) {
    if (!patternImg) return;
    const patternWidth = patternImg.width;
    const patternHeight = patternImg.height;
    imageMode(CORNER);
    for (let x = 0; x < canvasW; x += patternWidth) {
        for (let y = 0; y < canvasH; y += patternHeight) {
            image(patternImg, x, y);
        }
    }
}
