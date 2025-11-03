import {
    FaceLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";


let capture;
let faceLandmarker;
let faces;
let runningMode = "VIDEO";

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);

    capture = createCapture(VIDEO, { flipped: false });
    capture.hide();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    background(0);
    
    // WEBGL uses center origin, so no need to translate
    orbitControl(); // Optional: allows mouse interaction

    if (faceLandmarker && capture.loadedmetadata) {
        const startTimeMs = performance.now();
        faces = faceLandmarker.detectForVideo(capture.elt, startTimeMs);

        if (faces.faceLandmarks.length > 0) {
            let face = faces.faceLandmarks[0];
            
            // Scale factor for the 3D mesh
            let scale = 400;
            
            // Create texture from video
            texture(capture);
            noStroke();
            
            // Draw face mesh using triangles from MediaPipe
            if (faces.faceBlendshapes && FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
                const triangles = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
                
                beginShape(TRIANGLES);
                for (let i = 0; i < triangles.length; i += 3) {
                    for (let j = 0; j < 3; j++) {
                        let idx = triangles[i + j];
                        let landmark = face[idx];
                        
                        // Convert normalized coords to 3D space
                        let x = (landmark.x - 0.5) * scale;
                        let y = (landmark.y - 0.5) * scale;
                        let z = landmark.z * scale;
                        
                        // Texture coordinates
                        let u = landmark.x * capture.width;
                        let v = landmark.y * capture.height;
                        
                        vertex(x, y, z, u, v);
                    }
                }
                endShape();
            } else {
                // Fallback: draw points if tesselation not available
                stroke(255);
                strokeWeight(2);
                noFill();
                
                beginShape(POINTS);
                for (let landmark of face) {
                    let x = (landmark.x - 0.5) * scale;
                    let y = (landmark.y - 0.5) * scale;
                    let z = landmark.z * scale;
                    vertex(x, y, z);
                }
                endShape();
            }
        }
    }
}

const createFaceLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
        },
        runningMode: runningMode,
        numFaces: 1,
    });
};
createFaceLandmarker();

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;