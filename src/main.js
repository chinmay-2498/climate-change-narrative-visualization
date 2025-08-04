import { initScene1 } from './scenes/scene1.js';
import { initNavigation } from './navigation.js';

let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const activeButton = document.querySelector('.nav-button.active');
        if (activeButton) {
            const sceneNumber = activeButton.querySelector('.scene-number').textContent;
            
            const currentScene = window.currentScene || 1;
            
            const event = new CustomEvent('sceneChange', { detail: { scene: currentScene } });
            document.dispatchEvent(event);
        }
    }, 300);
}

function preventScrolling(e) {
    if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault();
    }
}

function preventWheelScrolling(e) {
    e.preventDefault();
}

window.onload = () => {
    initNavigation();
    
    window.addEventListener('resize', handleResize);
    
    document.addEventListener('touchmove', preventScrolling, { passive: false });
    document.addEventListener('wheel', preventWheelScrolling, { passive: false });
    
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    requestAnimationFrame(() => {
        initScene1();
    });
};