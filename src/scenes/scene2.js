// This module defines the second scene in the climate change narrative
// visualization.  It compares global CO₂ emissions with global land
// temperature from 1900‑2015 and offers two ways of exploring the
// relationship: a dual‑axis line chart and a scatter plot.  A
// dropdown control allows the user to switch between the two views
// without leaving the scene.  The visualization is fully responsive
// thanks to SVG viewBoxes and cleans up old elements before
// re‑rendering.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function initScene2() {
  // Colour palette matching the rest of the narrative
  const COLORS = {
    temp: "#e63946",   // red for land temperature
    co2: "#457b9d",    // blue for CO₂ emissions
    accent: "#2a9d8f", // green accent (used for regression)
    text: "#1d3557"
  };

  // Remove any existing captions from other scenes
  d3.select('.caption-left').html('');
  d3.select('.caption-right').html('');

  // Hide the replay button if it was shown by the previous scene
  d3.select('#replay-button')
    .style('opacity', 0)
    .style('transform', 'scale(0)')
    .style('display', 'none');

  // Grab the viz container and clear it.  We insert controls and a
  // wrapper for the chart so that switching between chart types only
  // destroys the chart itself, not the controls or caption.
  const viz = d3.select('#viz');
  viz.html('');

  // Top‑level controls container
  const controls = viz.append('div')
    .attr('class', 'chart-controls')
    .style('display', 'flex')
    .style('justify-content', 'flex-start')
    .style('margin', '0 0 10px 0');

  controls.append('label')
    .attr('for', 'chart-type-select')
    .style('margin-right', '8px')
    .style('font-size', '14px')
    .style('color', COLORS.text)
    .text('View:');

  // Dropdown for selecting the view type
  const select = controls.append('select')
    .attr('id', 'chart-type-select')
    .style('padding', '4px 8px')
    .style('font-size', '14px');

  const options = ['Line Chart', 'Scatter Plot'];
  select.selectAll('option')
    .data(options)
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // Container for the SVG chart; we clear its contents when switching
  const chartWrapper = viz.append('div')
    .attr('class', 'chart-wrapper')
    .style('width', '100%');

  // Tooltip used for both charts
  const tooltip = viz.append('div')
    .attr('class', 'tooltip');

  // Caption to tie the narrative together
  const caption = viz.append('div')
    .attr('class', 'narrative-caption')
    .style('opacity', 0)
    .html(
      `<p>
        As CO₂ emissions have surged in the last century, global land
        temperatures have risen almost in lockstep — revealing the deep
        connection between human activity and climate disruption.
      </p>`
    );

  // Load both datasets in parallel and merge them by year.  We rely
  // on d3.autoType to convert numeric fields automatically.
  const [tempRaw, co2Raw] = await Promise.all([
    d3.csv('public/assets/data/global_annual_temp.csv', d3.autoType),
    d3.csv('public/assets/data/global_co2_mt.csv', d3.autoType)
  ]);

  // Create a map from year to CO₂ so we can merge quickly
  const co2Map = new Map(co2Raw.map(d => [d.Year, d.CO2_Mt]));

  const mergedData = tempRaw
    .filter(d => d.Year >= 1900 && d.Year <= 2015)
    .map(d => ({
      Year: d.Year,
      LandAvgTemp: d.LandAvgTemp,
      CO2_Mt: co2Map.get(d.Year) ?? null
    }))
    .filter(d => d.CO2_Mt !== null);

  // Milestone years to highlight in the line chart
  const milestoneYears = [1992, 1997, 2015];

  // Render whichever chart is currently selected
  function renderChart(type) {
    // Clear previous chart, legends and tooltip state
    chartWrapper.selectAll('*').remove();
    viz.selectAll('.legend').remove();
    tooltip.style('opacity', 0).style('visibility', 'hidden');

    if (type === 'Scatter Plot') {
      renderScatterPlot();
    } else {
      renderLineChart();
    }
  }

  // Render the dual‑axis line chart
  function renderLineChart() {
    const containerWidth = chartWrapper.node().clientWidth;
    const width = Math.min(900, containerWidth - 20);
    const height = Math.min(500, window.innerHeight * 0.7);
    const margin = { top: 80, right: 80, bottom: 60, left: 60 };

    const svg = chartWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'chart-card');

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.Year))
      .range([margin.left, width - margin.right]);

    const yTemp = d3.scaleLinear()
      .domain([
        d3.min(mergedData, d => d.LandAvgTemp) - 0.5,
        d3.max(mergedData, d => d.LandAvgTemp) + 0.5
      ])
      .range([height - margin.bottom, margin.top]);

    const yCO2 = d3.scaleLinear()
      .domain([
        d3.min(mergedData, d => d.CO2_Mt) * 0.9,
        d3.max(mergedData, d => d.CO2_Mt) * 1.05
      ])
      .range([height - margin.bottom, margin.top]);

    // Line generators
    const lineTemp = d3.line()
      .x(d => x(d.Year))
      .y(d => yTemp(d.LandAvgTemp))
      .curve(d3.curveMonotoneX);
    const lineCO2 = d3.line()
      .x(d => x(d.Year))
      .y(d => yCO2(d.CO2_Mt))
      .curve(d3.curveMonotoneX);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yTemp));
    svg.append('g')
      .attr('transform', `translate(${width - margin.right},0)`)
      .call(d3.axisRight(yCO2));

    // Axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .text('Year');
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', margin.left - 40)
      .text('Temperature (°C)');
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', width - margin.right + 40)
      .text('CO₂ Emissions (Mt)');

    // Titles
    svg.append('text')
      .attr('class', 'main-title')
      .attr('x', width / 2)
      .attr('y', 30)
      .text('Global CO₂ Emissions vs Land Temperature (1900–2015)');
    svg.append('text')
      .attr('class', 'subtitle')
      .attr('x', width / 2)
      .attr('y', 52)
      .text('[CO₂ emissions] vs [Land temperature]');

    // Draw lines with fade‑in animation
    const tempPath = svg.append('path')
      .datum(mergedData)
      .attr('fill', 'none')
      .attr('stroke', COLORS.temp)
      .attr('stroke-width', 2)
      .attr('d', lineTemp)
      .style('opacity', 0);
    tempPath.transition()
      .duration(1500)
      .style('opacity', 1);

    const co2Path = svg.append('path')
      .datum(mergedData)
      .attr('fill', 'none')
      .attr('stroke', COLORS.co2)
      .attr('stroke-width', 2)
      .attr('d', lineCO2)
      .style('opacity', 0);
    co2Path.transition()
      .duration(1500)
      .style('opacity', 1);

    // Create a group for interactive markers
    const markers = svg.append('g');

    // Vertical guide line
    const vline = svg.append('line')
      .attr('class', 'vertical-line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .style('opacity', 0);

    // Add overlay rectangle to capture mouse events across the chart area
    svg.append('rect')
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .on('mousemove', (event) => {
        const mouse = d3.pointer(event);
        const year = Math.round(x.invert(mouse[0]));
        // Find nearest data point by year
        const idx = d3.bisector(d => d.Year).left(mergedData, year);
        const d0 = mergedData[Math.min(Math.max(idx, 0), mergedData.length - 1)];
        if (!d0) return;
        // Position vertical line
        vline
          .attr('x1', x(d0.Year))
          .attr('x2', x(d0.Year))
          .style('opacity', 0.7);
        // Remove old markers
        markers.selectAll('*').remove();
        // Add marker circles at the intersection points
        markers.append('circle')
          .attr('cx', x(d0.Year))
          .attr('cy', yTemp(d0.LandAvgTemp))
          .attr('r', 5)
          .attr('fill', COLORS.temp);
        markers.append('circle')
          .attr('cx', x(d0.Year))
          .attr('cy', yCO2(d0.CO2_Mt))
          .attr('r', 5)
          .attr('fill', COLORS.co2);
        // Show tooltip near the cursor
        const tooltipOffset = { x: 15, y: 20 };
        tooltip
          .attr('class', 'tooltip')
          .html(
            `<strong>${d0.Year}</strong><br/>
            Temp: ${d0.LandAvgTemp.toFixed(2)}°C<br/>
            CO₂: ${d0.CO2_Mt.toLocaleString()} Mt`
          )
          .style('left', `${event.pageX + tooltipOffset.x}px`)
          .style('top', `${event.pageY - tooltipOffset.y}px`)
          .style('opacity', 1)
          .style('visibility', 'visible');
      })
      .on('mouseleave', () => {
        markers.selectAll('*').remove();
        vline.style('opacity', 0);
        tooltip.style('opacity', 0).style('visibility', 'hidden');
      });

    // Highlight milestone years
    milestoneYears.forEach(year => {
      const pt = mergedData.find(d => d.Year === year);
      if (!pt) return;
      // Draw a glow dot on the temperature line
      svg.append('circle')
        .attr('cx', x(pt.Year))
        .attr('cy', yTemp(pt.LandAvgTemp))
        .attr('r', 6)
        .attr('fill', COLORS.temp)
        .attr('class', 'glow-dot');
    });

    // Legend below the chart
    const legend = viz.append('div')
      .attr('class', 'legend');
    // Temperature legend
    const tempLegend = legend.append('div')
      .attr('class', 'legend-item');
    tempLegend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.temp);
    tempLegend.append('span').text('Land Temperature');
    // CO2 legend
    const co2Legend = legend.append('div')
      .attr('class', 'legend-item');
    co2Legend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.co2);
    co2Legend.append('span').text('CO₂ Emissions');
    // Milestone legend
    const milestoneLegend = legend.append('div')
      .attr('class', 'legend-item');
    milestoneLegend.append('div')
      .attr('class', 'legend-dot')
      .style('background', COLORS.temp);
    milestoneLegend.append('span').text('Milestone Years');
  }

  // Render the scatter plot with optional regression line
  function renderScatterPlot() {
    const containerWidth = chartWrapper.node().clientWidth;
    const width = Math.min(900, containerWidth - 20);
    const height = Math.min(500, window.innerHeight * 0.7);
    const margin = { top: 80, right: 60, bottom: 60, left: 70 };

    const svg = chartWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'chart-card');

    // Scales
    const x = d3.scaleLinear()
      .domain([
        d3.min(mergedData, d => d.CO2_Mt) * 0.9,
        d3.max(mergedData, d => d.CO2_Mt) * 1.05
      ])
      .range([margin.left, width - margin.right]);
    const y = d3.scaleLinear()
      .domain([
        d3.min(mergedData, d => d.LandAvgTemp) - 0.5,
        d3.max(mergedData, d => d.LandAvgTemp) + 0.5
      ])
      .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format(',')));
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .text('CO₂ Emissions (Mt)');
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', margin.left - 40)
      .text('Land Temperature (°C)');

    // Titles
    svg.append('text')
      .attr('class', 'main-title')
      .attr('x', width / 2)
      .attr('y', 30)
      .text('CO₂ Emissions vs Land Temperature (1900–2015)');
    svg.append('text')
      .attr('class', 'subtitle')
      .attr('x', width / 2)
      .attr('y', 52)
      .text('Each dot represents one year');

    // Draw points
    svg.append('g')
      .selectAll('circle')
      .data(mergedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.CO2_Mt))
      .attr('cy', d => y(d.LandAvgTemp))
      .attr('r', 4)
      .attr('fill', COLORS.co2)
      .attr('opacity', 0.7)
      .on('mouseover', (event, d) => {
        const tooltipOffset = { x: 15, y: 20 };
        tooltip
          .attr('class', 'tooltip')
          .html(
            `<strong>${d.Year}</strong><br/>
            Temp: ${d.LandAvgTemp.toFixed(2)}°C<br/>
            CO₂: ${d.CO2_Mt.toLocaleString()} Mt`
          )
          .style('left', `${event.pageX + tooltipOffset.x}px`)
          .style('top', `${event.pageY - tooltipOffset.y}px`)
          .style('opacity', 1)
          .style('visibility', 'visible');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0).style('visibility', 'hidden');
      });

    // Optional regression line
    if (mergedData.length > 1) {
      // Compute simple linear regression y = a + b * x
      const n = mergedData.length;
      const sumX = d3.sum(mergedData, d => d.CO2_Mt);
      const sumY = d3.sum(mergedData, d => d.LandAvgTemp);
      const meanX = sumX / n;
      const meanY = sumY / n;
      let numerator = 0;
      let denominator = 0;
      mergedData.forEach(d => {
        const dx = d.CO2_Mt - meanX;
        const dy = d.LandAvgTemp - meanY;
        numerator += dx * dy;
        denominator += dx * dx;
      });
      const slope = numerator / denominator;
      const intercept = meanY - slope * meanX;
      const xMin = x.domain()[0];
      const xMax = x.domain()[1];
      const linePoints = [
        { x: xMin, y: intercept + slope * xMin },
        { x: xMax, y: intercept + slope * xMax }
      ];
      const regLine = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));
      svg.append('path')
        .datum(linePoints)
        .attr('fill', 'none')
        .attr('stroke', COLORS.accent)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', regLine);
    }

    // Legend for scatter plot
    const legend = viz.append('div')
      .attr('class', 'legend');
    const pointLegend = legend.append('div')
      .attr('class', 'legend-item');
    pointLegend.append('div')
      .attr('class', 'legend-dot')
      .style('background', COLORS.co2);
    pointLegend.append('span').text('Year (data point)');
    const regLegend = legend.append('div')
      .attr('class', 'legend-item');
    regLegend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.accent)
      .style('height', '2px');
    regLegend.append('span').text('Regression Line');
  }

  // When the user changes the drop‑down, re‑render the appropriate chart
  select.on('change', function () {
    const choice = d3.select(this).property('value');
    renderChart(choice);
  });

  // Render the default view (line chart) and fade in the caption
  renderChart('Line Chart');
  caption.transition().delay(1000).duration(1000).style('opacity', 1);
}