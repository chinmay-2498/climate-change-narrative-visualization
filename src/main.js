import { initScene1 } from './scenes/scene1.js';
import { initNavigation } from './navigation.js';

window.onload = () => {
    // Initialize navigation first
    initNavigation();
    
    // Wait for next frame to ensure DOM is updated
    requestAnimationFrame(() => {
        // Then initialize scene 1
        initScene1();
    });
};