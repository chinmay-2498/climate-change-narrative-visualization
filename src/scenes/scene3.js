import * as d3 from 'd3';
import { registerScene } from '../state.js';
import { groupByYear } from '../d3-components/helpers.js';

/**
 * Initialise Scene 3.  Called by main.js after data is loaded.
 *
 * @param {{byCountry: Array<Object>}} data - loaded data including country temperatures
 */
function init(data) {
  const container = d3.select('#scene-container')
    .append('div')
    .attr('id', 'scene3')
    .attr('class', 'scene')
    .style('display', 'none');

  container.append('p')
    .style('font-size', '1rem')
    .style('margin-bottom', '0.5rem')
    .text('Scene 3 – Regional/Country Trends');

  // Create a drop‑down selector for the available countries
  const select = container.append('select')
    .style('margin-bottom', '1rem');
  const countries = Array.from(new Set(data.byCountry.map(d => d.Country))).sort();
  select.selectAll('option')
    .data(countries)
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // SVG for the chart
  const width = 600;
  const height = 300;
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom);
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().range([0, innerWidth]);
  const yScale = d3.scaleLinear().range([innerHeight, 0]);
  const xAxisGroup = g.append('g').attr('transform', `translate(0,${innerHeight})`);
  const yAxisGroup = g.append('g');
  const line = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value));
  const path = g.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#4682b4')
    .attr('stroke-width', 2);

  // Axis labels
  svg.append('text')
    .attr('x', margin.left + innerWidth / 2)
    .attr('y', height + margin.top + margin.bottom - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Year');
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(margin.top + innerHeight / 2))
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text('Mean Land Temp (°C)');

  function updateCountry(country) {
    // Filter the dataset for the selected country and compute annual means
    const subset = data.byCountry.filter(d => d.Country === country && d.AverageTemperature != null && d.dt instanceof Date);
    const aggregated = groupByYear(subset, d => d.AverageTemperature);
    if (aggregated.length === 0) return;
    xScale.domain(d3.extent(aggregated, d => d.year));
    yScale.domain([d3.min(aggregated, d => d.value) - 1, d3.max(aggregated, d => d.value) + 1]).nice();
    xAxisGroup.call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d')));
    yAxisGroup.call(d3.axisLeft(yScale));
    path.datum(aggregated).attr('d', line);
  }

  // Initialise with the first country
  updateCountry(countries[0]);
  // Update chart when a new country is selected
  select.on('change', event => {
    const country = event.target.value;
    updateCountry(country);
  });

  // Register this scene with the state manager
  registerScene('scene3', {
    show: () => container.style('display', 'block'),
    hide: () => container.style('display', 'none')
  });
}

export default { init };