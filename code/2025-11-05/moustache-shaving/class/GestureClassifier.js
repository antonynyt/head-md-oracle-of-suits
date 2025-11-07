export class GestureClassifier {
    constructor(opts = {}) {
        this.CLOSURE_THRESHOLD = opts.CLOSURE_THRESHOLD ?? 0.20;
        this.HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20]
        ];
    }

    _dist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    classify(landmarks) {
        if (!landmarks || landmarks.length < 21) return { state: 'unknown', closure: 0 };

        const palmPoints = [
            landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]
        ];

        const palmCenter = {
            x: palmPoints.reduce((sum, p) => sum + p.x, 0) / palmPoints.length,
            y: palmPoints.reduce((sum, p) => sum + p.y, 0) / palmPoints.length,
            z: palmPoints.reduce((sum, p) => sum + (p.z || 0), 0) / palmPoints.length
        };

        const palmSize = palmPoints.reduce((sum, point) => sum + this._dist(point, palmCenter), 0) / palmPoints.length;
        if (palmSize === 0) return { state: 'unknown', closure: 0 };

        const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
        const tipToPalmDistances = fingerTips.map(tip => this._dist(tip, palmCenter));
        const normalizedDistances = tipToPalmDistances.map(d => d / palmSize);

        const closureScores = normalizedDistances.map(d => {
            if (d <= 1.2) return 1.0;
            if (d >= 2.5) return 0.0;
            return 1.0 - ((d - 1.2) / (2.5 - 1.2));
        });

        const closure = closureScores.reduce((sum, score) => sum + score, 0) / closureScores.length;
        const state = closure > this.CLOSURE_THRESHOLD ? 'closed' : 'open';

        return { state, closure: Math.max(0, Math.min(1, closure)) };
    }

    drawHands(landmarks, w = width, h = height) {
        push();
        stroke(255, 255, 255);
        strokeWeight(2);
        for (const pair of this.HAND_CONNECTIONS) {
            const a = landmarks[pair[0]];
            const b = landmarks[pair[1]];
            if (!a || !b) continue;
            line(a.x * w, a.y * h, b.x * w, b.y * h);
        }

        noStroke();
        fill(255, 255, 255);
        for (const lm of landmarks) {
            circle(lm.x * w, lm.y * h, 6);
        }
        pop();
    }
}