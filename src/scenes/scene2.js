import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { globalTooltip, UnifiedTooltip } from '../d3-components/tooltip.js';

export async function initScene2() {
  function ensureCaptionContainers() {
    const viz = d3.select('#viz');
    viz.style('position', null)
       .style('top', null)
       .style('left', null)
       .style('right', null)
       .style('bottom', null)
       .style('width', null)
       .style('height', null)
       .style('z-index', null)
       .style('background', null)
       .style('overflow', null);

    let leftContainer = d3.select('.caption-left');
    let rightContainer = d3.select('.caption-right');
    
    if (leftContainer.empty()) {
      leftContainer = d3.select('.scene-section')
        .insert('div', '#viz')
        .attr('class', 'caption-left');
    }
    
    if (rightContainer.empty()) {
      rightContainer = d3.select('.scene-section')
        .append('div')
        .attr('class', 'caption-right');
    }
    
    leftContainer
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '20px');
      
    rightContainer
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '20px');
  }

  // Color scheme matching narrative theme
  const COLORS = {
    temp: "#e63946",
    co2: "#457b9d",
    accent: "#2a9d8f",
    text: "#1d3557"
  };
  
  console.log("Loading data files...");
  let tempRaw = [], co2Raw = [];
  
  try {
    try {
      [tempRaw, co2Raw] = await Promise.all([
        d3.csv('public/assets/data/global_annual_temp.csv', d3.autoType),
        d3.csv('public/assets/data/global_co2_mt.csv', d3.autoType)
      ]);
    } catch (e) {
      console.log("Trying alternative path without 'public/' prefix");
      [tempRaw, co2Raw] = await Promise.all([
        d3.csv('assets/data/global_annual_temp.csv', d3.autoType),
        d3.csv('assets/data/global_co2_mt.csv', d3.autoType)
      ]);
    }
    console.log("Data loaded successfully:", 
                tempRaw.length, "temperature records,", 
                co2Raw.length, "CO2 records");
  } catch (error) {
    console.error("Error loading data files:", error);
    alert("Error loading climate data. Check console for details.");
    return;
  }
  
  const co2Map = new Map(co2Raw.map(d => [d.Year, d.CO2_Mt]));

  const mergedData = tempRaw
    .filter(d => d.Year >= 1900 && d.Year <= 2015)
    .map(d => ({
      Year: d.Year,
      LandAvgTemp: d.LandAvgTemp,
      CO2_Mt: co2Map.get(d.Year) ?? null
    }))
    .filter(d => d.CO2_Mt !== null);
    
  console.log("Merged data:", mergedData.length, "entries");
  if (mergedData.length === 0) {
    console.error("No data available for visualization");
  }

  const milestoneYears = [1992, 1997, 2015];

  // Climate agreement milestones for tooltips
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

  // Helper function to clear legend
  function clearLegend() {
    d3.select("#viz .legend").remove();
  }

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
      text: 'Over the same period, average land temperatures climbed roughly 1.3 °C, closely tracking the upward surge in emissions.'
    },
    {
      title: 'Human Activity & Climate',
      text: 'Rising CO₂ emissions have gone hand in hand with rising temperatures, underscoring the impact of human activity on the planet.'
    }
  ];

  const viz = d3.select('#viz');
  let chartWrapper;
  
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
  
  // Create dual-axis line chart for CO2 and temperature trends
  function renderLineChart() {
    console.log("Rendering line chart");
    
    if (!chartWrapper || chartWrapper.empty()) {
      console.error("Chart wrapper not available for line chart rendering");
      return null;
    }
    
    if (!mergedData || mergedData.length === 0) {
      console.error("No data available for line chart rendering");
      return null;
    }
    
    console.log("First data point:", mergedData[0]);
    console.log("Last data point:", mergedData[mergedData.length-1]);
    
    const container = document.getElementById("viz");
    console.log("Container dimensions:", container.clientWidth, "x", container.clientHeight);
    console.log("Window dimensions:", window.innerWidth, "x", window.innerHeight);
    
    const availableWidth = container.clientWidth > 0 ? container.clientWidth : Math.min(900, window.innerWidth - 200);
    const availableHeight = container.clientHeight > 0 ? container.clientHeight : Math.min(500, window.innerHeight - 300);
    
    console.log("Available dimensions:", availableWidth, "x", availableHeight);
    
    const containerWidth = chartWrapper.node().clientWidth > 0 ? chartWrapper.node().clientWidth : availableWidth;
    console.log("Chart wrapper width:", containerWidth);
    
    const width = Math.max(400, Math.min(800, containerWidth - 40));
    const height = Math.max(300, Math.min(500, Math.min(width * 0.6, availableHeight - 100)));
    console.log("Final chart dimensions:", width, "x", height);
    const margin = { top: 80, right: 80, bottom: 60, left: 60 };

    const svg = chartWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .style("max-width", "100%")
      .style("max-height", "100%")
      .attr('class', 'chart-card')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)');
    
    console.log("Line chart created:", svg.node() ? "Yes" : "No");

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

    const lineTemp = d3.line()
      .x(d => x(d.Year))
      .y(d => yTemp(d.LandAvgTemp))
      .curve(d3.curveMonotoneX);
    const lineCO2 = d3.line()
      .x(d => x(d.Year))
      .y(d => yCO2(d.CO2_Mt))
      .curve(d3.curveMonotoneX);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yTemp));
    svg.append('g')
      .attr('transform', `translate(${width - margin.right},0)`)
      .call(d3.axisRight(yCO2));

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
      .attr('y', width - margin.right + 50)
      .attr('fill', COLORS.co2)
      .text('CO₂ Emissions (Mt)');

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

    const markers = svg.append('g');

    const vline = svg.append('line')
      .attr('class', 'vertical-line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .style('opacity', 0);

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
        const idx = d3.bisector(d => d.Year).left(mergedData, year);
        const d0 = mergedData[Math.min(Math.max(idx, 0), mergedData.length - 1)];
        if (!d0) return;
        vline
          .attr('x1', x(d0.Year))
          .attr('x2', x(d0.Year))
          .style('opacity', 0.7);
        markers.selectAll('*').remove();
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
        const content = `
          <strong>${d0.Year}</strong><br/>
          Temp: ${d0.LandAvgTemp.toFixed(2)}°C<br/>
          CO₂: ${d0.CO2_Mt.toLocaleString()} Mt
        `;
        globalTooltip.show(content, event);
      })
      .on('mouseleave', () => {
        markers.selectAll('*').remove();
        vline.style('opacity', 0);
        globalTooltip.hide();
      });

    milestones.forEach(({ year, title, description }) => {
      const pt = mergedData.find(d => d.Year === year);
      if (!pt) return;
      const highlightGroup = svg.append('g')
        .attr('class', 'highlight-group');
      highlightGroup.append('circle')
        .attr('cx', x(pt.Year))
        .attr('cy', yTemp(pt.LandAvgTemp))
        .attr('r', 6)
        .attr('fill', COLORS.temp)
        .attr('class', 'glow-dot')
        .style('pointer-events', 'all');
      highlightGroup.append('circle')
        .attr('cx', x(pt.Year))
        .attr('cy', yTemp(pt.LandAvgTemp))
        .attr('r', 15)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all');
      highlightGroup.on('mouseover', (event) => {
        event.stopPropagation();
        const content = UnifiedTooltip.formatHighlight(`${title} (${year})`, 
          `${description}<br/><br/>Temperature: ${pt.LandAvgTemp.toFixed(2)}°C<br/>CO₂: ${pt.CO2_Mt.toLocaleString()} Mt`);
        
        globalTooltip.show(content, event, { className: 'highlight-tooltip' });
        
        vline
          .attr('x1', x(pt.Year))
          .attr('x2', x(pt.Year))
          .style('opacity', 0.7);
      });
      highlightGroup.on('mouseout', () => {
        globalTooltip.hide();
        vline.style('opacity', 0);
      });
    });

    svg.style("margin-bottom", "10px");
    
    clearLegend();
    
    const legend = viz.append('div')
      .attr('class', 'legend')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('width', '100%')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)');
      
    const tempLegend = legend.append('div')
      .attr('class', 'legend-item');
    tempLegend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.temp);
    tempLegend.append('span').text('Land Temperature');
    
    const co2Legend = legend.append('div')
      .attr('class', 'legend-item');
    co2Legend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.co2);
    co2Legend.append('span').text('CO₂ Emissions');
    
    const milestoneLegend = legend.append('div')
      .attr('class', 'legend-item');
    milestoneLegend.append('div')
      .attr('class', 'legend-dot glow-dot')
      .style('background', COLORS.temp);
    milestoneLegend.append('span').text('Milestone Years');
    
    return svg.node();
  }

  // Create scatter plot showing correlation between CO2 and temperature
  function renderScatterPlot() {
    console.log("Rendering scatter plot");
    
    if (!chartWrapper || chartWrapper.empty()) {
      console.error("Chart wrapper not available for scatter plot rendering");
      return null;
    }
    
    if (!mergedData || mergedData.length === 0) {
      console.error("No data available for scatter plot rendering");
      return null;
    }
    
    console.log("First data point:", mergedData[0]);
    console.log("Last data point:", mergedData[mergedData.length-1]);
    
    const container = document.getElementById("viz");
    console.log("Container dimensions for scatter:", container.clientWidth, "x", container.clientHeight);
    
    const availableWidth = container.clientWidth > 0 ? container.clientWidth : Math.min(900, window.innerWidth - 200);
    const availableHeight = container.clientHeight > 0 ? container.clientHeight : Math.min(500, window.innerHeight - 300);
    
    const containerWidth = chartWrapper.node().clientWidth > 0 ? chartWrapper.node().clientWidth : availableWidth;
    console.log("Scatter chart wrapper width:", containerWidth);
    
    const width = Math.max(400, Math.min(800, containerWidth - 40));
    const height = Math.max(300, Math.min(500, Math.min(width * 0.6, availableHeight - 100)));
    console.log("Final scatter dimensions:", width, "x", height);
    const margin = { top: 80, right: 60, bottom: 60, left: 70 };

    const svg = chartWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'chart-card')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)');

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

    const xAxis = d3.axisBottom(x).tickFormat(d3.format(','));
    const yAxis = d3.axisLeft(y);
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

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
    svg.selectAll('.grid .domain').remove();

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

    const colorScale = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.Year))
      .range(['#a8dadc', COLORS.co2]);
    
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

    const milestoneLookup = {};
    milestones.forEach(m => {
      milestoneLookup[m.year] = m;
    });

    const crosshair = svg.append('g')
      .style('display', 'none');
    const vLine = crosshair.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '3,3');
    const hLine = crosshair.append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '3,3');

    let lastHighlight = null;

    svg.append('rect')
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom)
      .on('mousemove', (event) => {
        const mouse = d3.pointer(event);
        const mx = mouse[0];
        const my = mouse[1];
        
        let nearest = null;
        let minDist = Infinity;
        circles.each(function(d) {
          const cx = x(d.CO2_Mt);
          const cy = y(d.LandAvgTemp);
          const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
          if (dist < minDist) {
            minDist = dist;
            nearest = { d, el: this };
          }
        });
        
        if (nearest && minDist < 20) {
          crosshair.style('display', null);
          vLine
            .attr('x1', x(nearest.d.CO2_Mt))
            .attr('x2', x(nearest.d.CO2_Mt))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom);
          hLine
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', my)
            .attr('y2', my);
          if (lastHighlight) {
            lastHighlight.attr('r', d => milestoneYears.includes(d.Year) ? 6 : 5);
          }
          d3.select(nearest.el).attr('r', 8);
          lastHighlight = d3.select(nearest.el);
          const m = milestoneLookup[nearest.d.Year];
          let content;
          
          if (m) {
            content = UnifiedTooltip.formatHighlight(`${m.title} (${nearest.d.Year})`, 
              `${m.description}<br/><br/>Temperature: ${nearest.d.LandAvgTemp.toFixed(2)}°C<br/>CO₂: ${nearest.d.CO2_Mt.toLocaleString()} Mt`);
          } else {
            content = `
              <strong>${nearest.d.Year}</strong><br/>
              Temp: ${nearest.d.LandAvgTemp.toFixed(2)}°C<br/>
              CO₂: ${nearest.d.CO2_Mt.toLocaleString()} Mt
            `;
          }
          
          globalTooltip.show(content, event, { className: 'scatter-tooltip' });
        }
      })
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        globalTooltip.hide();
        if (lastHighlight) {
          lastHighlight.attr('r', d => milestoneYears.includes(d.Year) ? 6 : 5);
          lastHighlight = null;
        }
      });

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

    // Add regression line to show correlation trend
    if (mergedData.length > 1) {
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

    svg.style("margin-bottom", "10px");
    
    d3.select("#viz .legend").remove();
    
    const legend = viz.append('div')
      .attr('class', 'legend')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('width', '100%')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)');
      
    const pointLegend = legend.append('div')
      .attr('class', 'legend-item');
    pointLegend.append('div')
      .attr('class', 'legend-dot')
      .style('background', COLORS.co2);
    pointLegend.append('span').text('Year (normal)');
    
    const milestoneLegendItem = legend.append('div')
      .attr('class', 'legend-item');
    milestoneLegendItem.append('div')
      .attr('class', 'legend-dot glow-dot')
      .style('background', COLORS.temp);
    milestoneLegendItem.append('span').text('Milestone Year');
    
    const regLegend = legend.append('div')
      .attr('class', 'legend-item');
    regLegend.append('div')
      .attr('class', 'legend-line')
      .style('background', COLORS.accent)
      .style('height', '2px');
    regLegend.append('span').text('Regression Line');
    
    return svg.node();
  }
  
  function renderChart(type) {
    console.log("renderChart called with type:", type);
    console.log("Data paths exist:", !!tempRaw, !!co2Raw);
    console.log("Merged data length:", mergedData.length);
    console.log("ChartWrapper exists:", !!chartWrapper);
    console.log("ChartWrapper node:", chartWrapper ? chartWrapper.node() : "null");
    
    if (!chartWrapper) {
      console.error("ChartWrapper is null! Cannot render chart.");
      return;
    }
    
    chartWrapper.selectAll('*').remove();
    viz.selectAll('.legend').remove();
    globalTooltip.hide();

    let chartSvg;
    
    if (type === 'Scatter Plot') {
      console.log("Calling renderScatterPlot()");
      chartSvg = renderScatterPlot();
    } else {
      console.log("Calling renderLineChart()");
      chartSvg = renderLineChart();
    }
    
    const svgNode = chartWrapper.select("svg").node();
    console.log("Chart created:", svgNode ? "Yes" : "No");
    if (svgNode) {
      console.log("Chart dimensions:", 
                d3.select(svgNode).attr("width"),
                d3.select(svgNode).attr("height"));
      d3.select(svgNode).attr("id", "scene2-chart");
    } else {
      console.error("Failed to create SVG chart!");
    }
    
    return svgNode;
  }
  
  function addControls() {
    const controls = viz.append('div')
      .attr('class', 'chart-controls')
      .style('display', 'flex')
      .style('width', '100%')
      .style('justify-content', 'center')
      .style('margin', '0 0 10px 0');

    controls.style('justify-content', 'center');

    const toggleGroup = controls.append('div')
      .attr('class', 'view-toggle-group')
      .style('display', 'flex')
      .style('gap', '8px');

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

    let currentType = 'Line Chart';

    const lineBtn = toggleGroup.append('button')
      .text('Line Chart');
    const scatterBtn = toggleGroup.append('button')
      .text('Scatter Plot');
      
    styleToggleButton(lineBtn, true);
    styleToggleButton(scatterBtn, false);

    lineBtn.on('click', () => {
      if (currentType !== 'Line Chart') {
        currentType = 'Line Chart';
        styleToggleButton(lineBtn, true);
        styleToggleButton(scatterBtn, false);
        
        renderChart(currentType);
        
        const chartSvg = chartWrapper.select("svg");
        if (!chartSvg.empty()) {
          chartSvg
            .style("opacity", "1")
            .style("transform", "translateY(0)");
        }
        
        const legend = viz.select('.legend');
        if (!legend.empty()) {
          legend.style('opacity', '1').style('transform', 'translateY(0)');
        }
      }
    });
    
    scatterBtn.on('click', () => {
      if (currentType !== 'Scatter Plot') {
        currentType = 'Scatter Plot';
        styleToggleButton(lineBtn, false);
        styleToggleButton(scatterBtn, true);
        
        renderChart(currentType);
        
        const chartSvg = chartWrapper.select("svg");
        if (!chartSvg.empty()) {
          chartSvg
            .style("opacity", "1")
            .style("transform", "translateY(0)");
        }
        
        const legend = viz.select('.legend');
        if (!legend.empty()) {
          legend.style('opacity', '1').style('transform', 'translateY(0)');
        }
      }
    });
  }

  // Main scene animation sequence
  async function animateScene() {
    console.log("Starting animation sequence...");
    
    console.log("Clearing captions...");
    d3.select('.caption-left').html('');
    d3.select('.caption-right').html('');

    ensureCaptionContainers();
    
    console.log("Hiding replay button...");
    const replayButton = d3.select("#replay-button")
      .style("opacity", "0")
      .style("transform", "scale(0)");

    console.log("Clearing visualization area...");
    viz.html('');
    
    chartWrapper = viz.append('div')
      .attr('class', 'chart-wrapper')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('overflow', 'visible')
      .style('position', 'relative');
      
    console.log("Chart wrapper created:", chartWrapper.node() ? "Yes" : "No");
      
    globalTooltip.init();
    
    console.log("Adding captions...");
    addCaptions();
    
    console.log("Adding controls...");
    addControls();
    
    console.log("Rendering chart...");
    await new Promise(resolve => setTimeout(resolve, 100));
    renderChart('Line Chart');
    
    console.log("Waiting for animation delay...");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const chart = chartWrapper.select("svg");
    console.log("Chart to animate:", chart.empty() ? "Not Found" : "Found");
    
    if (!chart.empty()) {
      console.log("Chart style before animation:", 
                  chart.style("opacity"),
                  chart.style("transform"));
                
      chart.transition()
        .duration(800)
        .style("opacity", "1")
        .style("transform", "translateY(0)")
        .on("end", () => {
          console.log("Chart animation complete");
        });
    } else {
      console.error("Chart element not found - could not animate");
    }
    
    await new Promise(resolve => setTimeout(resolve, 400));
    const legend = viz.select(".legend");
    console.log("Legend to animate:", legend.empty() ? "Not Found" : "Found");
    
    if (!legend.empty()) {
      legend.transition()
        .duration(500)
        .style("opacity", "1")
        .style("transform", "translateY(0)");
    } else {
      console.error("Legend element not found - could not animate");
      d3.selectAll("#viz .legend")
        .style("opacity", "1")
        .style("transform", "translateY(0)");
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    animateCaptions();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    replayButton
      .style("display", "flex")
      .transition()
      .duration(300)
      .style("opacity", "1")
      .style("transform", "scale(1)");
  }

  d3.select("#replay-button").on("click", animateScene);

  animateScene();
}
