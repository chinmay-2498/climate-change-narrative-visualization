import * as d3 from 'd3';
import { setScene } from './state.js';
import scene1 from './scenes/scene1.js';
import scene2 from './scenes/scene2.js';
import scene3 from './scenes/scene3.js';

/**
 * Load all CSV files from the public/assets/data directory.  If any file is
 * missing, the corresponding key will still be present but contain an
 * empty array.  d3.autoType is used to coerce values and parse dates.
 *
 * @returns {Promise<Object>} an object containing arrays for each CSV
 */
async function loadData() {
  // List of filenames and keys.  If you add more files, update this list.
  const files = {
    global: 'GlobalTemperatures.csv',
    byCountry: 'GlobalLandTemperaturesByCountry.csv',
    byRegion: 'GlobalLandTemperaturesByRegion.csv',
    byCity: 'GlobalLandTemperaturesByMajorCity.csv',
    byState: 'GlobalLandTemperaturesByState.csv'
  };
  const promises = Object.entries(files).map(async ([key, file]) => {
    try {
      const data = await d3.csv(`public/assets/data/${file}`, d3.autoType);
      return [key, data];
    } catch (err) {
      console.warn(`Could not load ${file}:`, err);
      return [key, []];
    }
  });
  const entries = await Promise.all(promises);
  return Object.fromEntries(entries);
}

/**
 * Set up event listeners for the scene trigger buttons defined in index.html.
 */
function initControls() {
  document.querySelectorAll('.trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const sceneName = btn.dataset.scene;
      setScene(sceneName);
    });
  });
}

/**
 * Initialise the application.  Loads data, initialises scenes and sets
 * the starting scene.
 */
async function init() {
  const data = await loadData();
  // Make the data globally accessible for debugging (optional)
  window.appData = data;
  // Initialise all scenes.  Scenes will register themselves with the state manager.
  scene1.init(data);
  scene2.init(data);
  scene3.init(data);
  // Set up controls after scenes are registered
  initControls();
  // Show the first scene by default
  setScene('scene1');
}

// Kick off the app when the module is evaluated
init().catch(err => {
  console.error('Error initialising app:', err);
});