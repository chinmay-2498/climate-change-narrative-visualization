import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const COLORS = {
  land: "#e63946",
  ocean: "#457b9d",
  annotation: "#fca311",
  text: "#1d3557",
  background: "#f1faee",
  correlation: "#2a9d8f"
};

export async function initScene2() {
  const container = document.getElementById("viz");
  const width = Math.min(900, container.offsetWidth - 40);
  const height = Math.min(500, window.innerHeight * 0.75);
  const margin = { top: 80, right: 130, bottom: 100, left: 70 };

  // Load both datasets
  const [tempData, co2Data] = await Promise.all([
    d3.csv("public/assets/data/global_annual_temp.csv", d3.autoType),
    d3.csv("public/assets/data/owid-co2-data.csv", d3.autoType)
  ]);

  // Create the initial view
  const svg = d3.select("#viz")
    .html("")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("class", "chart-card");

  // Add titles with animation
  const title = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("class", "main-title")
    .style("opacity", 0)
    .text("CO₂ and Temperature: A Clear Connection");

  const subtitle = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("class", "subtitle")
    .style("opacity", 0)
    .text("Toggle between views to explore the relationship");

  title.transition().duration(1000).style("opacity", 1);
  subtitle.transition().duration(1000).delay(500).style("opacity", 1);

  // Add view toggle button
  const toggleButton = d3.select("#viz")
    .append("button")
    .attr("class", "view-toggle")
    .text("Switch to Scatter Plot")
    .on("click", toggleView);

  let currentView = "line";
  let chart = createLineChart(); // Start with line chart

  function toggleView() {
    currentView = currentView === "line" ? "scatter" : "line";
    toggleButton.text(currentView === "line" ? "Switch to Scatter Plot" : "Switch to Line Chart");
    
    // Transition between views
    if (currentView === "line") {
      chart.remove();
      chart = createLineChart();
    } else {
      chart.remove();
      chart = createScatterPlot();
    }
  }

  function createLineChart() {
    const chartGroup = svg.append("g").attr("class", "chart");

    const x = d3.scaleLinear()
      .domain(d3.extent(tempData, d => d.Year))
      .range([margin.left, width - margin.right]);

    const y1 = d3.scaleLinear()
      .domain([
        d3.min(tempData, d => d.LandAvgTemp) - 0.5,
        d3.max(tempData, d => d.LandAvgTemp) + 0.5
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const y2 = d3.scaleLinear()
      .domain(d3.extent(co2Data, d => d.co2))
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add axes
    chartGroup.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    chartGroup.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y1));

    chartGroup.append("g")
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(d3.axisRight(y2));

    // Draw lines with animation
    const tempLine = d3.line()
      .x(d => x(d.Year))
      .y(d => y1(d.LandAvgTemp))
      .curve(d3.curveMonotoneX);

    const co2Line = d3.line()
      .x(d => x(d.Year))
      .y(d => y2(d.co2))
      .curve(d3.curveMonotoneX);

    // Add the lines with animation
    const tempPath = chartGroup.append("path")
      .datum(tempData)
      .attr("fill", "none")
      .attr("stroke", COLORS.land)
      .attr("stroke-width", 2)
      .attr("d", tempLine)
      .style("opacity", 0);

    const co2Path = chartGroup.append("path")
      .datum(co2Data)
      .attr("fill", "none")
      .attr("stroke", COLORS.correlation)
      .attr("stroke-width", 2)
      .attr("d", co2Line)
      .style("opacity", 0);

    tempPath.transition()
      .duration(1500)
      .style("opacity", 1);

    co2Path.transition()
      .duration(1500)
      .style("opacity", 1);

    // Add axis labels
    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .text("Year");

    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 25)
      .text("Temperature (°C)");

    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(90)")
      .attr("x", height / 2)
      .attr("y", -width + margin.right - 5)
      .text("CO₂ (ppm)");

    return chartGroup;
  }

  function createScatterPlot() {
    const chartGroup = svg.append("g").attr("class", "chart");

    // Create merged dataset for scatter plot
    const mergedData = tempData.map(temp => {
      const co2Entry = co2Data.find(co2 => co2.Year === temp.Year);
      return {
        Year: temp.Year,
        Temperature: temp.LandAvgTemp,
        CO2: co2Entry ? co2Entry.co2 : null
      };
    }).filter(d => d.CO2 !== null);

    const x = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.CO2))
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.Temperature))
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add axes
    chartGroup.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    chartGroup.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add scatter points with animation
    chartGroup.selectAll("circle")
      .data(mergedData)
      .join("circle")
      .attr("cx", d => x(d.CO2))
      .attr("cy", d => y(d.Temperature))
      .attr("r", 4)
      .attr("fill", COLORS.correlation)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 0.6);

    // Add trend line
    const regression = d3.regressionLinear()
      .x(d => d.CO2)
      .y(d => d.Temperature);

    const regressionLine = regression(mergedData);

    chartGroup.append("line")
      .attr("x1", x(regressionLine[0][0]))
      .attr("y1", y(regressionLine[0][1]))
      .attr("x2", x(regressionLine[1][0]))
      .attr("y2", y(regressionLine[1][1]))
      .attr("stroke", COLORS.land)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1000)
      .style("opacity", 1);

    // Add axis labels
    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .text("CO₂ Concentration (ppm)");

    chartGroup.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 25)
      .text("Temperature (°C)");

    return chartGroup;
  }

  // Add caption
  d3.select("#viz")
    .append("div")
    .attr("class", "caption")
    .style("opacity", 0)
    .html(`
      <p class="caption-text">
        As CO₂ accumulates in the atmosphere, it traps heat and temperatures rise.
        The relationship between CO₂ levels and global temperature shows a clear correlation.
      </p>
    `)
    .transition()
    .delay(2000)
    .duration(1000)
    .style("opacity", 1);
}
