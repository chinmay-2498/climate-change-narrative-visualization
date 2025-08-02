import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { globalTooltip, UnifiedTooltip } from '../d3-components/tooltip.js';

export async function initScene3() {
  // Color palette and constants - CONSISTENT WITH PROJECT THEME
  const COLORS = {
    primary: "#e63946",   // red - matches project theme
    secondary: "#457b9d", // blue - matches project theme
    accent: "#2a9d8f",    // green accent
    text: "#1d3557",      // dark blue - matches project theme
    neutral: "#ddd",      // light gray for missing data
    selected: "#e63946",  // red for selected country (consistent)
    highlight: "#457b9d", // blue for hover (consistent)
    background: "#f8f9fa", // matches project background
    white: "#fff"         // white backgrounds
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
  let mapWrapper, slider, yearDisplay, yearInput, selectedCountry = null;
  let currentYear = 1900;

  // Martini Glass Bowl Design - Interactive World Map
  // Clean, spacious layout with optimal space utilization

  // Create enhanced choropleth map with country selection - Bowl design
  function createMap() {
    console.log("Creating enhanced interactive map...");
    
    // Clear any existing map and completely reset the layout for Scene 3
    viz.html('');
    
    // Clear caption containers that exist outside the viz container (from Scene 2)
    d3.select('.caption-left').html('');
    d3.select('.caption-right').html('');
    
    // IMPORTANT: Override the grid layout for Scene 3 by setting the viz container to full width
    // This bypasses the constrained grid layout from main.css
    viz.style('position', 'absolute')
       .style('top', '160px') // Below navigation
       .style('left', '0')
       .style('right', '0')
       .style('bottom', '60px') // Above footer
       .style('width', '100vw')
       .style('height', 'calc(100vh - 220px)')
       .style('z-index', '10')
       .style('background', COLORS.background); // Use consistent background

    // Create main container with full-screen bowl layout
    const mainContainer = viz.append('div')
      .attr('class', 'scene3-fullscreen-container')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'stretch')
      .style('justify-content', 'space-between')
      .style('gap', '30px')
      .style('padding', '30px');

    // Left sidebar for legend - consistent sizing
    const leftSidebar = mainContainer.append('div')
      .attr('class', 'legend-sidebar')
      .style('width', '280px') // Match controls width
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center');

    // Central map area - maximized for full-screen martini glass bowl design
    mapWrapper = mainContainer.append('div')
      .attr('class', 'map-wrapper')
      .style('flex', '1')
      .style('min-width', '900px')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.background} 100%)`)
      .style('border-radius', '24px')
      .style('box-shadow', '0 12px 40px rgba(29, 53, 87, 0.12)') // Use consistent text color for shadow
      .style('backdrop-filter', 'blur(25px)')
      .style('border', `2px solid ${COLORS.white}`);

    // Enhanced right sidebar for controls with consistent sizing
    const rightSidebar = mainContainer.append('div')
      .attr('class', 'controls-sidebar')
      .style('width', '280px') // Match legend width
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('padding', '0 15px');

    // Enhanced map dimensions - maximize the available space for better visual impact
    const containerWidth = mapWrapper.node().clientWidth || 1400;
    const width = Math.min(1400, containerWidth * 0.98);
    const height = Math.min(900, width * 0.65);

    // Create enhanced SVG with improved styling for full-screen layout
    const svg = mapWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'map-svg')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.background} 100%)`)
      .style('border-radius', '16px')
      .style('box-shadow', '0 10px 30px rgba(29, 53, 87, 0.1)'); // Consistent with text color

    // Set up enhanced projection for optimal visual impact on maximized screen space
    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.5)
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
        .style('stroke', COLORS.white)
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
          if (!selectedCountry) return COLORS.white;
          const countryName = getCountryName(d.properties.name);
          return countryName === selectedCountry ? COLORS.primary : COLORS.white; // Red for selected
        });

      // Enhanced interactivity
      countries
        .on('mouseover', function(event, d) {
          const countryName = getCountryName(d.properties.name);
          const delta = countryName ? getTempDelta(countryName, year) : null;
          
          // Highlight on hover with consistent colors
          if (!selectedCountry || countryName === selectedCountry) {
            d3.select(this)
              .style('stroke-width', 2)
              .style('stroke', COLORS.secondary); // Blue hover - consistent with nav
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
          
          // Reset hover styling with consistent colors
          if (!selectedCountry) {
            d3.select(this)
              .style('stroke-width', 0.5)
              .style('stroke', COLORS.white);
          } else {
            const countryName = getCountryName(d3.select(this).datum().properties.name);
            d3.select(this)
              .style('stroke-width', countryName === selectedCountry ? 2 : 0.5)
              .style('stroke', countryName === selectedCountry ? COLORS.primary : COLORS.white);
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

  // Create enhanced vertical legend for left sidebar - CONSISTENT SIZING
  function createLegend(colorScale, colorDomain, container) {
    const legendContainer = container.append('div')
      .attr('class', 'vertical-legend')
      .style('background', COLORS.white) // Clean white background like project cards
      .style('border-radius', '8px') // Consistent with nav buttons
      .style('padding', '20px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.08)') // Consistent with narrative captions
      .style('border-left', `4px solid ${COLORS.primary}`) // Red accent like captions
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '15px')
      .style('opacity', '0')
      .style('width', '260px') // Match controls width minus padding
      .style('height', '520px'); // Consistent height with controls

    // Consistent title styling with project theme
    legendContainer.append('div')
      .style('font-weight', '600') // Consistent with page title
      .style('color', COLORS.text)
      .style('font-size', '16px')
      .style('text-align', 'center')
      .style('margin-bottom', '4px')
      .text('Temperature Change');

    legendContainer.append('div')
      .style('font-size', '12px')
      .style('color', COLORS.secondary) // Blue secondary color
      .style('text-align', 'center')
      .style('font-weight', '400')
      .style('opacity', '0.9')
      .text('(vs 1900 baseline)');

    // Create enhanced vertical gradient with larger dimensions
    const legendSvg = legendContainer.append('svg')
      .attr('width', 50)
      .attr('height', 300) // Larger for better visual impact
      .style('margin', '15px 0');

    const defs = legendSvg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'vertical-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const value = colorDomain[1] - ((colorDomain[1] - colorDomain[0]) * i / steps);
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    legendSvg.append('rect')
      .attr('width', 35) // Larger width
      .attr('height', 270) // Larger height
      .attr('x', 8)
      .attr('y', 15)
      .style('fill', 'url(#vertical-legend-gradient)')
      .style('stroke', 'rgba(29, 53, 87, 0.2)') // Use consistent text color
      .style('stroke-width', 1)
      .style('rx', 6); // Slightly larger radius

    // Legend labels with consistent typography
    const labelsContainer = legendContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '8px')
      .style('align-items', 'center');

    labelsContainer.append('div')
      .style('color', COLORS.primary) // Red for hot
      .style('font-weight', '600')
      .style('font-size', '14px')
      .text(`+${colorDomain[1].toFixed(1)}°C`);
    
    labelsContainer.append('div')
      .style('color', COLORS.text)
      .style('font-size', '12px')
      .style('font-weight', '400')
      .text('0°C');
    
    labelsContainer.append('div')
      .style('color', COLORS.secondary) // Blue for cold
      .style('font-weight', '600')
      .style('font-size', '14px')
      .text(`${colorDomain[0].toFixed(1)}°C`);

    return legendContainer;
  }

  // Create enhanced vertical controls for right sidebar - EXPERT UI/UX DESIGN
  function createControls(container) {
    const controlsContainer = container.append('div')
      .attr('class', 'vertical-controls')
      .style('background', COLORS.white) // Clean white background like project cards
      .style('border-radius', '12px') // Slightly larger radius for modern look
      .style('padding', '24px 20px') // Optimized padding for better space usage
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.08)') // Enhanced shadow for depth
      .style('border-left', `4px solid ${COLORS.primary}`) // Red accent like captions
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '16px') // Tighter gaps for better fit
      .style('opacity', '0')
      .style('width', '260px') // Match legend width minus padding
      .style('height', '520px') // Consistent height with legend
      .style('box-sizing', 'border-box') // Ensure padding is included in height
      .style('overflow', 'hidden'); // Prevent any overflow

    // Compact year display with modern styling
    yearDisplay = controlsContainer.append('div')
      .attr('class', 'year-display')
      .style('font-size', '24px') // Smaller but still prominent
      .style('font-weight', '700') // Bold as requested
      .style('color', COLORS.primary) // Use primary color for emphasis
      .style('text-align', 'center')
      .style('margin-bottom', '2px')
      .style('letter-spacing', '1px') // Modern letter spacing
      .style('text-shadow', '0 1px 2px rgba(230, 57, 70, 0.1)') // Subtle shadow
      .text('1900');

    // Compact title with modern typography hierarchy
    controlsContainer.append('div')
      .style('font-size', '13px') // Smaller for space efficiency
      .style('font-weight', '500') // Medium weight
      .style('color', COLORS.secondary) // Secondary color for hierarchy
      .style('text-align', 'center')
      .style('margin-bottom', '8px')
      .style('text-transform', 'uppercase') // Modern touch
      .style('letter-spacing', '0.5px')
      .text('Timeline');

    // Optimized vertical slider container - space-efficient design
    const sliderContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '10px') // Tighter gaps
      .style('height', '220px') // Reduced height to fit everything
      .style('justify-content', 'space-between')
      .style('margin', '8px 0'); // Controlled margins

    // Compact year labels with modern styling
    sliderContainer.append('span')
      .style('font-size', '11px') // Smaller for space efficiency
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('letter-spacing', '0.5px')
      .text('2015');

    // Add custom CSS for the optimized vertical slider
    const style = document.createElement('style');
    style.textContent = `
      .vertical-slider {
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(to top, ${COLORS.secondary}, ${COLORS.primary});
        outline: none;
        border-radius: 12px;
        border: 2px solid ${COLORS.white};
        box-shadow: 0 3px 10px rgba(29, 53, 87, 0.15);
        transition: all 0.3s ease;
      }
      
      .vertical-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${COLORS.primary};
        border: 3px solid ${COLORS.white};
        cursor: pointer;
        box-shadow: 0 3px 12px rgba(230, 57, 70, 0.3);
        transition: all 0.2s ease;
      }
      
      .vertical-slider::-webkit-slider-thumb:hover {
        background: ${COLORS.secondary};
        transform: scale(1.15);
        box-shadow: 0 4px 16px rgba(69, 123, 157, 0.4);
      }
      
      .vertical-slider::-moz-range-thumb {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${COLORS.primary};
        border: 3px solid ${COLORS.white};
        cursor: pointer;
        box-shadow: 0 3px 12px rgba(230, 57, 70, 0.3);
        transition: all 0.2s ease;
        -moz-appearance: none;
      }
      
      .vertical-slider::-moz-range-thumb:hover {
        background: ${COLORS.secondary};
        transform: scale(1.15);
        box-shadow: 0 4px 16px rgba(69, 123, 157, 0.4);
      }
      
      .vertical-slider::-moz-range-track {
        background: linear-gradient(to top, ${COLORS.secondary}, ${COLORS.primary});
        border-radius: 12px;
        border: none;
      }
      
      .year-input::-webkit-outer-spin-button,
      .year-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      
      .year-input[type=number] {
        -moz-appearance: textfield;
      }
      
      .quick-nav-btn {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(0);
      }
      
      .quick-nav-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(69, 123, 157, 0.2);
      }
    `;
    document.head.appendChild(style);

    // Optimized large vertical slider - excellent UX with space-efficient design
    slider = sliderContainer.append('input')
      .attr('type', 'range')
      .attr('min', 1900)
      .attr('max', 2015)
      .attr('value', 1900)
      .attr('class', 'vertical-slider')
      .attr('orient', 'vertical') // Proper vertical orientation
      .style('writing-mode', 'bt-lr') // Vertical text flow
      .style('-webkit-appearance', 'slider-vertical') // WebKit vertical
      .style('width', '25px') // Optimized width for vertical slider
      .style('height', '180px') // Large but fits in container
      .style('outline', 'none')
      .style('opacity', '0.9')
      .style('transition', 'all 0.3s ease')
      .style('cursor', 'pointer')
      .on('input', function() {
        const year = +this.value;
        currentYear = year;
        yearDisplay.text(year);
        if (yearInput) {
          yearInput.property('value', year); // Update text input
        }
        if (mapInstance) {
          mapInstance.renderCountries(year);
        }
        updateCountryInfo(selectedCountry);
      })
      .on('mouseover', function() {
        d3.select(this)
          .style('opacity', '1')
          .style('transform', 'scale(1.03)'); // Subtle hover effect
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', '0.9')
          .style('transform', 'scale(1)');
      });

    sliderContainer.append('span')
      .style('font-size', '11px') // Compact styling
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('letter-spacing', '0.5px')
      .text('1900');

    // Compact manual year input section - space-efficient design
    const inputContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '6px') // Tighter gaps
      .style('margin-top', '0') // No extra margin
      .style('width', '100%');

    inputContainer.append('label')
      .style('font-size', '11px') // Smaller font
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('text-align', 'center')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Manual Entry');

    // Compact helpful hint text
    inputContainer.append('div')
      .style('font-size', '9px') // Very small but readable
      .style('color', COLORS.secondary)
      .style('text-align', 'center')
      .style('margin-bottom', '4px')
      .style('opacity', '0.7')
      .style('line-height', '1.2')
      .text('(1900-2015)');

    // Compact year input with modern design
    yearInput = inputContainer.append('input')
      .attr('type', 'number')
      .attr('min', 1900)
      .attr('max', 2015)
      .attr('value', 1900)
      .attr('step', 1)
      .attr('class', 'year-input')
      .style('width', '80px') // Compact but usable
      .style('padding', '8px 6px') // Optimized padding
      .style('border', `2px solid ${COLORS.secondary}`)
      .style('border-radius', '6px')
      .style('text-align', 'center')
      .style('font-size', '14px') // Good readability
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('background', COLORS.white)
      .style('outline', 'none')
      .style('transition', 'all 0.2s ease')
      .on('input', function() {
        const year = +this.value;
        
        // Allow any input while typing, only validate when complete
        if (!isNaN(year) && year >= 1900 && year <= 2015) {
          currentYear = year;
          yearDisplay.text(year);
          if (slider) {
            slider.property('value', year); // Update slider
          }
          if (mapInstance) {
            mapInstance.renderCountries(year);
          }
          updateCountryInfo(selectedCountry);
        }
      })
      .on('keydown', function(event) {
        // Allow backspace, delete, tab, escape, enter, and arrow keys
        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(event.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (event.keyCode === 65 && event.ctrlKey === true) ||
            (event.keyCode === 67 && event.ctrlKey === true) ||
            (event.keyCode === 86 && event.ctrlKey === true) ||
            (event.keyCode === 88 && event.ctrlKey === true)) {
          return;
        }
        // Ensure that it's a number and stop the keypress
        if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
          event.preventDefault();
        }
      })
      .on('focus', function() {
        d3.select(this)
          .style('border-color', COLORS.primary)
          .style('box-shadow', `0 0 0 2px rgba(230, 57, 70, 0.1)`)
          .node().select(); // Select all text for easy replacement
      })
      .on('blur', function() {
        d3.select(this)
          .style('border-color', COLORS.secondary)
          .style('box-shadow', 'none');
        
        // Only validate and correct on blur - less intrusive
        let year = +this.value;
        if (isNaN(year) || year < 1900) {
          year = 1900;
        } else if (year > 2015) {
          year = 2015;
        }
        
        // Update to corrected value
        this.value = year;
        currentYear = year;
        yearDisplay.text(year);
        if (slider) {
          slider.property('value', year);
        }
        if (mapInstance) {
          mapInstance.renderCountries(year);
        }
        updateCountryInfo(selectedCountry);
      });

    // Compact quick navigation section with modern design
    const quickNavContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '6px') // Tight gaps
      .style('margin-top', '8px') // Minimal margin
      .style('width', '100%');

    quickNavContainer.append('div')
      .style('font-size', '10px') // Very compact
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('text-align', 'center')
      .style('margin-bottom', '2px')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Quick Nav');

    const buttonRow = quickNavContainer.append('div')
      .style('display', 'flex')
      .style('gap', '4px') // Tight button spacing
      .style('justify-content', 'center')
      .style('flex-wrap', 'wrap');

    // Compact quick navigation buttons for key years
    const quickYears = [1900, 1950, 1980, 2000, 2015];
    
    quickYears.forEach(year => {
      buttonRow.append('button')
        .attr('class', 'quick-nav-btn')
        .style('background', COLORS.white)
        .style('color', COLORS.secondary)
        .style('border', `1px solid ${COLORS.secondary}`)
        .style('padding', '3px 6px') // Very compact
        .style('border-radius', '4px')
        .style('font-size', '9px') // Small but readable
        .style('cursor', 'pointer')
        .style('font-weight', '500')
        .style('transition', 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)')
        .style('min-width', '28px') // Ensure consistent button sizes
        .text(year)
        .on('click', function() {
          currentYear = year;
          yearDisplay.text(year);
          if (slider) {
            slider.property('value', year);
          }
          if (yearInput) {
            yearInput.property('value', year);
          }
          if (mapInstance) {
            mapInstance.renderCountries(year);
          }
          updateCountryInfo(selectedCountry);
          
          // Visual feedback
          d3.select(this)
            .style('background', COLORS.primary)
            .style('color', COLORS.white)
            .transition()
            .duration(200)
            .style('background', COLORS.white)
            .style('color', COLORS.secondary);
        })
        .on('mouseover', function() {
          d3.select(this)
            .style('background', COLORS.secondary)
            .style('color', COLORS.white)
            .style('transform', 'translateY(-1px)')
            .style('box-shadow', '0 2px 8px rgba(69, 123, 157, 0.2)');
        })
        .on('mouseout', function() {
          d3.select(this)
            .style('background', COLORS.white)
            .style('color', COLORS.secondary)
            .style('transform', 'translateY(0)')
            .style('box-shadow', 'none');
        });
    });

    // Compact country info display with modern design - fits perfectly
    const countryInfoContainer = controlsContainer.append('div')
      .attr('class', 'country-info-container')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, rgba(248, 249, 250, 0.8) 100%)`) // Subtle gradient
      .style('border-radius', '8px') // Modern radius
      .style('padding', '12px 16px') // Compact padding
      .style('border-left', `3px solid ${COLORS.primary}`) // Slightly thinner accent
      .style('display', 'none')
      .style('text-align', 'center')
      .style('width', '100%')
      .style('box-shadow', '0 2px 12px rgba(0,0,0,0.08)') // Softer shadow
      .style('color', '#333') // Consistent text color with captions
      .style('margin-top', '8px') // Minimal spacing
      .style('border', `1px solid rgba(230, 57, 70, 0.1)`) // Subtle border
      .style('backdrop-filter', 'blur(10px)') // Modern glass effect
      .style('box-sizing', 'border-box'); // Prevent overflow

    countryInfoContainer.append('div')
      .attr('class', 'selected-country-name')
      .style('font-weight', '700') // Bold for emphasis
      .style('color', COLORS.text) // Project text color
      .style('font-size', '13px') // Compact but readable
      .style('margin-bottom', '4px')
      .style('line-height', '1.3') // Tight line height
      .style('letter-spacing', '0.3px'); // Modern touch

    countryInfoContainer.append('div')
      .attr('class', 'selected-country-temp')
      .style('color', COLORS.primary) // Red for temperature
      .style('font-size', '12px') // Compact
      .style('font-weight', '600')
      .style('line-height', '1.3')
      .style('margin-bottom', '6px');

    // Compact clear selection button with modern design
    countryInfoContainer.append('button')
      .attr('class', 'clear-selection-btn')
      .style('background', COLORS.white) // White background like nav buttons
      .style('color', COLORS.secondary) // Blue text like nav buttons
      .style('border', `1px solid ${COLORS.secondary}`) // Thinner border
      .style('padding', '4px 8px') // Very compact
      .style('border-radius', '4px') // Small radius
      .style('font-size', '10px') // Small but readable
      .style('cursor', 'pointer')
      .style('font-weight', '500') // Medium weight
      .style('margin-top', '6px') // Minimal margin
      .style('transition', 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)') // Modern easing
      .style('text-transform', 'uppercase') // Modern touch
      .style('letter-spacing', '0.5px')
      .text('Clear')
      .on('click', function() {
        selectedCountry = null;
        updateCountryInfo(null);
        mapInstance.renderCountries(currentYear);
        updateSelectionButton();
      })
      .on('mouseover', function() {
        d3.select(this)
          .style('background', COLORS.secondary) // Blue background on hover
          .style('color', COLORS.white)
          .style('transform', 'translateY(-1px)')
          .style('box-shadow', '0 2px 8px rgba(69, 123, 157, 0.2)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background', COLORS.white)
          .style('color', COLORS.secondary)
          .style('transform', 'translateY(0)')
          .style('box-shadow', 'none');
      });

    return controlsContainer;
  }

  // Function to update country selection info
  function updateCountryInfo(countryName) {
    const countryInfoContainer = d3.select('.country-info-container');
    const selectedCountryName = d3.select('.selected-country-name');
    const selectedCountryTemp = d3.select('.selected-country-temp');
    
    if (countryName) {
      const delta = getTempDelta(countryName, currentYear);
      selectedCountryName.text(countryName);
      selectedCountryTemp.text(delta !== null ? 
        (delta >= 0 ? '+' : '') + delta.toFixed(2) + '°C change' : 'No temperature data');
      countryInfoContainer.style('display', 'block');
    } else {
      countryInfoContainer.style('display', 'none');
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

  // Enhanced replay animation with smooth progression
  async function replayAnimation() {
    if (isReplaying || !mapInstance) return;
    isReplaying = true;

    const globalReplayButton = d3.select("#replay-button");
    globalReplayButton
      .style('opacity', '0.6')
      .style('transform', 'scale(0.95)')
      .attr('disabled', true);

    // Add visual feedback during replay
    const totalYears = years.length;
    
    for (let i = 0; i < years.length; i++) {
      if (!isReplaying) break;
      
      const year = years[i];
      slider.property('value', year);
      yearDisplay
        .text(year)
        .transition()
        .duration(50)
        .style('transform', 'scale(1.05)')
        .transition()
        .duration(50)
        .style('transform', 'scale(1)');
      
      mapInstance.renderCountries(year);
      updateCountryInfo(selectedCountry);
      
      // Variable speed: slower for recent years to show detail
      const delay = year > 1980 ? 80 : 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    isReplaying = false;
    globalReplayButton
      .style('opacity', '1')
      .style('transform', 'scale(1)')
      .attr('disabled', null);
  }

  // Main animation sequence - Enhanced Bowl Design
  async function animateScene() {
    console.log("Starting enhanced Scene 3 bowl design animation...");

    try {
      // Clear existing content for clean bowl design
      viz.html('');

      // Hide replay button initially
      const globalReplayButton = d3.select("#replay-button")
        .style("opacity", "0")
        .style("transform", "scale(0)");

      // Validate data before creating map
      if (!worldGeo || !worldGeo.features || worldGeo.features.length === 0) {
        throw new Error("World geography data is not available");
      }

      if (!tempData || tempData.length === 0) {
        throw new Error("Temperature data is not available");
      }

      // Create enhanced map with optimized bowl layout
      mapInstance = createMap();
      
      // Get sidebar containers from the main container
      const leftSidebar = d3.select('.legend-sidebar');
      const rightSidebar = d3.select('.controls-sidebar');
      
      // Create enhanced legend and controls in their respective sidebars
      const legend = createLegend(mapInstance.colorScale, mapInstance.colorDomain, leftSidebar);
      const controls = createControls(rightSidebar);

      // Set up enhanced slider interaction with smooth updates
      slider.on('input', function() {
        const year = +this.value;
        currentYear = year;
        yearDisplay.text(year);
        mapInstance.renderCountries(year);
        updateCountryInfo(selectedCountry);
      });

      // Initial render with baseline year
      mapInstance.renderCountries(1900);

      // Enhanced animation sequence - Bowl design appearance
      await new Promise(resolve => setTimeout(resolve, 600));

      // Animate map with enhanced easing
      mapInstance.svg
        .transition()
        .duration(1000)
        .ease(d3.easeBackOut.overshoot(1.2))
        .style('opacity', '1')
        .style('transform', 'translateY(0)');

      await new Promise(resolve => setTimeout(resolve, 400));

      // Animate legend with smooth entrance
      legend
        .transition()
        .duration(600)
        .ease(d3.easeBackOut)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 400));

      // Animate controls with smooth entrance
      controls
        .transition()
        .duration(600)
        .ease(d3.easeBackOut)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 800));

      // Show replay button with bounce effect
      globalReplayButton
        .style("display", "flex")
        .transition()
        .duration(400)
        .ease(d3.easeBackOut.overshoot(1.3))
        .style("opacity", "1")
        .style("transform", "scale(1)");

    } catch (error) {
      console.error("Error in enhanced Scene 3 bowl design:", error);
      // Show user-friendly error message
      viz.html(`
        <div style="text-align: center; padding: 60px; color: #e63946; background: rgba(248,249,250,0.9); border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
          <h3 style="font-size: 24px; margin-bottom: 15px;">Unable to Load Interactive Map</h3>
          <p style="font-size: 16px; margin-bottom: 10px;">There was an error loading the climate data visualization.</p>
          <p style="font-size: 13px; color: #666; font-style: italic;">Check the browser console for technical details.</p>
        </div>
      `);
    }
  }

  // Set up replay button click handler
  d3.select("#replay-button").on("click", replayAnimation);

  // Start the animation
  animateScene();
}
