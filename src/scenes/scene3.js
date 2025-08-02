import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { globalTooltip, UnifiedTooltip } from '../d3-components/tooltip.js';

export async function initScene3() {
  // Color palette and constants
  const COLORS = {
    primary: "#e63946",   // red
    secondary: "#457b9d", // blue
    accent: "#2a9d8f",    // green
    text: "#1d3557",      // dark blue
    neutral: "#ddd",      // light gray for missing data
    selected: "#f4a261",  // orange for selected country
    highlight: "#e76f51"  // coral for hover
  };

  // Load data and geography
  console.log("Loading Scene 3 data...");
  let tempData = [], world = null, worldGeo = null;

  try {
    // Load both datasets in parallel
    const [tempRaw, worldData] = await Promise.all([
      d3.csv('public/assets/data/country_annual_temp.csv', d3.autoType),
      d3.json('public/assets/data/countries-110m.json')
    ]);

    tempData = tempRaw;
    world = worldData;
    
    // Validate the data
    if (!tempData || tempData.length === 0) {
      throw new Error("Temperature data is empty or invalid");
    }
    
    if (!world || !world.objects || !world.objects.countries) {
      throw new Error("World geography data is invalid or missing countries");
    }
    
    worldGeo = topojson.feature(world, world.objects.countries);
    
    console.log("Data loaded successfully:", 
                tempData.length, "temperature records,",
                worldGeo.features.length, "countries");
  } catch (error) {
    console.error("Error loading data:", error);
    // Fallback to alternative paths
    try {
      const [tempRaw, worldData] = await Promise.all([
        d3.csv('assets/data/country_annual_temp.csv', d3.autoType),
        d3.json('assets/data/countries-110m.json')
      ]);
      tempData = tempRaw;
      world = worldData;
      
      // Validate fallback data
      if (!tempData || tempData.length === 0) {
        throw new Error("Fallback temperature data is empty or invalid");
      }
      
      if (!world || !world.objects || !world.objects.countries) {
        throw new Error("Fallback world geography data is invalid or missing countries");
      }
      
      worldGeo = topojson.feature(world, world.objects.countries);
      console.log("Data loaded successfully with alternative paths");
    } catch (fallbackError) {
      console.error("Error loading data with fallback paths:", fallbackError);
      alert("Error loading climate data. Please check that data files exist in the assets folder.");
      return;
    }
  }

  // Data processing
  const years = d3.range(1900, 2016); // 1900 to 2015
  const baseYear = 1900;
  
  // Create lookup tables for temperature data
  const tempByCountryYear = new Map();
  tempData.forEach(d => {
    const key = `${d.Country}-${d.Year}`;
    tempByCountryYear.set(key, d.AvgTemp);
  });

  // Calculate baseline temperatures (1900) for each country
  const baselineTemps = new Map();
  const availableCountries = new Set();
  
  tempData.filter(d => d.Year === baseYear).forEach(d => {
    if (d.AvgTemp !== null && d.AvgTemp !== undefined && !isNaN(d.AvgTemp)) {
      baselineTemps.set(d.Country, d.AvgTemp);
      availableCountries.add(d.Country);
    }
  });

  console.log("Countries with baseline data:", availableCountries.size);

  // Country name mapping (TopoJSON properties.name to CSV Country)
  const countryNameMap = new Map([
    ["United States of America", "United States"],
    ["United States", "United States"],
    ["Russia", "Russia"],
    ["Russian Federation", "Russia"],
    ["Antarctica", "Antarctica"],
    ["Fr. S. Antarctic Lands", "Antarctica"],
    ["Falkland Is.", "Antarctica"],
    ["eSwatini", "South Africa"],
    ["China", "China"],
    ["United Kingdom", "United Kingdom"],
    ["France", "France"],
    ["Germany", "Germany"],
    ["Spain", "Spain"],
    ["Italy", "Italy"],
    ["Poland", "Poland"],
    ["Ukraine", "Ukraine"],
    ["Romania", "Romania"],
    ["Netherlands", "Netherlands"],
    ["Belgium", "Belgium"],
    ["Greece", "Greece"],
    ["Portugal", "Portugal"],
    ["Czech Republic", "Czech Republic"],
    ["Czechia", "Czech Republic"],
    ["Hungary", "Hungary"],
    ["Sweden", "Sweden"],
    ["Austria", "Austria"],
    ["Belarus", "Belarus"],
    ["Switzerland", "Switzerland"],
    ["Bulgaria", "Bulgaria"],
    ["Serbia", "Serbia"],
    ["Denmark", "Denmark"],
    ["Finland", "Finland"],
    ["Slovakia", "Slovakia"],
    ["Norway", "Norway"],
    ["Ireland", "Ireland"],
    ["Croatia", "Croatia"],
    ["Bosnia and Herz.", "Bosnia And Herzegovina"],
    ["Albania", "Albania"],
    ["Lithuania", "Lithuania"],
    ["Slovenia", "Slovenia"],
    ["Latvia", "Latvia"],
    ["Estonia", "Estonia"],
    ["Macedonia", "Macedonia"],
    ["Moldova", "Moldova"],
    ["Luxembourg", "Luxembourg"],
    ["Malta", "Malta"],
    ["Iceland", "Iceland"],
    ["Turkey", "Turkey"],
    ["India", "India"],
    ["Iran", "Iran"],
    ["Mongolia", "Mongolia"],
    ["Kazakhstan", "Kazakhstan"],
    ["Afghanistan", "Afghanistan"],
    ["Pakistan", "Pakistan"],
    ["Uzbekistan", "Uzbekistan"],
    ["Saudi Arabia", "Saudi Arabia"],
    ["Iraq", "Iraq"],
    ["Turkmenistan", "Turkmenistan"],
    ["Syria", "Syria"],
    ["Jordan", "Jordan"],
    ["Israel", "Israel"],
    ["Lebanon", "Lebanon"],
    ["Armenia", "Armenia"],
    ["Kuwait", "Kuwait"],
    ["Georgia", "Georgia"],
    ["Oman", "Oman"],
    ["Qatar", "Qatar"],
    ["United Arab Emirates", "United Arab Emirates"],
    ["Yemen", "Yemen"],
    ["Bahrain", "Bahrain"],
    ["Canada", "Canada"],
    ["Greenland", "Greenland"],
    ["Mexico", "Mexico"],
    ["Guatemala", "Guatemala"],
    ["Cuba", "Cuba"],
    ["Haiti", "Haiti"],
    ["Dominican Rep.", "Dominican Republic"],
    ["Honduras", "Honduras"],
    ["Nicaragua", "Nicaragua"],
    ["Costa Rica", "Costa Rica"],
    ["Panama", "Panama"],
    ["Jamaica", "Jamaica"],
    ["Brazil", "Brazil"],
    ["Argentina", "Argentina"],
    ["Chile", "Chile"],
    ["Peru", "Peru"],
    ["Colombia", "Colombia"],
    ["Bolivia", "Bolivia"],
    ["Venezuela", "Venezuela"],
    ["Ecuador", "Ecuador"],
    ["Paraguay", "Paraguay"],
    ["Uruguay", "Uruguay"],
    ["Guyana", "Guyana"],
    ["Suriname", "Suriname"],
    ["Algeria", "Algeria"],
    ["Libya", "Libya"],
    ["Egypt", "Egypt"],
    ["Sudan", "Sudan"],
    ["S. Sudan", "Sudan"],
    ["Chad", "Chad"],
    ["Niger", "Niger"],
    ["Mali", "Mali"],
    ["Mauritania", "Mauritania"],
    ["Morocco", "Morocco"],
    ["Tunisia", "Tunisia"],
    ["Ethiopia", "Ethiopia"],
    ["Somalia", "Somalia"],
    ["Somaliland", "Somalia"],
    ["Kenya", "Kenya"],
    ["Tanzania", "Tanzania"],
    ["Madagascar", "Madagascar"],
    ["Botswana", "Botswana"],
    ["South Africa", "South Africa"],
    ["Namibia", "Namibia"],
    ["Zimbabwe", "Zimbabwe"],
    ["Zambia", "Zambia"],
    ["Angola", "Angola"],
    ["Mozambique", "Mozambique"],
    ["Central African Rep.", "Central African Republic"],
    ["Cameroon", "Cameroon"],
    ["Congo", "Congo"],
    ["Dem. Rep. Congo", "Congo (Democratic Republic Of The)"],
    ["Gabon", "Gabon"],
    ["Eq. Guinea", "Equatorial Guinea"],
    ["Burkina Faso", "Burkina Faso"],
    ["Ghana", "Ghana"],
    ["Togo", "Togo"],
    ["Benin", "Benin"],
    ["Nigeria", "Nigeria"],
    ["Côte d'Ivoire", "Côte D'Ivoire"],
    ["Guinea", "Guinea"],
    ["Senegal", "Senegal"],
    ["Liberia", "Liberia"],
    ["Sierra Leone", "Sierra Leone"],
    ["Guinea-Bissau", "Guinea Bissau"],
    ["Gambia", "Gambia"],
    ["Malawi", "Malawi"],
    ["Uganda", "Uganda"],
    ["Rwanda", "Rwanda"],
    ["Burundi", "Burundi"],
    ["Djibouti", "Djibouti"],
    ["Eritrea", "Eritrea"],
    ["Swaziland", "Swaziland"],
    ["Lesotho", "Lesotho"],
    ["Australia", "Australia"],
    ["New Zealand", "New Zealand"],
    ["Papua New Guinea", "Papua New Guinea"],
    ["Indonesia", "Indonesia"],
    ["Malaysia", "Malaysia"],
    ["Thailand", "Thailand"],
    ["Myanmar", "Burma"],
    ["Vietnam", "Vietnam"],
    ["Cambodia", "Cambodia"],
    ["Laos", "Laos"],
    ["Philippines", "Philippines"],
    ["Japan", "Japan"],
    ["South Korea", "South Korea"],
    ["North Korea", "North Korea"],
    ["Taiwan", "Taiwan"],
    ["Sri Lanka", "Sri Lanka"],
    ["Bangladesh", "Bangladesh"],
    ["Nepal", "Nepal"],
    ["Bhutan", "Bhutan"],
    ["Maldives", "Maldives"]
  ]);

  // Function to get normalized country name
  function getCountryName(topoName) {
    // Handle null/undefined input
    if (!topoName) {
      return null;
    }
    
    // First try direct mapping
    if (countryNameMap.has(topoName)) {
      return countryNameMap.get(topoName);
    }
    
    // Try some common variations
    const variations = [
      topoName,
      topoName.replace("The ", ""),
      topoName.replace(" of America", ""),
      topoName.replace("Republic of ", ""),
      topoName.replace("Democratic Republic of ", ""),
      topoName.replace("Islamic Republic of ", ""),
      topoName.replace("Kingdom of ", ""),
      topoName.replace("People's Republic of ", ""),
      topoName.replace("Federal Republic of ", "")
    ];
    
    for (const variation of variations) {
      if (baselineTemps.has(variation)) {
        return variation;
      }
    }
    
    return topoName; // Return original if no match found
  }

  // Function to calculate temperature delta
  function getTempDelta(countryName, year) {
    const baseline = baselineTemps.get(countryName);
    const current = tempByCountryYear.get(`${countryName}-${year}`);
    
    if (baseline !== undefined && current !== undefined) {
      return current - baseline;
    }
    return null; // Missing data
  }

  // Set up visualization area
  const viz = d3.select('#viz');
  let mapWrapper, slider, yearDisplay, selectedCountry = null;
  let currentYear = 1900;

  // Left and right captions content
  const leftCaptions = [
    {
      title: 'Interactive Global Warming Map',
      text: 'Explore temperature changes across the globe from 1900-2015. Click on any country to focus on its temperature trend.'
    },
    {
      title: 'Country Selection Mode',
      text: 'When a country is selected, the map highlights its temperature change while others fade. Use the timeline to see yearly variations.'
    }
  ];

  const rightCaptions = [
    {
      title: 'Temperature Patterns',
      text: 'Northern regions and land masses show more dramatic warming. Red indicates temperature increases, blue shows cooling.'
    },
    {
      title: 'Climate Insights',
      text: 'Arctic amplification and continental heating patterns become clear when exploring individual countries over time.'
    }
  ];

  // Helper to add narrative captions
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

  // Helper to animate captions
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

  // Create enhanced choropleth map with country selection
  function createMap() {
    console.log("Creating enhanced interactive map...");
    
    // Clear any existing map
    if (mapWrapper) {
      mapWrapper.selectAll('*').remove();
    } else {
      mapWrapper = viz.append('div')
        .attr('class', 'map-wrapper')
        .style('width', '100%')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center');
    }

    // Map dimensions
    const containerWidth = mapWrapper.node().clientWidth || 900;
    const width = Math.min(900, containerWidth - 40);
    const height = Math.min(500, width * 0.6);

    // Create SVG
    const svg = mapWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'map-svg')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)')
      .style('background', '#f8f9fa')
      .style('border-radius', '8px');

    // Set up projection and path
    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2]);
    
    const path = d3.geoPath().projection(projection);

    // Color scale for temperature deltas
    const allDeltas = [];
    for (const country of availableCountries) {
      for (const year of years.slice(0, 20)) { // Sample years for range
        const delta = getTempDelta(country, year);
        if (delta !== null) allDeltas.push(delta);
      }
    }
    
    const deltaExtent = d3.extent(allDeltas);
    const maxDelta = Math.max(Math.abs(deltaExtent[0] || 0), Math.abs(deltaExtent[1] || 0));
    const colorDomain = maxDelta > 0 ? [-maxDelta, maxDelta] : [-2, 2];
    
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([colorDomain[1], colorDomain[0]]); // Reversed for red=hot, blue=cold

    console.log("Color scale domain:", colorDomain);

    // Initialize unified tooltip system
    globalTooltip.init();

    // Render countries with enhanced interactivity
    function renderCountries(year) {
      currentYear = year;
      const countries = svg.selectAll('.country')
        .data(worldGeo.features);

      countries.enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .style('stroke', '#fff')
        .style('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .merge(countries)
        .transition()
        .duration(300)
        .style('fill', d => {
          const countryName = getCountryName(d.properties.name);
          if (countryName) {
            const delta = getTempDelta(countryName, year);
            if (delta !== null) {
              return colorScale(delta);
            }
          }
          return COLORS.neutral;
        })
        .style('opacity', d => {
          if (!selectedCountry) return 1;
          const countryName = getCountryName(d.properties.name);
          return countryName === selectedCountry ? 1 : 0.3;
        })
        .style('stroke-width', d => {
          if (!selectedCountry) return 0.5;
          const countryName = getCountryName(d.properties.name);
          return countryName === selectedCountry ? 2 : 0.5;
        })
        .style('stroke', d => {
          if (!selectedCountry) return '#fff';
          const countryName = getCountryName(d.properties.name);
          return countryName === selectedCountry ? COLORS.selected : '#fff';
        });

      // Enhanced interactivity
      countries
        .on('mouseover', function(event, d) {
          const countryName = getCountryName(d.properties.name);
          const delta = countryName ? getTempDelta(countryName, year) : null;
          
          // Highlight on hover
          if (!selectedCountry || countryName === selectedCountry) {
            d3.select(this)
              .style('stroke-width', 2)
              .style('stroke', COLORS.highlight);
          }
          
          // Enhanced tooltip using unified system
          const hasData = delta !== null;
          let content;
          
          if (hasData) {
            content = UnifiedTooltip.formatCountryData(d.properties.name, year, delta, true);
            if (!selectedCountry) {
              content += '<div style="font-size: 11px; opacity: 0.8; margin-top: 6px;">Click to select this country</div>';
            }
          } else {
            content = UnifiedTooltip.formatCountryData(d.properties.name, year, 0, false);
          }
          
          globalTooltip.show(content, event, { className: 'country-tooltip' });
        })
        .on('mousemove', function(event) {
          globalTooltip.updatePosition(event);
        })
        .on('mouseout', function() {
          globalTooltip.hide();
          
          // Reset hover styling
          if (!selectedCountry) {
            d3.select(this)
              .style('stroke-width', 0.5)
              .style('stroke', '#fff');
          } else {
            const countryName = getCountryName(d3.select(this).datum().properties.name);
            d3.select(this)
              .style('stroke-width', countryName === selectedCountry ? 2 : 0.5)
              .style('stroke', countryName === selectedCountry ? COLORS.selected : '#fff');
          }
        })
        .on('click', function(event, d) {
          const countryName = getCountryName(d.properties.name);
          
          if (countryName && baselineTemps.has(countryName)) {
            // Toggle selection
            if (selectedCountry === countryName) {
              selectedCountry = null;
              updateCountryInfo(null);
            } else {
              selectedCountry = countryName;
              updateCountryInfo(countryName);
            }
            
            // Re-render to update opacity and styling
            renderCountries(currentYear);
            updateSelectionButton();
          }
        });
    }

    return { svg, renderCountries, colorScale, colorDomain };
  }

  // Create enhanced legend
  function createLegend(colorScale, colorDomain) {
    const legendContainer = mapWrapper.append('div')
      .attr('class', 'enhanced-legend')
      .style('margin-top', '24px')
      .style('padding', '16px 20px')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('border-radius', '8px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('gap', '12px')
      .style('font-size', '13px')
      .style('opacity', '0');

    // Legend gradient
    const legendSvg = legendContainer.append('svg')
      .attr('width', 220)
      .attr('height', 30);

    const gradient = legendSvg.append('defs')
      .append('linearGradient')
      .attr('id', 'enhanced-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    // Create gradient stops
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const value = colorDomain[1] - ((colorDomain[1] - colorDomain[0]) * i / steps);
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    legendSvg.append('rect')
      .attr('width', 200)
      .attr('height', 12)
      .attr('x', 10)
      .attr('y', 9)
      .style('fill', 'url(#enhanced-legend-gradient)')
      .style('stroke', '#ddd')
      .style('stroke-width', 1)
      .style('rx', 2);

    // Legend labels
    legendContainer.append('span')
      .style('color', COLORS.secondary)
      .style('font-weight', '500')
      .text(`${colorDomain[0].toFixed(1)}°C`);
    
    legendContainer.append('span')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .text('Temperature Change (vs 1900)')
      .style('margin', '0 8px');
    
    legendContainer.append('span')
      .style('color', COLORS.primary)
      .style('font-weight', '500')
      .text(`+${colorDomain[1].toFixed(1)}°C`);

    return legendContainer;
  }

  // Create enhanced controls
  function createControls() {
    const controlsContainer = mapWrapper.append('div')
      .attr('class', 'enhanced-controls')
      .style('margin-top', '24px')
      .style('padding', '20px')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('border-radius', '12px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '16px')
      .style('max-width', '500px')
      .style('opacity', '0');

    // Year display with enhanced styling
    yearDisplay = controlsContainer.append('div')
      .attr('class', 'year-display')
      .style('font-size', '32px')
      .style('font-weight', '700')
      .style('color', COLORS.text)
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('-webkit-background-clip', 'text')
      .style('-webkit-text-fill-color', 'transparent')
      .style('background-clip', 'text')
      .text('1900');

    // Slider container with enhanced design
    const sliderContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '16px')
      .style('width', '100%')
      .style('max-width', '420px');

    sliderContainer.append('span')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('color', COLORS.text)
      .text('1900');

    // Enhanced slider
    slider = sliderContainer.append('input')
      .attr('type', 'range')
      .attr('min', 1900)
      .attr('max', 2015)
      .attr('value', 1900)
      .attr('class', 'enhanced-year-slider')
      .style('flex', '1')
      .style('margin', '0 8px')
      .style('height', '6px')
      .style('border-radius', '3px')
      .style('background', '#e9ecef')
      .style('outline', 'none')
      .style('cursor', 'pointer');

    sliderContainer.append('span')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('color', COLORS.text)
      .text('2015');

    // Country selection info and clear button
    const selectionContainer = controlsContainer.append('div')
      .attr('class', 'selection-container')
      .style('display', 'none')
      .style('padding', '12px 16px')
      .style('background', 'rgba(244, 162, 97, 0.1)')
      .style('border', '1px solid rgba(244, 162, 97, 0.3)')
      .style('border-radius', '8px')
      .style('width', '100%')
      .style('max-width', '400px');

    const selectionInfo = selectionContainer.append('div')
      .attr('class', 'selection-info')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center');

    selectionInfo.append('span')
      .attr('class', 'selected-country-name')
      .style('font-weight', '600')
      .style('color', COLORS.text);

    selectionInfo.append('button')
      .attr('class', 'clear-selection-btn')
      .style('background', COLORS.primary)
      .style('color', 'white')
      .style('border', 'none')
      .style('padding', '6px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('cursor', 'pointer')
      .style('font-weight', '500')
      .text('Clear Selection')
      .on('click', function() {
        selectedCountry = null;
        updateCountryInfo(null);
        mapInstance.renderCountries(currentYear);
        updateSelectionButton();
      });

    return controlsContainer;
  }

  // Function to update country selection info
  function updateCountryInfo(countryName) {
    const selectionContainer = d3.select('.selection-container');
    const selectedCountryName = d3.select('.selected-country-name');
    
    if (countryName) {
      const delta = getTempDelta(countryName, currentYear);
      selectedCountryName.text(`${countryName} - ${delta !== null ? 
        (delta >= 0 ? '+' : '') + delta.toFixed(2) + '°C' : 'No data'}`);
      selectionContainer.style('display', 'block');
    } else {
      selectionContainer.style('display', 'none');
    }
  }

  // Function to update selection button state
  function updateSelectionButton() {
    // This function can be used to update any global selection indicators
  }

  // Store map instance for replay
  let mapInstance;

  // Animation functions
  let isReplaying = false;

  async function replayAnimation() {
    if (isReplaying || !mapInstance) return;
    isReplaying = true;

    const globalReplayButton = d3.select("#replay-button");
    globalReplayButton.style('opacity', '0.5').attr('disabled', true);

    for (let year of years) {
      if (!isReplaying) break;
      
      slider.property('value', year);
      yearDisplay.text(year);
      mapInstance.renderCountries(year);
      updateCountryInfo(selectedCountry);
      
      await new Promise(resolve => setTimeout(resolve, 60));
    }

    isReplaying = false;
    globalReplayButton.style('opacity', '1').attr('disabled', null);
  }

  // Main animation sequence
  async function animateScene() {
    console.log("Starting enhanced Scene 3 animation...");

    try {
      // Clear existing content
      viz.html('');
      d3.select('.caption-left').html('');
      d3.select('.caption-right').html('');

      // Hide replay button initially
      const globalReplayButton = d3.select("#replay-button")
        .style("opacity", "0")
        .style("transform", "scale(0)");

      // Add captions
      addCaptions();

      // Validate data before creating map
      if (!worldGeo || !worldGeo.features || worldGeo.features.length === 0) {
        throw new Error("World geography data is not available");
      }

      if (!tempData || tempData.length === 0) {
        throw new Error("Temperature data is not available");
      }

      // Create enhanced map and controls
      mapInstance = createMap();
      const legend = createLegend(mapInstance.colorScale, mapInstance.colorDomain);
      const controls = createControls();

      // Set up enhanced slider interaction
      slider.on('input', function() {
        const year = +this.value;
        yearDisplay.text(year);
        mapInstance.renderCountries(year);
        updateCountryInfo(selectedCountry);
      });

      // Initial render
      mapInstance.renderCountries(1900);

      // Animation sequence
      await new Promise(resolve => setTimeout(resolve, 500));

      // Animate map
      mapInstance.svg
        .transition()
        .duration(800)
        .style('opacity', '1')
        .style('transform', 'translateY(0)');

      await new Promise(resolve => setTimeout(resolve, 300));

      // Animate legend
      legend
        .transition()
        .duration(500)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 300));

      // Animate controls
      controls
        .transition()
        .duration(500)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 500));

      // Animate captions
      animateCaptions();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show replay button
      globalReplayButton
        .style("display", "flex")
        .transition()
        .duration(300)
        .style("opacity", "1")
        .style("transform", "scale(1)");

    } catch (error) {
      console.error("Error in enhanced Scene 3 animation:", error);
      // Show error message to user
      viz.html(`
        <div style="text-align: center; padding: 50px; color: #e63946;">
          <h3>Unable to Load Scene 3</h3>
          <p>There was an error loading the climate data visualization.</p>
          <p style="font-size: 12px; color: #666;">Check the browser console for technical details.</p>
        </div>
      `);
    }
  }

  // Set up replay button click handler
  d3.select("#replay-button").on("click", replayAnimation);

  // Start the animation
  animateScene();
}
