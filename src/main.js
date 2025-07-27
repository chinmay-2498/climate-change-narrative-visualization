import { initScene1 } from './scenes/scene1.js';
import { initNavigation } from './navigation.js';

window.onload = () => {
    // Initialize navigation and start with scene 1
    initNavigation();
    initScene1();
};