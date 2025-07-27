/*
 * Scene 1: Global average temperature rise over time.
 *
 * This module draws a line chart of the annual mean land temperature using
 * the GlobalTemperatures.csv file.  It demonstrates how to aggregate
 * monthly data by year, draw axes and a line, add a simple slider to filter
 * by year range and call out the highest point in the series with an
 * annotation.  The scene registers itself with the state manager so that
 * it can be shown or hidden when the state changes.
 */

import * as d3 from 'd3';
import { registerScene } from '../state.js';
import { groupByYear } from '../d3-components/helpers.js';

/**
 * Initialise Scene 1.  Called by main.js after data is loaded.
 *
 * @param {{global: Array<Object>}} data - loaded data object containing the global CSV
 */
function init(data) {
  // Create a container for this scene within the scene container in index.html
  const container = d3.select('#scene-container')
    .append('div')
    .attr('id', 'scene1')
    .attr('class', 'scene');
  // Hide by default; the state manager will show it when appropriate
  container.style('display', 'none');
  // Compute dimensions based on container width
  const bounding = container.node().getBoundingClientRect();
  const width = bounding.width || 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 50, left: 60 };

  // Create an SVG element
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom);

  // Prepare the data: filter out null temperatures and aggregate by year
  const filtered = data.global.filter(d => d.LandAverageTemperature != null && d.dt instanceof Date);
  const aggregated = groupByYear(filtered, d => d.LandAverageTemperature);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(aggregated, d => d.year))
    .range([margin.left, width - margin.right]);
  const y = d3.scaleLinear()
    .domain([d3.min(aggregated, d => d.value) - 1, d3.max(aggregated, d => d.value) + 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  const xAxis = d3.axisBottom(x)
    .ticks(10)
    .tickFormat(d3.format('d'));
  const yAxis = d3.axisLeft(y);

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append('text')
    .attr('x', (width - margin.left - margin.right) / 2 + margin.left)
    .attr('y', 35)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Year');

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(height - margin.top - margin.bottom) / 2 - margin.top)
    .attr('y', -40)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Mean Land Temp (°C)');

  // Line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value));

  // Draw the line path
  const path = svg.append('path')
    .datum(aggregated)
    .attr('fill', 'none')
    .attr('stroke', '#ff6e54')
    .attr('stroke-width', 2)
    .attr('d', line);

  // Annotation: highlight the year with the maximum temperature
  const maxDatum = aggregated.reduce((acc, d) => d.value > acc.value ? d : acc, aggregated[0]);
  const annotations = [
    {
      note: {
        title: `${maxDatum.year}`,
        label: `Highest annual mean: ${maxDatum.value.toFixed(2)}°C`,
        align: 'middle'
      },
      x: x(maxDatum.year),
      y: y(maxDatum.value),
      dx: 0,
      dy: -40
    }
  ];
  const makeAnnotation = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);
  svg.append('g')
    .attr('class', 'annotation-group')
    .call(makeAnnotation);

  // Slider to control the maximum year displayed
  const sliderContainer = container.append('div')
    .style('margin-top', '1rem');
  sliderContainer.append('label')
    .attr('for', 'year-range')
    .style('margin-right', '0.5rem')
    .text('Year up to:');
  const slider = sliderContainer.append('input')
    .attr('type', 'range')
    .attr('id', 'year-range')
    .attr('min', d3.min(aggregated, d => d.year))
    .attr('max', d3.max(aggregated, d => d.year))
    .attr('step', 1)
    .attr('value', d3.max(aggregated, d => d.year));

  // When the slider moves, filter the data and update the line
  slider.on('input', (event) => {
    const maxYear = +event.target.value;
    const filteredData = aggregated.filter(d => d.year <= maxYear);
    path.datum(filteredData).attr('d', line);
  });

  // Register this scene with the state manager
  registerScene('scene1', {
    show: () => container.style('display', 'block'),
    hide: () => container.style('display', 'none')
  });
}

export default { init };