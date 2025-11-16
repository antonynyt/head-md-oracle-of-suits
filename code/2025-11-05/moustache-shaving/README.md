# Moustache Shaving

This project is part of the **Oracle of Suits** interactive experience. It features an animated mustache that visitors interact with using gestures, revealing playful anecdotes through a shaving motion.

## Technologies Used

### **p5.js**
- A JavaScript library for creative coding, used to create the interactive canvas and animations.
- Handles the rendering of the mustache, particles, and other visual elements.

### **MediaPipe Hands**
- A machine learning solution for real-time hand tracking.
- Detects hand gestures and landmarks, enabling the shaving interaction.

### **Custom Scene Management**
- A modular scene system implemented in JavaScript.
- Allows seamless transitions between different interactive scenes (e.g., King Scene, Recompose Scene).

### **Gesture Classification**
- Custom gesture detection logic built on top of MediaPipe Hands.
- Classifies hand states (e.g., open, closed) to trigger interactions.

### **Audio and Video Integration**
- Uses `p5.sound` for audio effects like the razor sound.
- Integrates video elements (e.g., `recomposing.webm`) for storytelling.

### **Custom Graphics**
- Utilizes `p5.Graphics` for dynamic rendering, such as the mustache's erasing effect during shaving.

### **HTML/CSS**
- Provides the structure and styling for the interface.
- Includes responsive design for full-screen experiences.

### **JavaScript Utilities**
- Utility functions for handling landmarks, gesture smoothing, and asset loading.
- Modularized code for better maintainability.

## How It Works
1. **Hand Tracking**: MediaPipe detects hand landmarks and sends data to the gesture classifier.
2. **Gesture Interaction**: The system interprets gestures (e.g., open/close hand) to interact with the mustache.
3. **Scene Transitions**: The scene manager handles transitions between different parts of the experience.
4. **Visual Feedback**: The mustache reacts dynamically to gestures, with particles and erasing effects.
5. **Audio/Video**: Sound effects and videos enhance the storytelling.

## Folder Structure
- **`index-sketch.js`**: Entry point for the p5.js sketch.
- **`class/`**: Contains reusable classes like `GestureClassifier`, `HandCursor`, and `ShaveableSprite`.
- **`scenes/`**: Modular scenes such as `KingScene` and `RecomposeScene`.
- **`assets/`**: Images, videos, and sounds used in the experience.
- **`utils/`**: Helper functions for handling landmarks and other shared logic.

## Live Demo
[Open the live version](https://antonynyt.github.io/head-md-oracle-of-suits/code/2025-11-05/moustache-shaving/)