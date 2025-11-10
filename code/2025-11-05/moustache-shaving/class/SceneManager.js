export class SceneManager {
    constructor(sharedContext = {}) {
        this.scenes = new Map();
        this.currentScene = null;
        this.currentName = null;
        this.shared = sharedContext;
    }

    register(name, sceneInstance) {
        if (!sceneInstance) {
            throw new Error(`Scene "${name}" is undefined.`);
        }
        this.scenes.set(name, sceneInstance);
    }

    switchTo(name, params = {}) {
        if (!this.scenes.has(name)) {
            throw new Error(`Scene "${name}" is not registered.`);
        }

        if (this.currentScene && typeof this.currentScene.exit === "function") {
            this.currentScene.exit();
        }

        this.currentScene = this.scenes.get(name);
        this.currentName = name;

        if (this.currentScene && typeof this.currentScene.enter === "function") {
            this.currentScene.enter(params);
        }
    }

    draw() {
        if (this.currentScene && typeof this.currentScene.draw === "function") {
            this.currentScene.draw();
        }
    }

    resize(w, h) {
        if (this.currentScene && typeof this.currentScene.resize === "function") {
            this.currentScene.resize(w, h);
        }
    }

    getActiveSceneName() {
        return this.currentName;
    }
}
