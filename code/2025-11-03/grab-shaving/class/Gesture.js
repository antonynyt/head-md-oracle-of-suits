export class GestureClassifier {
    constructor(opts = {}) {
        this.CLOSURE_THRESHOLD = opts.CLOSURE_THRESHOLD ?? 0.20;
        
        // Define hand connections for drawing
        this.HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],       // Index
            [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],// Ring
            [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
        ];
    }

    // helper: euclidean distance in 3D space
    _dist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    classify(landmarks) {
        if (!landmarks || landmarks.length < 21) return { state: 'unknown', closure: 0 };

        // Use the palm center (average of MCP joints) as reference instead of wrist
        const palmPoints = [
            landmarks[0],  // wrist
            landmarks[5],  // index MCP
            landmarks[9],  // middle MCP
            landmarks[13], // ring MCP  
            landmarks[17]  // pinky MCP
        ];

        // Calculate palm center
        const palmCenter = {
            x: palmPoints.reduce((sum, p) => sum + p.x, 0) / palmPoints.length,
            y: palmPoints.reduce((sum, p) => sum + p.y, 0) / palmPoints.length,
            z: palmPoints.reduce((sum, p) => sum + (p.z || 0), 0) / palmPoints.length
        };

        // Calculate palm size as average distance from palm center to MCP joints
        const palmSize = palmPoints.reduce((sum, point) => sum + this._dist(point, palmCenter), 0) / palmPoints.length;

        if (palmSize === 0) return { state: 'unknown', closure: 0 };

        // Check distances from finger tips to palm center
        const fingerTips = [
            landmarks[8],   // index finger tip
            landmarks[12],  // middle finger tip  
            landmarks[16],  // ring finger tip
            landmarks[20]   // pinky finger tip
        ];

        // Calculate how close each finger tip is to the palm center
        const tipToPalmDistances = fingerTips.map(tip => this._dist(tip, palmCenter));

        // When hand is open: tips are far from palm center
        // When hand is closed: tips are close to palm center
        // Normalize by palm size and calculate closure
        const normalizedDistances = tipToPalmDistances.map(d => d / palmSize);

        // Closure increases as fingers get closer to palm center
        // We expect open hand to have normalized distances around 2-3, closed around 1-1.5
        const closureScores = normalizedDistances.map(d => {
            // Map distance to closure score: 
            // d < 1.2 → fully closed (score 1)
            // d > 2.5 → fully open (score 0)  
            // Linear interpolation between
            if (d <= 1.2) return 1.0;
            if (d >= 2.5) return 0.0;
            return 1.0 - ((d - 1.2) / (2.5 - 1.2));
        });

        const closure = closureScores.reduce((sum, score) => sum + score, 0) / closureScores.length;

        // Determine state based on threshold
        const state = closure > this.CLOSURE_THRESHOLD ? 'closed' : 'open';

        return {
            state: state,
            closure: Math.max(0, Math.min(1, closure)),
            details: {
                fingerDistances: tipToPalmDistances,
                normalizedDistances: normalizedDistances,
                palmSize: palmSize,
                palmCenter: palmCenter
            }
        };
    }

    setClosureThreshold(threshold) {
        this.CLOSURE_THRESHOLD = Math.max(0, Math.min(1, threshold));
    }

    drawHands(landmarks, w = width, h = height) {
        push();
        // connections
        stroke(255, 255, 255);
        strokeWeight(2);
        for (const pair of this.HAND_CONNECTIONS) {
            const a = landmarks[pair[0]];
            const b = landmarks[pair[1]];
            if (!a || !b) continue;
            const ax = a.x * w;
            const ay = a.y * h;
            const bx = b.x * w;
            const by = b.y * h;
            line(ax, ay, bx, by);
        }

        // landmarks
        noStroke();
        fill(255, 255, 255);
        for (const lm of landmarks) {
            const x = lm.x * w;
            const y = lm.y * h;
            circle(x, y, 6);
        }
        pop();
    }
}