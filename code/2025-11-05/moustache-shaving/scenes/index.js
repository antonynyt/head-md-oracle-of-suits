import { KingScene } from "./KingScene.js";
import { AceScene } from "./AceScene.js";
import { RecomposeScene } from "./RecomposeScene.js";
import { AceEndScene } from "./AceEndScene.js";

export function createScenes(shared) {
    return {
        king: new KingScene(shared),
        ace: new AceScene(shared),
        recompose: new RecomposeScene(shared),
        aceEnd: new AceEndScene(shared)
    };
}

export { KingScene, AceScene, RecomposeScene, AceEndScene };