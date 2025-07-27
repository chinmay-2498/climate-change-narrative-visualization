// scene1.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { drawLineChart } from "../d3-components/chart.js";

export async function initScene1() {
  const width = 800;
  const height = 400;
  const margin = { top: 60, right: 40, bottom: 50, left: 60 };

  const svg = d3.select("#viz")
    .html("") // Clear previous scene
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const data = await d3.csv("public/assets/data/global_annual_temp.csv", d3.autoType);

  // Set up scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => Math.min(d.LandAvgTemp, d.LandOceanAvgTemp)) - 1,
      d3.max(data, d => Math.max(d.LandAvgTemp, d.LandOceanAvgTemp)) + 1
    ])
    .range([height - margin.bottom, margin.top]);

  // Draw lines
  drawLineChart(svg, data, x, y, "Year", "LandAvgTemp", "red", "Land Temp");
  drawLineChart(svg, data, x, y, "Year", "LandOceanAvgTemp", "steelblue", "Land & Ocean");

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .text("Global Average Temperatures (Land vs Land & Ocean)");

  // Annotation
  svg.append("text")
    .attr("x", x(2015))
    .attr("y", y(data.find(d => d.Year === 2015)?.LandAvgTemp) - 10)
    .attr("fill", "red")
    .text("2015: Hottest year in dataset");

  svg.append("text")
    .attr("x", x(1998))
    .attr("y", y(data.find(d => d.Year === 1998)?.LandAvgTemp) - 10)
    .attr("fill", "red")
    .text("1998: Major El Niño spike");
}