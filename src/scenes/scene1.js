import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { globalTooltip, UnifiedTooltip } from '../d3-components/tooltip.js';

export async function initScene1() {
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

  function addCaptions() {
    const leftCaptions = [
      {
        id: "caption-1",
        title: "Why it matters?",
        text: "A 2°C rise may not seem much, but it's enough to intensify wildfires, flood coastal cities, and threaten global food security."
      },
      {
        id: "caption-2",
        title: "Land vs Ocean",
        text: "Land temperatures show greater variability and faster warming compared to combined land-ocean measurements, highlighting the ocean's moderating effect on climate."
      }
    ];
    
    const rightCaptions = [
      {
        id: "caption-3",
        title: "Recent Acceleration",
        text: "The rate of warming has accelerated in recent decades, with the period since 2000 showing some of the most dramatic increases in recorded history."
      },
      {
        id: "caption-4",
        title: "Critical Thresholds",
        text: "The observed temperature increases are approaching critical thresholds that scientists warn could trigger irreversible changes in Earth's climate systems."
      }
    ];
    
    const leftContainer = d3.select(".caption-left");
    leftCaptions.forEach(caption => {
      leftContainer.append("div")
        .attr("class", "narrative-caption")
        .attr("id", caption.id)
        .style("opacity", "0")
        .style("transform", "translateY(20px)")
        .html(`
          <h3>${caption.title}</h3>
          <p>${caption.text}</p>
        `);
    });
    
    const rightContainer = d3.select(".caption-right");
    rightCaptions.forEach(caption => {
      rightContainer.append("div")
        .attr("class", "narrative-caption")
        .attr("id", caption.id)
        .style("opacity", "0")
        .style("transform", "translateY(20px)")
        .html(`
          <h3>${caption.title}</h3>
          <p>${caption.text}</p>
        `);
    });
  };

  const animateCaptions = () => {
    const captions = d3.selectAll('.narrative-caption');
    captions.each((d, i, nodes) => {
      setTimeout(() => {
        d3.select(nodes[i])
          .transition()
          .duration(300)
          .style("opacity", "1")
          .style("transform", "translateY(0)");
      }, i * 300);
    });
  };

  // Main animation sequence for the scene
  const animateScene = async () => {
    d3.selectAll('.caption-left, .caption-right').html('');
    d3.select("#viz").html('');
    
    ensureCaptionContainers();
    
    const replayButton = d3.select("#replay-button")
      .style("opacity", "0")
      .style("transform", "scale(0)");

    addCaptions();
    
    await createChart();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    d3.select("#viz svg.chart-card")
      .transition()
      .duration(800)
      .style("opacity", "1")
      .style("transform", "translateY(0)");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    d3.select("#viz .legend")
      .transition()
      .duration(500)
      .style("opacity", "1")
      .style("transform", "translateY(0)");
    
    await new Promise(resolve => setTimeout(resolve, 500));
    animateCaptions();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    replayButton
      .style("display", "flex")
      .transition()
      .duration(300)
      .style("opacity", "1")
      .style("transform", "scale(1)");
  };

  d3.select("#replay-button").on("click", animateScene);

  animateScene();

  // Create temperature line chart
  async function createChart() {
    const container = document.getElementById("viz");
    
    const availableWidth = container.clientWidth || Math.min(800, window.innerWidth - 100);
    const availableHeight = container.clientHeight || Math.min(500, window.innerHeight - 200);
    
    const width = Math.min(availableWidth * 0.95, availableWidth - 40);
    const height = Math.min(availableHeight * 0.85, availableHeight - 60);
    
    const margin = { top: 80, right: 70, bottom: 60, left: 70 };

    const svg = d3.select("#viz")
      .html("")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible")
      .style("max-width", "100%")
      .style("max-height", "100%")
      .attr("class", "chart-card")
    .style("opacity", "0")
    .style("transform", "translateY(20px)");

  const data = await d3.csv("public/assets/data/global_annual_temp.csv", d3.autoType);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => Math.min(d.LandAvgTemp, d.LandOceanAvgTemp)) - 0.5,
      d3.max(data, d => Math.max(d.LandAvgTemp, d.LandOceanAvgTemp)) + 0.5
    ])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const lineLand = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.LandAvgTemp))
    .curve(d3.curveMonotoneX);

  const lineOcean = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.LandOceanAvgTemp))
    .curve(d3.curveMonotoneX);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .text("Year");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));
    
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left - 40)
    .attr("x", -(height / 2))
    .style("text-anchor", "middle")
    .text("Temperature (°C)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("class", "main-title")
    .text("Global Average Temperature (1900–2015)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("class", "subtitle")
    .text("[Land] vs [Land + Ocean] Temperatures (°C)");
    
  svg.style("margin-bottom", "10px");
  
  d3.select("#viz .legend").remove();
  
  const legendContainer = d3.select("#viz")
    .append("div")
    .attr("class", "legend")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("width", "100%")
    .style("opacity", "0")
    .style("transform", "translateY(20px)");
  
  const landLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  landLegend.append("div")
    .attr("class", "legend-line")
    .style("background", "#e63946");
  landLegend.append("span")
    .text("Land Temperature");
    
  const oceanLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  oceanLegend.append("div")
    .attr("class", "legend-line")
    .style("background", "#457b9d");
  oceanLegend.append("span")
    .text("Land + Ocean Temperature");
    
  const highlightLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  highlightLegend.append("div")
    .attr("class", "legend-dot glow-dot")
    .style("background", "#e63946");
  highlightLegend.append("span")
    .text("Significant Events");

  globalTooltip.init();

  const verticalLine = svg.append("line")
    .attr("class", "vertical-line")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0)
    .style("stroke", "#666")
    .style("stroke-width", "1px")
    .style("stroke-dasharray", "4,4");
    
  const updateVerticalLine = (year) => {
    verticalLine
      .attr("x1", x(year))
      .attr("x2", x(year))
      .style("opacity", 0.7);
  };

  // Create animated temperature line paths
  const landPath = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#e63946")
    .attr("stroke-width", 2)
    .attr("d", lineLand)
    .style("opacity", 0)
    .attr("stroke-dasharray", function() {
      return this.getTotalLength();
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });

  const oceanPath = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#457b9d")
    .attr("stroke-width", 2)
    .attr("d", lineOcean)
    .style("opacity", 0)
    .attr("stroke-dasharray", function() {
      return this.getTotalLength();
    })
    .attr("stroke-dashoffset", function() {
      return this.getTotalLength();
    });

  landPath.transition()
    .duration(3500)
    .style("opacity", 1)
    .attr("stroke-dashoffset", 0);

  oceanPath.transition()
    .duration(3500)
    .style("opacity", 1)
    .attr("stroke-dashoffset", 0);

  // Historical climate events with tooltips
  const highlights = [
    { 
      year: 1998, 
      label: "Strong El Niño Event",
      description: "One of the strongest El Niño events recorded, causing global temperature spike and widespread climate disruption",
      color: "#e63946" 
    },
    { 
      year: 2015, 
      label: "Paris Agreement",
      description: "196 countries agreed to limit global temperature rise to well below 2°C above pre-industrial levels",
      color: "#e63946" 
    }
  ];

  const voronoiGroup = svg.append("g")
    .attr("class", "voronoi-layer")
    .style("pointer-events", "all");

  const highlightsGroup = svg.append("g")
    .attr("class", "highlights-group")
    .style("pointer-events", "all");

  const voronoi = d3.Delaunay
    .from(data, d => x(d.Year), d => y(d.LandAvgTemp))
    .voronoi([margin.left, margin.top, width - margin.right, height - margin.bottom]);

  voronoiGroup.selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (_, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => {
      const content = `
        <strong>${d.Year}</strong><br>
        Land: ${d.LandAvgTemp.toFixed(2)}°C<br>
        Ocean: ${d.LandOceanAvgTemp.toFixed(2)}°C
      `;
      globalTooltip.show(content, event);
      updateVerticalLine(d.Year);
    })
    .on("mouseout", () => {
      globalTooltip.hide();
      verticalLine.style("opacity", 0);
    });

  highlights.forEach(({ year, label, description, color }) => {
    console.log(`Processing highlight for year ${year}`);
    const pt = data.find(d => d.Year === year);
    if (!pt) {
      console.error(`No data found for year ${year}`);
      return;
    }
    console.log('Found data point:', pt);

    const dotGroup = highlightsGroup.append("g")
      .attr("class", "highlight-group")

    const handleMouseOver = (event) => {
      event.stopPropagation();
      console.log(`Mouseover triggered for year ${year}`);
      
      const content = UnifiedTooltip.formatHighlight(`${label} (${year})`, 
        `${description}<br><br>Temperature: ${pt.LandAvgTemp.toFixed(2)}°C`);
      
      globalTooltip.show(content, event, { className: 'highlight-tooltip' });
      updateVerticalLine(pt.Year);
    };

    const handleMouseOut = () => {
      globalTooltip.hide();
      verticalLine.style("opacity", 0);
    };

    const dot = dotGroup.append("circle")
      .attr("cx", x(pt.Year))
      .attr("cy", y(pt.LandAvgTemp))
      .attr("r", 6)
      .attr("fill", color)
      .attr("class", "glow-dot")
      .style("pointer-events", "all");

    dot.on("mouseover", handleMouseOver)
       .on("mouseout", handleMouseOut);
    
    dotGroup.append("circle")
      .attr("cx", x(pt.Year))
      .attr("cy", y(pt.LandAvgTemp))
      .attr("r", 15)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);
  });

    highlightsGroup.raise();
  }
  animateScene();
}
