import { initScene1 } from './scenes/scene1.js';
import { initNavigation } from './navigation.js';

// Global resize handler to ensure all scenes stay within viewport bounds
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Get current scene from navigation state
        const activeButton = document.querySelector('.nav-button.active');
        if (activeButton) {
            const sceneNumber = activeButton.querySelector('.scene-number').textContent;
            
            // Re-trigger the current scene to adjust for new viewport dimensions
            const currentScene = window.currentScene || 1;
            
            // Use the navigation system to properly re-render the current scene
            const event = new CustomEvent('sceneChange', { detail: { scene: currentScene } });
            document.dispatchEvent(event);
        }
    }, 300); // Debounce resize events
}

// Prevent scrolling with touch gestures on mobile
function preventScrolling(e) {
    e.preventDefault();
}

window.onload = () => {
    // Initialize navigation first
    initNavigation();
    
    // Add resize handler for responsive design
    window.addEventListener('resize', handleResize);
    
    // Prevent scrolling on mobile devices
    document.addEventListener('touchstart', preventScrolling, { passive: false });
    document.addEventListener('touchmove', preventScrolling, { passive: false });
    document.addEventListener('wheel', preventScrolling, { passive: false });
    
    // Prevent keyboard-triggered scrolling
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    // Wait for next frame to ensure DOM is updated
    requestAnimationFrame(() => {
        // Then initialize scene 1
        initScene1();
    });
};