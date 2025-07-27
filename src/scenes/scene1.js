import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function initScene1() {
  // Clear existing captions
  d3.selectAll('.caption-left, .caption-right').html('');
  
  // Define the captions data
  const leftCaptions = [
    {
      id: "caption-1",
      title: "Rising Global Temperatures",
      text: "Since 1900, Earth has experienced a significant increase in average temperatures, with the trend becoming more pronounced after 1980."
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
  
  // Add left captions
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
  
  // Add right captions
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

  // Animate captions sequentially
  const animateCaptions = () => {
    const captions = d3.selectAll('.narrative-caption');
    captions.each((d, i, nodes) => {
      setTimeout(() => {
        d3.select(nodes[i])
          .transition()
          .duration(300)
          .style("opacity", "1")
          .style("transform", "translateY(0)");
      }, i * 300); // 300ms delay between each caption
    });
  };

  const container = document.getElementById("viz");
  const width = Math.min(800, container.offsetWidth - 40); // reduced from 900
  const height = Math.min(500, window.innerHeight * 0.75);
  
  // Start caption animation after a short delay
  setTimeout(animateCaptions, 500);
  const margin = { top: 80, right: 70, bottom: 60, left: 70 }; // reduced right margin from 130 to 70

  const svg = d3.select("#viz")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("overflow", "visible")
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

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

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
    
  // Add legend below the chart
  svg.style("margin-bottom", "10px"); // Add space between chart and legend
  
  // Remove any existing legend first
  d3.select("#viz .legend").remove();
  
  const legendContainer = d3.select("#viz")
    .append("div")
    .attr("class", "legend")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("width", "100%");
  
  // Legend for land temperature
  const landLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  landLegend.append("div")
    .attr("class", "legend-line")
    .style("background", "#e63946");
  landLegend.append("span")
    .text("Land Temperature");
    
  // Legend for ocean temperature
  const oceanLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  oceanLegend.append("div")
    .attr("class", "legend-line")
    .style("background", "#457b9d");
  oceanLegend.append("span")
    .text("Land + Ocean Temperature");
    
  // Legend for highlight events
  const highlightLegend = legendContainer.append("div")
    .attr("class", "legend-item");
  highlightLegend.append("div")
    .attr("class", "legend-dot glow-dot")
    .style("background", "#e63946");
  highlightLegend.append("span")
    .text("Significant Events");

  const tooltip = d3.select("#viz")
    .append("div")
    .attr("class", "tooltip");

  // Create vertical guide line
  const verticalLine = svg.append("line")
    .attr("class", "vertical-line")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0)
    .style("stroke", "#666")
    .style("stroke-width", "1px")
    .style("stroke-dasharray", "4,4");
    
  // Function to update vertical line
  const updateVerticalLine = (year) => {
    verticalLine
      .attr("x1", x(year))
      .attr("x2", x(year))
      .style("opacity", 0.7);
  };

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#e63946")
    .attr("stroke-width", 2)
    .attr("d", lineLand);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#457b9d")
    .attr("stroke-width", 2)
    .attr("d", lineOcean);

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

  // Create the base layers in correct order: voronoi at bottom, highlights at top
  const voronoiGroup = svg.append("g")
    .attr("class", "voronoi-layer")
    .style("pointer-events", "all");

  const highlightsGroup = svg.append("g")
    .attr("class", "highlights-group")
    .style("pointer-events", "all");

  // Set up voronoi
  const voronoi = d3.Delaunay
    .from(data, d => x(d.Year), d => y(d.LandAvgTemp))
    .voronoi([margin.left, margin.top, width - margin.right, height - margin.bottom]);

  // Add voronoi interaction layer
  voronoiGroup.selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (_, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => {
      const mouseX = event.pageX;
      const mouseY = event.pageY;
      const tooltipOffset = { x: 15, y: 20 };

      tooltip
        .attr("class", "tooltip")
        .html(`
          <strong>${d.Year}</strong>
          Land: ${d.LandAvgTemp.toFixed(2)}°C<br>
          Ocean: ${d.LandOceanAvgTemp.toFixed(2)}°C
        `)
        .style("left", `${mouseX + tooltipOffset.x}px`)
        .style("top", `${mouseY - tooltipOffset.y}px`)
        .style("opacity", 1)
        .style("visibility", "visible");

      updateVerticalLine(d.Year);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0).style("visibility", "hidden");
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

    // Create highlight dot group
    const dotGroup = highlightsGroup.append("g")
      .attr("class", "highlight-group")

    // Create event handlers
    const handleMouseOver = (event) => {
      event.stopPropagation(); // Prevent event bubbling
      console.log(`Mouseover triggered for year ${year}`);
      
      // Calculate tooltip position
      const mouseX = event.pageX;
      const mouseY = event.pageY;
      const tooltipOffset = { x: 15, y: 20 }; // Offset from cursor
      
      tooltip
        .attr("class", "tooltip highlight-tooltip")
        .html(`
          <strong>${label} (${year})</strong>
          ${description}<br><br>
          Temperature: ${pt.LandAvgTemp.toFixed(2)}°C
        `)
        .style("left", `${mouseX + tooltipOffset.x}px`)
        .style("top", `${mouseY - tooltipOffset.y}px`)
        .style("opacity", 1)
        .style("visibility", "visible");
      
      console.log('Tooltip HTML set to:', tooltip.html());
      console.log('Tooltip position:', { left: mouse.x, top: mouse.y });
      
      updateVerticalLine(pt.Year);
    };

    const handleMouseOut = () => {
      tooltip.style("opacity", 0).style("visibility", "hidden");
      verticalLine.style("opacity", 0);
    };

    // Add the visible glowing dot with interactive capabilities
    const dot = dotGroup.append("circle")
      .attr("cx", x(pt.Year))
      .attr("cy", y(pt.LandAvgTemp))
      .attr("r", 6)
      .attr("fill", color)
      .attr("class", "glow-dot")
      .style("pointer-events", "all");

    // Add event listeners
    dot.on("mouseover", handleMouseOver)
       .on("mouseout", handleMouseOut);
    
    // Add larger invisible circle for better interaction
    dotGroup.append("circle")
      .attr("cx", x(pt.Year))
      .attr("cy", y(pt.LandAvgTemp))
      .attr("r", 15)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);
  });

  // Raise highlights above voronoi layer
  highlightsGroup.raise();

  // Inject Scene 1 caption
  d3.select(".narrative-caption")
    .html(
      `<strong>Why it matters:</strong> A 2°C rise may not seem much, 
      but it's enough to intensify wildfires, flood coastal cities, 
      and threaten global food security.`
    )
    .style("opacity", 1)
    .style("display", "block");
}