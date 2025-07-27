import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const COLORS = {
  cold: "#457b9d",
  warm: "#e63946",
  neutral: "#2a9d8f",
  text: "#1d3557",
  background: "#f1faee"
};

export async function initScene3() {
  const container = document.getElementById("viz");
  const width = Math.min(900, container.offsetWidth - 40);
  const height = Math.min(500, window.innerHeight * 0.75);
  const margin = { top: 80, right: 130, bottom: 100, left: 70 };

  const svg = d3.select("#viz")
    .html("")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("class", "chart-card");

  // Load country data
  const data = await d3.csv("public/assets/data/country_annual_temp.csv", d3.autoType);

  // Get unique countries and their warming rates
  const countries = Array.from(new Set(data.map(d => d.Country)));
  const warmingRates = calculateWarmingRates(data);

  // Create controls
  const controls = d3.select("#viz")
    .append("div")
    .attr("class", "controls");

  // Add country selector
  const selector = controls.append("select")
    .attr("class", "country-selector")
    .on("change", updateChart);

  selector.selectAll("option")
    .data(countries)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // Add view toggle
  const viewToggle = controls.append("button")
    .attr("class", "view-toggle")
    .text("Show All Regions")
    .on("click", toggleView);

  // Initialize with single country view
  let currentView = "single";
  let selectedCountry = countries[0];

  // Add titles with animation
  const title = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("class", "main-title")
    .style("opacity", 0)
    .text("Regional Temperature Changes (1900–2015)");

  const subtitle = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("class", "subtitle")
    .style("opacity", 0)
    .text("Explore how different regions experience warming");

  title.transition().duration(1000).style("opacity", 1);
  subtitle.transition().duration(1000).delay(500).style("opacity", 1);

  function calculateWarmingRates(data) {
    const rates = {};
    countries.forEach(country => {
      const countryData = data.filter(d => d.Country === country);
      const firstYear = countryData[0];
      const lastYear = countryData[countryData.length - 1];
      const years = lastYear.Year - firstYear.Year;
      rates[country] = (lastYear.AverageTemperature - firstYear.AverageTemperature) / years;
    });
    return rates;
  }

  function createSingleCountryChart(country) {
    const countryData = data.filter(d => d.Country === country);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.Year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(countryData, d => d.AverageTemperature))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.Year))
      .y(d => y(d.AverageTemperature))
      .curve(d3.curveMonotoneX);

    const chart = svg.append("g").attr("class", "chart");

    // Add axes
    chart.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    chart.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add the temperature line
    const path = chart.append("path")
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", COLORS.neutral)
      .attr("stroke-width", 2)
      .attr("d", line)
      .style("opacity", 0);

    path.transition()
      .duration(1500)
      .style("opacity", 1);

    // Add warming rate indicator
    const rate = warmingRates[country];
    const rateColor = rate > 0 ? COLORS.warm : COLORS.cold;

    chart.append("text")
      .attr("class", "warming-rate")
      .attr("x", width - margin.right + 20)
      .attr("y", margin.top)
      .attr("fill", rateColor)
      .text(`Warming rate: ${rate.toFixed(4)}°C/year`);

    return chart;
  }

  function createSmallMultiples() {
    const columns = 3;
    const rows = Math.ceil(countries.length / columns);
    const cellWidth = (width - margin.left - margin.right) / columns;
    const cellHeight = (height - margin.top - margin.bottom) / rows;

    const chart = svg.append("g").attr("class", "chart");

    countries.forEach((country, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = margin.left + col * cellWidth;
      const y = margin.top + row * cellHeight;

      const countryData = data.filter(d => d.Country === country);
      const rate = warmingRates[country];
      const color = rate > 0 ? COLORS.warm : COLORS.cold;

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, cellWidth - 20]);

      const yScale = d3.scaleLinear()
        .domain(d3.extent(countryData, d => d.AverageTemperature))
        .nice()
        .range([cellHeight - 20, 0]);

      const line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.AverageTemperature))
        .curve(d3.curveMonotoneX);

      const cell = chart.append("g")
        .attr("transform", `translate(${x},${y})`);

      cell.append("rect")
        .attr("width", cellWidth - 10)
        .attr("height", cellHeight - 10)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("opacity", 0.1);

      cell.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("d", line)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay(i * 50)
        .style("opacity", 1);

      cell.append("text")
        .attr("x", cellWidth / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(country);
    });

    return chart;
  }

  function updateChart() {
    selectedCountry = this.value;
    svg.select(".chart").remove();
    createSingleCountryChart(selectedCountry);
  }

  function toggleView() {
    currentView = currentView === "single" ? "multiple" : "single";
    viewToggle.text(currentView === "single" ? "Show All Regions" : "Show Single Region");
    
    svg.select(".chart").remove();
    if (currentView === "single") {
      selector.style("display", "inline-block");
      createSingleCountryChart(selectedCountry);
    } else {
      selector.style("display", "none");
      createSmallMultiples();
    }
  }

  // Initialize with single country view
  createSingleCountryChart(selectedCountry);

  // Add caption
  d3.select("#viz")
    .append("div")
    .attr("class", "caption")
    .style("opacity", 0)
    .html(`
      <p class="caption-text">
        Not all regions are heating equally. Some — like the Arctic or Middle East —
        are warming nearly twice as fast as the global average.
      </p>
    `)
    .transition()
    .delay(2000)
    .duration(1000)
    .style("opacity", 1);
}
