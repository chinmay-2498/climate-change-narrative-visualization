import * as d3 from 'd3';
import { registerScene } from '../state.js';

/**
 * Initialise Scene 2.  Called by main.js after data is loaded.
 *
 * @param {Object} data - loaded data object (not currently used)
 */
function init(data) {
  const container = d3.select('#scene-container')
    .append('div')
    .attr('id', 'scene2')
    .attr('class', 'scene')
    .style('display', 'none');

  container.append('p')
    .style('font-size', '1rem')
    .style('margin-bottom', '1rem')
    .text('Scene 2 – Temperature vs CO₂');

  container.append('p')
    .style('font-size', '0.9rem')
    .text('This scene is reserved for future work comparing the global temperature record with carbon dioxide levels. You could extend this by loading a CO₂ dataset and drawing a combined chart.');

  // Register this scene with the state manager
  registerScene('scene2', {
    show: () => container.style('display', 'block'),
    hide: () => container.style('display', 'none')
  });
}

export default { init };