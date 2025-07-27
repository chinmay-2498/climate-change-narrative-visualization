import { initScene1 } from './scenes/scene1.js';
import { initScene2 } from './scenes/scene2.js';
import { initScene3 } from './scenes/scene3.js';

const scenes = [
    { id: 1, title: "Global Temperature Trends", init: initScene1 },
    { id: 2, title: "CO₂ and Temperature Correlation", init: initScene2 },
    { id: 3, title: "Regional Temperature Changes", init: initScene3 }
];

export function initNavigation() {
    const nav = document.createElement('div');
    nav.className = 'scene-navigation';
    
    // Add progress bar
    const progress = document.createElement('div');
    progress.className = 'progress-bar';
    nav.appendChild(progress);

    // Add previous arrow
    const prevArrow = document.createElement('button');
    prevArrow.className = 'nav-arrow prev';
    prevArrow.innerHTML = '←';
    nav.appendChild(prevArrow);

    // Add navigation buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'nav-buttons';
    
    scenes.forEach((scene, index) => {
        const button = document.createElement('button');
        button.className = 'nav-button';
        button.setAttribute('data-scene', scene.id);
        button.innerHTML = `
            <span class="scene-number">${scene.id}</span>
            <span class="scene-title">${scene.title}</span>
        `;
        button.addEventListener('click', () => {
            updateActiveScene(scene.id);
            scene.init();
        });
        buttonContainer.appendChild(button);
    });

    nav.appendChild(buttonContainer);

    // Add next arrow
    const nextArrow = document.createElement('button');
    nextArrow.className = 'nav-arrow next';
    nextArrow.innerHTML = '→';
    nav.appendChild(nextArrow);

    // Add navigation to the document
    const navigationContainer = document.getElementById('navigation');
    if (navigationContainer) {
        navigationContainer.appendChild(nav);
    }

    // Set initial state
    let currentSceneIndex = 0;

    // Handle arrow navigation with wraparound
    prevArrow.addEventListener('click', () => {
        currentSceneIndex = (currentSceneIndex - 1 + scenes.length) % scenes.length;
        const scene = scenes[currentSceneIndex];
        updateActiveScene(scene.id);
        scene.init();
    });

    nextArrow.addEventListener('click', () => {
        currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
        const scene = scenes[currentSceneIndex];
        updateActiveScene(scene.id);
        scene.init();
    });

    // Update arrow states - always enabled
    function updateArrows() {
        prevArrow.disabled = false;
        nextArrow.disabled = false;
    }

    // Set initial arrow states
    updateArrows();
    updateActiveScene(1);
    updateProgress(1);
}

function updateActiveScene(sceneId) {
    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(button => {
        if (parseInt(button.getAttribute('data-scene')) === sceneId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    updateProgress(sceneId);
}

function updateProgress(sceneId) {
    const progress = document.querySelector('.progress-bar');
    const percentage = ((sceneId - 1) / (scenes.length - 1)) * 100;
    progress.style.width = `${percentage}%`;
}
