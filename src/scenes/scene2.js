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

  const viz = d3.select('#viz');
  viz.html('');

  // Top‑level controls container
  const controls = viz.append('div')
    .attr('class', 'chart-controls')
    .style('display', 'flex')
    // occupy full width so toggles can be centred easily
    .style('width', '100%')
    .style('justify-content', 'center')
    .style('margin', '0 0 10px 0');

  // Centre the toggle controls within the parent and remove the "View" label
  controls.style('justify-content', 'center');

  const toggleGroup = controls.append('div')
    .attr('class', 'view-toggle-group')
    .style('display', 'flex')
    .style('gap', '8px');

  // Helper to style buttons uniformly
  function styleToggleButton(btn, active) {
    btn.style('padding', '6px 12px')
      .style('border', `2px solid ${COLORS.co2}`)
      .style('border-radius', '6px')
      .style('font-size', '14px')
      .style('cursor', 'pointer')
      .style('background', active ? COLORS.co2 : '#fff')
      .style('color', active ? '#fff' : COLORS.text)
      .style('transition', 'all 0.2s ease');
  }

  // Initial state
  let currentType = 'Line Chart';

  // Create the two toggle buttons
  const lineBtn = toggleGroup.append('button')
    .text('Line Chart');
  const scatterBtn = toggleGroup.append('button')
    .text('Scatter Plot');
  // Apply initial styles
  styleToggleButton(lineBtn, true);
  styleToggleButton(scatterBtn, false);

  // Click handlers for toggles
  lineBtn.on('click', () => {
    if (currentType !== 'Line Chart') {
      currentType = 'Line Chart';
      styleToggleButton(lineBtn, true);
      styleToggleButton(scatterBtn, false);
      renderChart(currentType);
    }
  });
  scatterBtn.on('click', () => {
    if (currentType !== 'Scatter Plot') {
      currentType = 'Scatter Plot';
      styleToggleButton(lineBtn, false);
      styleToggleButton(scatterBtn, true);
      renderChart(currentType);
    }
  });

  // Container for the SVG chart; we clear its contents when switching
  const chartWrapper = viz.append('div')
    .attr('class', 'chart-wrapper')
    .style('width', '100%');

  // Tooltip used for both charts
  const tooltip = viz.append('div')
    .attr('class', 'tooltip');

  viz.selectAll('label').style('display', 'none');

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

  // Define detailed milestone annotations used for the highlight tooltips.
  const milestones = [
    {
      year: 1992,
      title: 'UNFCCC Established',
      description: 'The Earth Summit in Rio de Janeiro saw the creation of the United Nations Framework Convention on Climate Change (UNFCCC), laying the groundwork for global climate action.'
    },
    {
      year: 1997,
      title: 'Kyoto Protocol',
      description: 'The Kyoto Protocol was adopted, representing the first legally binding agreement to cut greenhouse gas emissions.'
    },
    {
      year: 2015,
      title: 'Paris Agreement',
      description: 'Nearly every nation agreed to limit global warming to well below 2°C compared to pre‑industrial levels.'
    }
  ];

  const leftCaptions = [
    {
      title: 'Rising CO₂ Emissions',
      text: 'Global CO₂ emissions have increased more than fifteen‑fold since 1900, driven by industrialisation and fossil‑fuel combustion.'
    },
    {
      title: 'Policy Milestones',
      text: 'Landmark agreements like the Kyoto Protocol (1997) and the Paris Agreement (2015) demonstrate international recognition of the problem.'
    }
  ];
  const rightCaptions = [
    {
      title: 'Temperature Response',
      text: 'Over the same period, average land temperatures climbed roughly 1.3 °C, closely tracking the upward surge in emissions.'
    },
    {
      title: 'Human Activity & Climate',
      text: 'Rising CO₂ emissions have gone hand in hand with rising temperatures, underscoring the impact of human activity on the planet.'
    }
  ];

  // Helper to add narrative captions to the side panels
  function addCaptions() {
    const leftContainer = d3.select('.caption-left');
    leftCaptions.forEach(caption => {
      leftContainer.append('div')
        .attr('class', 'narrative-caption')
        .style('opacity', '0')
        .style('transform', 'translateY(20px)')
        .html(`
          <h3>${caption.title}</h3>
          <p>${caption.text}</p>
        `);
    });
    const rightContainer = d3.select('.caption-right');
    rightCaptions.forEach(caption => {
      rightContainer.append('div')
        .attr('class', 'narrative-caption')
        .style('opacity', '0')
        .style('transform', 'translateY(20px)')
        .html(`
          <h3>${caption.title}</h3>
          <p>${caption.text}</p>
        `);
    });
  }

  // Helper to animate captions sequentially
  function animateCaptions() {
    const captions = d3.selectAll('.caption-left .narrative-caption, .caption-right .narrative-caption');
    captions.each((d, i, nodes) => {
      setTimeout(() => {
        d3.select(nodes[i])
          .transition()
          .duration(400)
          .style('opacity', '1')
          .style('transform', 'translateY(0)');
      }, i * 300);
    });
  }

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
      .attr('class', 'chart-card')
      // Override the default hidden state from .chart-card and make
      // sure the chart is visible immediately
      .style('opacity', 1)
      .style('transform', 'translateY(0)');

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
      .attr('fill', COLORS.temp)
      .text('Temperature (°C)');
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', width - margin.right + 40)
      .attr('fill', COLORS.co2)
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

    // Highlight milestone years with descriptive tooltips.  Each
    // highlight dot is interactive—hovering reveals why the year is
    // significant and displays both temperature and CO₂ values.
    milestones.forEach(({ year, title, description }) => {
      const pt = mergedData.find(d => d.Year === year);
      if (!pt) return;
      const highlightGroup = svg.append('g')
        .attr('class', 'highlight-group');
      // Visible glowing dot
      highlightGroup.append('circle')
        .attr('cx', x(pt.Year))
        .attr('cy', yTemp(pt.LandAvgTemp))
        .attr('r', 6)
        .attr('fill', COLORS.temp)
        .attr('class', 'glow-dot')
        .style('pointer-events', 'all');
      // Larger invisible circle to expand hit area
      highlightGroup.append('circle')
        .attr('cx', x(pt.Year))
        .attr('cy', yTemp(pt.LandAvgTemp))
        .attr('r', 15)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all');
      // Hover handlers
      highlightGroup.on('mouseover', (event) => {
        event.stopPropagation();
        const mouseX = event.pageX;
        const mouseY = event.pageY;
        const offset = { x: 15, y: 20 };
        tooltip
          .attr('class', 'tooltip highlight-tooltip')
          .html(
            `<strong>${title} (${year})</strong><br/>${description}<br/><br/>` +
            `Temperature: ${pt.LandAvgTemp.toFixed(2)}°C<br/>` +
            `CO₂: ${pt.CO2_Mt.toLocaleString()} Mt`
          )
          .style('left', `${mouseX + offset.x}px`)
          .style('top', `${mouseY - offset.y}px`)
          .style('opacity', 1)
          .style('visibility', 'visible');
        // Show vertical guide line at the milestone year
        vline
          .attr('x1', x(pt.Year))
          .attr('x2', x(pt.Year))
          .style('opacity', 0.7);
      });
      highlightGroup.on('mouseout', () => {
        tooltip.style('opacity', 0).style('visibility', 'hidden');
        vline.style('opacity', 0);
      });
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

    // Data credits
    legend.append('div')
      .attr('class', 'legend-credit')
      .style('font-size', '10px')
      .style('margin-top', '6px')
      .style('text-align', 'center')
      .html(
        `Data sources: <a href="https://ourworldindata.org/co2-and-greenhouse-gas-emissions" target="_blank">Our World in Data</a>, ` +
        `<a href="https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data" target="_blank">Berkeley Earth</a>`
      );
  }

  // Render the scatter plot with optional regression line
  function renderScatterPlot() {
    const containerWidth = chartWrapper.node().clientWidth;
    const width = Math.min(900, containerWidth - 20);
    const height = Math.min(500, window.innerHeight * 0.7);
    const margin = { top: 80, right: 60, bottom: 60, left: 70 };

    const svg = chartWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'chart-card')
      // Override the default hidden state from .chart-card
      .style('opacity', 1)
      .style('transform', 'translateY(0)');

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
    const xAxis = d3.axisBottom(x).tickFormat(d3.format(','));
    const yAxis = d3.axisLeft(y);
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

    // Add subtle grid lines to enhance readability
    const xGrid = d3.axisBottom(x)
      .ticks(6)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat('');
    const yGrid = d3.axisLeft(y)
      .ticks(6)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat('');
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#e5e5e5')
      .attr('stroke-dasharray', '2,2');
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#e5e5e5')
      .attr('stroke-dasharray', '2,2');
    // Remove grid axes domain lines
    svg.selectAll('.grid .domain').remove();

    // Axis labels with colours matching their data series
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('fill', COLORS.co2)
      .text('CO₂ Emissions (Mt)');
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', margin.left - 40)
      .attr('fill', COLORS.temp)
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

    // Colour scale for scatter points: early years are lighter, later
    // years darker.  This communicates time progression without
    // introducing a new hue family.
    const colorScale = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.Year))
      .range(['#a8dadc', COLORS.co2]);
    // Draw points.  Milestone years are rendered in the temperature
    // colour with a slightly larger radius to set them apart.  We do
    // not attach individual mouse handlers to circles; instead a
    // separate overlay handles hover interactions and highlights.
    const circles = svg.append('g')
      .selectAll('circle')
      .data(mergedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.CO2_Mt))
      .attr('cy', d => y(d.LandAvgTemp))
      .attr('r', d => milestoneYears.includes(d.Year) ? 6 : 5)
      .attr('fill', d => milestoneYears.includes(d.Year) ? COLORS.temp : colorScale(d.Year))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.85);

    // Create a lookup for milestone descriptions
    const milestoneLookup = {};
    milestones.forEach(m => { milestoneLookup[m.year] = m; });

    // Crosshair lines to aid reading values.  Hidden by default.
    const crosshair = svg.append('g')
      .style('display', 'none');
    const vLine = crosshair.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '3,3');
    const hLine = crosshair.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '3,3');

    // Keep track of the last highlighted circle so we can reset its size
    let lastHighlight = null;

    // Transparent overlay to capture mouse events across the plot
    svg.append('rect')
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        // Determine the nearest data point by Euclidean distance in
        // pixel space
        let nearest = null;
        let minDist = Infinity;
        circles.each(function(d) {
          const cx = x(d.CO2_Mt);
          const cy = y(d.LandAvgTemp);
          const dist = (mx - cx) * (mx - cx) + (my - cy) * (my - cy);
          if (dist < minDist) {
            minDist = dist;
            nearest = { d, cx, cy, el: this };
          }
        });
        if (!nearest) return;
        // Show crosshair lines at the mouse position
        crosshair.style('display', null);
        vLine
          .attr('x1', mx)
          .attr('x2', mx)
          .attr('y1', margin.top)
          .attr('y2', height - margin.bottom);
        hLine
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', my)
          .attr('y2', my);
        // Restore the last highlighted circle
        if (lastHighlight) {
          lastHighlight.attr('r', d => milestoneYears.includes(d.Year) ? 6 : 5);
        }
        // Enlarge the current circle
        d3.select(nearest.el).attr('r', 8);
        lastHighlight = d3.select(nearest.el);
        // Construct tooltip content.  If the point is a milestone,
        // include the title and description for additional context.
        const m = milestoneLookup[nearest.d.Year];
        let html = `<strong>${nearest.d.Year}</strong><br/>` +
          `Temp: ${nearest.d.LandAvgTemp.toFixed(2)}°C<br/>` +
          `CO₂: ${nearest.d.CO2_Mt.toLocaleString()} Mt`;
        if (m) {
          html = `<strong>${m.title} (${nearest.d.Year})</strong><br/>${m.description}<br/><br/>` +
            `Temperature: ${nearest.d.LandAvgTemp.toFixed(2)}°C<br/>` +
            `CO₂: ${nearest.d.CO2_Mt.toLocaleString()} Mt`;
        }
        const offset = { x: 15, y: 20 };
        tooltip
          .attr('class', 'tooltip highlight-tooltip')
          .html(html)
          .style('left', `${event.pageX + offset.x}px`)
          .style('top', `${event.pageY - offset.y}px`)
          .style('opacity', 1)
          .style('visibility', 'visible');
      })
      .on('mouseleave', () => {
        // Hide crosshair and tooltip
        crosshair.style('display', 'none');
        tooltip.style('opacity', 0).style('visibility', 'hidden');
        // Reset highlighted circle
        if (lastHighlight) {
          lastHighlight.attr('r', d => milestoneYears.includes(d.Year) ? 6 : 5);
          lastHighlight = null;
        }
      });

    // Label the earliest and latest years for additional context
    const firstPoint = mergedData[0];
    const lastPoint = mergedData[mergedData.length - 1];
    svg.append('text')
      .attr('x', x(firstPoint.CO2_Mt) + 6)
      .attr('y', y(firstPoint.LandAvgTemp) - 6)
      .attr('font-size', '10px')
      .attr('fill', COLORS.text)
      .text(firstPoint.Year);
    svg.append('text')
      .attr('x', x(lastPoint.CO2_Mt) + 6)
      .attr('y', y(lastPoint.LandAvgTemp) - 6)
      .attr('font-size', '10px')
      .attr('fill', COLORS.text)
      .text(lastPoint.Year);

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

    // Legend for scatter plot, including milestone indicator
    const legend = viz.append('div')
      .attr('class', 'legend');
    const pointLegend = legend.append('div')
      .attr('class', 'legend-item');
    pointLegend.append('div')
      .attr('class', 'legend-dot')
      .style('background', COLORS.co2);
    pointLegend.append('span').text('Year (normal)');
    const milestoneLegendItem = legend.append('div')
      .attr('class', 'legend-item');
    milestoneLegendItem.append('div')
      .attr('class', 'legend-dot')
      .style('background', COLORS.temp);
    milestoneLegendItem.append('span').text('Milestone Year');
    const regLegend = legend.append('div')
      .attr('class', 'legend-item');
    regLegend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.accent)
      .style('height', '2px');
    regLegend.append('span').text('Regression Line');

    // Data credits for scatter plot
    legend.append('div')
      .attr('class', 'legend-credit')
      .style('font-size', '10px')
      .style('margin-top', '6px')
      .style('text-align', 'center')
      .html(
        `Data sources: <a href="https://ourworldindata.org/co2-and-greenhouse-gas-emissions" target="_blank">Our World in Data</a>, ` +
        `<a href="https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data" target="_blank">Berkeley Earth</a>`
      );
  }


  // Note: we replaced the native select with our own toggle buttons.  The
  // click handlers on those buttons call renderChart() as needed, so
  // there is no select change handler here.

  // Insert the narrative captions into the side panels and animate them
  addCaptions();
  // Render the default view (line chart)
  renderChart('Line Chart');
  // Fade in the side captions after a short delay.  Without a
  // central caption we simply animate the side panels.
  setTimeout(() => {
    animateCaptions();
  }, 800);
}