import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const COLORS = {
  land: "#e63946",
  ocean: "#457b9d",
  annotation: "#fca311",
  text: "#1d3557",
  background: "#f1faee"
};

export async function initScene1() {
  const container = document.getElementById("viz");
  const width = Math.min(1200, container.offsetWidth - 20);
  const height = Math.min(600, window.innerHeight * 0.65);
  const margin = { top: 50, right: 160, bottom: 50, left: 80 };
  
  // Clear previous content
  container.innerHTML = "";
  
  // Create wrapper for better layout
  const wrapper = d3.select("#viz")
    .append("div")
    .attr("class", "viz-wrapper");

  const svg = d3.select(".viz-wrapper")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("class", "chart-card");

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

  // Add axes with labels
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .style("opacity", 0)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  const yAxis = svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .style("opacity", 0)
    .call(d3.axisLeft(y));

  // Add axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .style("opacity", 0)
    .text("Year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 25)
    .style("opacity", 0)
    .text("Temperature (°C)");

  // Animate axes entrance
  xAxis.transition()
    .duration(1000)
    .style("opacity", 1);

  yAxis.transition()
    .duration(1000)
    .style("opacity", 1);

  svg.selectAll(".axis-label")
    .transition()
    .delay(500)
    .duration(1000)
    .style("opacity", 1);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("class", "main-title")
    .text("Global Average Temperature (1900–2015)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("class", "subtitle")
    .text("Land vs Land + Ocean Temperatures (°C)");

  const tooltip = d3.select("#viz")
    .append("div")
    .attr("class", "tooltip");

  const verticalLine = svg.append("line")
    .attr("class", "vertical-line")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0);

  // Enhanced tooltip interaction
  const bisect = d3.bisector(d => d.Year).left;
  
  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", () => {
      verticalLine.style("opacity", 1);
      tooltip.style("opacity", 1);
    })
    .on("mouseout", () => {
      verticalLine.style("opacity", 0);
      tooltip.style("opacity", 0);
    })
    .on("mousemove", (event) => {
      const mouseX = d3.pointer(event)[0];
      const x0 = x.invert(mouseX);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 - d0.Year > d1.Year - x0 ? d1 : d0;

      verticalLine
        .attr("x1", x(d.Year))
        .attr("x2", x(d.Year));

      tooltip
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 28}px`)
        .html(`
          <strong>Year: ${d.Year}</strong><br>
          <span style="color: ${COLORS.land}">Land Temp: ${d.LandAvgTemp.toFixed(2)}°C</span><br>
          <span style="color: ${COLORS.ocean}">Land + Ocean: ${d.LandOceanAvgTemp.toFixed(2)}°C</span>
        `);
    });

  // Add legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 20})`)
    .style("opacity", 0);

  // Legend items
  const legendItems = [
    { color: COLORS.land, label: "Land Temperature" },
    { color: COLORS.ocean, label: "Land + Ocean Temperature" }
  ];

  legendItems.forEach((item, i) => {
    const lg = legend.append("g")
      .attr("transform", `translate(0, ${i * 25})`);

    lg.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("stroke", item.color)
      .attr("stroke-width", 2);

    lg.append("text")
      .attr("x", 30)
      .attr("y", 4)
      .text(item.label)
      .style("font-size", "12px");
  });

  // Animate legend entrance
  legend.transition()
    .delay(1500)
    .duration(1000)
    .style("opacity", 1);

  // Add replay button
  const replayButton = d3.select("#viz")
    .append("button")
    .attr("class", "replay-button")
    .html('<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>')
    .style("opacity", 0);

  // Function to handle replay animation
  function replayAnimation() {
    // Reset paths
    svg.selectAll("path").remove();
    
    // Redraw lines with animation
    const landPath = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", COLORS.land)
      .attr("stroke-width", 2)
      .attr("d", lineLand)
      .attr("stroke-dasharray", function() {
        const len = this.getTotalLength();
        return len + " " + len;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      });

    const oceanPath = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", COLORS.ocean)
      .attr("stroke-width", 2)
      .attr("d", lineOcean)
      .attr("stroke-dasharray", function() {
        const len = this.getTotalLength();
        return len + " " + len;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      });

    // Animate paths
    landPath.transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);

    oceanPath.transition()
      .duration(1500)
      .delay(200)
      .attr("stroke-dashoffset", 0);

    // Reset and animate annotations
    annotationGroup.selectAll("*").remove();
    addAnnotations();
  }

  replayButton.on("click", replayAnimation);

  // Show replay button after initial animation
  setTimeout(() => {
    replayButton.transition()
      .duration(500)
      .style("opacity", 1);
  }, 2000);

  // Add annotation dots with enhanced interactivity
  const annotations = [
    { 
      year: 1998, 
      temp: data.find(d => d.Year === 1998).LandAvgTemp, 
      text: "Strong El Niño",
      description: "One of the strongest El Niño events recorded, causing global temperature spike"
    },
    { 
      year: 2015, 
      temp: data.find(d => d.Year === 2015).LandAvgTemp, 
      text: "Paris Agreement & Record Heat",
      description: "Global climate accord signed as temperatures reach record highs"
    }
  ];

  const annotationGroup = svg.append("g")
    .attr("class", "annotations");

  function addAnnotations() {
    annotations.forEach(ann => {
      const dot = annotationGroup.append("g")
        .attr("transform", `translate(${x(ann.year)},${y(ann.temp)})`);

      // Add pulse animation circle
      dot.append("circle")
        .attr("class", "pulse-circle")
        .attr("r", 6)
        .attr("fill", "none")
        .attr("stroke", COLORS.annotation)
        .style("stroke-opacity", 1);

      // Add main dot
      dot.append("circle")
        .attr("class", "glow-dot")
        .attr("r", 6)
        .attr("fill", COLORS.annotation)
        .style("cursor", "pointer")
        .on("mouseover", (event) => {
          // Show annotation text
          annotationLabel
            .style("opacity", 1)
            .html(`
              <div class="annotation-title">${ann.text}</div>
              <div class="annotation-year">${ann.year}</div>
              <div class="annotation-temp">Temperature: ${ann.temp.toFixed(2)}°C</div>
              <div class="annotation-desc">${ann.description}</div>
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`);

          // Highlight the dot
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", 8);
        })
        .on("mouseout", (event) => {
          // Hide annotation text
          annotationLabel.style("opacity", 0);
          
          // Reset dot size
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", 6);
        });

      // Add text label
      // Remove the static text label as we'll show it in the tooltip instead
    });
  }

  // Add annotation label container
  const annotationLabel = d3.select("#viz")
    .append("div")
    .attr("class", "annotation-label")
    .style("opacity", 0);

  // Initial addition of annotations
  addAnnotations();

  // Draw animated lines
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", COLORS.land)
    .attr("stroke-width", 2)
    .attr("d", lineLand)
    .attr("stroke-dasharray", function () {
      const len = this.getTotalLength();
      return len + " " + len;
    })
    .attr("stroke-dashoffset", function () {
      return this.getTotalLength();
    })
    .transition()
    .duration(1500)
    .attr("stroke-dashoffset", 0);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#457b9d")
    .attr("stroke-width", 2)
    .attr("d", lineOcean)
    .attr("stroke-dasharray", function () {
      const len = this.getTotalLength();
      return len + " " + len;
    })
    .attr("stroke-dashoffset", function () {
      return this.getTotalLength();
    })
    .transition()
    .duration(1500)
    .delay(200)
    .attr("stroke-dashoffset", 0);

  // Remove duplicate annotations section as we already have enhanced annotations

  // Voronoi interaction
  const voronoi = d3.Delaunay.from(data, d => x(d.Year), d => y(d.LandAvgTemp)).voronoi([0, 0, width, height]);

  svg.append("g")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (_, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1)
        .html(`Year: ${d.Year}<br>Land: ${d.LandAvgTemp.toFixed(2)}°C<br>Ocean: ${d.LandOceanAvgTemp.toFixed(2)}°C`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 30 + "px");
      verticalLine
        .attr("x1", x(d.Year))
        .attr("x2", x(d.Year))
        .style("opacity", 0.7);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
      verticalLine.style("opacity", 0);
    });

  // Add the single caption below the graph
  const caption = d3.select(".viz-wrapper")
    .append("div")
    .attr("class", "caption")
    .style("opacity", 0)
    .html(`
      <p class="caption-text">
        <strong>Why it matters:</strong> A 2°C rise may not seem much, but it's enough to intensify wildfires, 
        flood coastal cities, and threaten global food security.
      </p>
    `);

  // Animate caption entrance
  caption.transition()
    .delay(2000)
    .duration(1000)
    .style("opacity", 1);
}