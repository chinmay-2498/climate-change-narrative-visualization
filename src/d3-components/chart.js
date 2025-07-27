import * as d3 from 'd3';

export function lineChart(container, data, options = {}) {
  const width = options.width || 600;
  const height = options.height || 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  const plotArea = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().range([0, innerWidth]);
  const yScale = d3.scaleLinear().range([innerHeight, 0]);
  const xAxisGroup = plotArea.append('g').attr('transform', `translate(0,${innerHeight})`);
  const yAxisGroup = plotArea.append('g');
  const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
  const path = plotArea.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#4682b4')
    .attr('stroke-width', 2);
  // Axis labels
  if (options.xLabel) {
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(options.xLabel);
  }
  if (options.yLabel) {
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -margin.top - innerHeight / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(options.yLabel);
  }
  function update(newData) {
    xScale.domain(d3.extent(newData, d => d.x));
    yScale.domain(d3.extent(newData, d => d.y));
    xAxisGroup.call(d3.axisBottom(xScale));
    yAxisGroup.call(d3.axisLeft(yScale));
    path.datum(newData).attr('d', line);
  }
  // initial render
  update(data);
  return update;
}