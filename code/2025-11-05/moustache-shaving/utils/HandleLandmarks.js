export function handleLandmarks(detections, gesture, handCursor, canvasWidth, canvasHeight, videoWidth = 640, videoHeight = 480) {
    if (!detections || !detections.multiHandLandmarks || !detections.multiHandLandmarks.length) return;

    const handsLM = detections.multiHandLandmarks;

    // find closest hand by average z (more negative = closer)
    let closestIndex = 0;
    let closestDepth = Infinity;
    for (let i = 0; i < handsLM.length; i++) {
        const lm = handsLM[i];
        let sumZ = 0;
        for (let j = 0; j < lm.length; j++) sumZ += lm[j].z;
        const avgZ = sumZ / lm.length;
        if (avgZ < closestDepth) {
            closestDepth = avgZ;
            closestIndex = i;
        }
    }

    //ignore far hands
    // if (closestDepth > -0.03) return;

    const landmarks = handsLM[closestIndex];
    const closeness = gesture.classify(landmarks);

    let targetX = 0;
    let targetY = 0;
    for (let j = 0; j < landmarks.length; j++) {
        targetX += landmarks[j].x;
        targetY += landmarks[j].y;
    }
    targetX /= landmarks.length;
    targetY /= landmarks.length;

    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let mappedX, mappedY;
    if (canvasAspect > videoAspect) {
        const scaledHeight = canvasWidth / videoAspect;
        const offsetY = (canvasHeight - scaledHeight) / 2;
        mappedX = targetX * canvasWidth;
        mappedY = targetY * scaledHeight + offsetY;
    } else {
        const scaledWidth = canvasHeight * videoAspect;
        const offsetX = (canvasWidth - scaledWidth) / 2;
        mappedX = targetX * scaledWidth + offsetX;
        mappedY = targetY * canvasHeight;
    }

    handCursor.move(mappedX, mappedY);

    return closeness
}