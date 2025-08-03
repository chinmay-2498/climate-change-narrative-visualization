import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { globalTooltip, UnifiedTooltip } from '../d3-components/tooltip.js';

export async function initScene3() {
  const COLORS = {
    primary: "#e63946",
    secondary: "#457b9d",
    accent: "#2a9d8f",
    text: "#1d3557",
    neutral: "#ddd",
    selected: "#e63946",
    highlight: "#457b9d",
    background: "#f8f9fa",
    white: "#fff"
  };

  // Load data and geography
  console.log("Loading Scene 3 data...");
  let tempData = [], world = null, worldGeo = null;

  try {
    const [tempRaw, worldData] = await Promise.all([
      d3.csv('public/assets/data/country_annual_temp.csv', d3.autoType),
      d3.json('public/assets/data/countries-110m.json')
    ]);

    tempData = tempRaw;
    world = worldData;
    
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
    try {
      const [tempRaw, worldData] = await Promise.all([
        d3.csv('assets/data/country_annual_temp.csv', d3.autoType),
        d3.json('assets/data/countries-110m.json')
      ]);
      tempData = tempRaw;
      world = worldData;
      
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
  const years = d3.range(1900, 2016);
  const baseYear = 1900;
  
  const tempByCountryYear = new Map();
  tempData.forEach(d => {
    const key = `${d.Country}-${d.Year}`;
    tempByCountryYear.set(key, d.AvgTemp);
  });

  const baselineTemps = new Map();
  const availableCountries = new Set();
  
  tempData.filter(d => d.Year === baseYear).forEach(d => {
    if (d.AvgTemp !== null && d.AvgTemp !== undefined && !isNaN(d.AvgTemp)) {
      baselineTemps.set(d.Country, d.AvgTemp);
      availableCountries.add(d.Country);
    }
  });

  console.log("Countries with baseline data:", availableCountries.size);

  // Country name mapping
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

  function getCountryName(topoName) {
    if (!topoName) {
      return null;
    }
    
    if (countryNameMap.has(topoName)) {
      return countryNameMap.get(topoName);
    }
    
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
    
    return topoName;
  }

  function getTempDelta(countryName, year) {
    const baseline = baselineTemps.get(countryName);
    const current = tempByCountryYear.get(`${countryName}-${year}`);
    
    if (baseline !== undefined && current !== undefined) {
      return current - baseline;
    }
    return null;
  }

  const viz = d3.select('#viz');
  let mapWrapper, slider, yearDisplay, yearInput, selectedCountry = null;
  let currentYear = 1900;

  // Main map creation function
  function createMap() {
    console.log("Creating enhanced interactive map...");
    
    viz.html('');
    
    d3.select('.caption-left').html('');
    d3.select('.caption-right').html('');
    
    viz.style('position', 'absolute')
       .style('top', '0')
       .style('left', '0')
       .style('right', '0')
       .style('bottom', '0')
       .style('width', '100%')
       .style('height', '100%')
       .style('z-index', '10')
       .style('background', COLORS.background)
       .style('overflow', 'hidden');

    const availableWidth = Math.min(viz.node().clientWidth || window.innerWidth, window.innerWidth);
    const availableHeight = Math.min(viz.node().clientHeight || window.innerHeight - 160, window.innerHeight - 160);

    const mainContainer = viz.append('div')
      .attr('class', 'scene3-fullscreen-container')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'stretch')
      .style('justify-content', 'space-between')
      .style('gap', Math.max(12, Math.min(20, availableWidth * 0.015)) + 'px')
      .style('padding', Math.max(12, Math.min(20, availableWidth * 0.015)) + 'px')
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden');

    const sidebarWidth = Math.max(180, Math.min(250, availableWidth * 0.16));

    const leftSidebar = mainContainer.append('div')
      .attr('class', 'legend-sidebar')
      .style('width', sidebarWidth + 'px')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('padding-left', '12px')
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden');

    mapWrapper = mainContainer.append('div')
      .attr('class', 'map-wrapper')
      .style('flex', '1')
      .style('min-width', Math.max(400, availableWidth - (sidebarWidth * 2) - 80) + 'px')
      .style('max-width', (availableWidth - (sidebarWidth * 2) - 80) + 'px')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.background} 100%)`)
      .style('border-radius', '20px')
      .style('box-shadow', '0 8px 32px rgba(29, 53, 87, 0.1)')
      .style('backdrop-filter', 'blur(20px)')
      .style('border', `2px solid ${COLORS.white}`)
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden');

    const rightSidebar = mainContainer.append('div')
      .attr('class', 'controls-sidebar')
      .style('width', sidebarWidth + 'px')
      .style('height', '100%')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('padding-right', '12px')
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden');

    // Map dimensions calculation
    const containerWidth = mapWrapper.node().clientWidth || Math.max(400, availableWidth - (sidebarWidth * 2) - 80);
    const containerHeight = mapWrapper.node().clientHeight || availableHeight;
    
    const maxWidth = containerWidth * 0.98;
    const maxHeight = containerHeight * 0.95;
    
    const aspectRatio = 2.0;
    let width, height;
    
    if (maxWidth / aspectRatio <= maxHeight) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    console.log(`Map container: ${containerWidth}x${containerHeight}, Map dimensions: ${width}x${height}`);

    const svg = mapWrapper.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'map-svg')
      .style('opacity', '0')
      .style('transform', 'translateY(20px)')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.background} 100%)`)
      .style('border-radius', '16px')
      .style('box-shadow', '0 10px 30px rgba(29, 53, 87, 0.1)')
      .style('max-width', '100%')
      .style('max-height', '100%')
      .style('width', '100%')
      .style('height', '100%');

    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.8)
      .translate([width / 2, height / 2]);
    
    const path = d3.geoPath().projection(projection);

    // Color scale setup
    const allDeltas = [];
    for (const country of availableCountries) {
      for (const year of years) {
        const delta = getTempDelta(country, year);
        if (delta !== null) allDeltas.push(delta);
      }
    }
    
    const deltaExtent = d3.extent(allDeltas);
    console.log("Temperature delta range:", deltaExtent);
    
    const colorDomain = deltaExtent && deltaExtent.length === 2 ? 
      [Math.min(deltaExtent[0], -3), Math.max(deltaExtent[1], 11)] : 
      [-3, 11];
    
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([colorDomain[1], colorDomain[0]]);

    console.log("Color scale domain:", colorDomain);

    globalTooltip.init();

    // Country rendering and interaction
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
          return countryName === selectedCountry ? COLORS.primary : COLORS.white;
        });

      countries
        .on('mouseover', function(event, d) {
          const countryName = getCountryName(d.properties.name);
          const delta = countryName ? getTempDelta(countryName, year) : null;
          
          if (!selectedCountry || countryName === selectedCountry) {
            d3.select(this)
              .style('stroke-width', 2)
              .style('stroke', COLORS.secondary);
          }
          
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
            if (selectedCountry === countryName) {
              selectedCountry = null;
              updateCountryInfo(null);
            } else {
              selectedCountry = countryName;
              updateCountryInfo(countryName);
            }
            
            renderCountries(currentYear);
          }
        });
    }

    renderCountries(currentYear);

    // Create floating country info overlay
    const countryInfoOverlay = mapWrapper.append('div')
      .attr('class', 'country-info-overlay')
      .style('position', 'absolute')
      .style('bottom', '20px')
      .style('left', '20px')
      .style('width', '200px')
      .style('background', `linear-gradient(135deg, ${COLORS.white} 0%, rgba(248, 249, 250, 0.95) 100%)`)
      .style('border-radius', '12px')
      .style('padding', '16px 20px')
      .style('border-left', `4px solid ${COLORS.primary}`)
      .style('display', 'none')
      .style('text-align', 'center')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.15)')
      .style('color', '#333')
      .style('border', `1px solid rgba(230, 57, 70, 0.1)`)
      .style('backdrop-filter', 'blur(20px)')
      .style('z-index', '1000')
      .style('opacity', '0');

    countryInfoOverlay.append('div')
      .attr('class', 'selected-country-name')
      .style('font-weight', '700')
      .style('color', COLORS.text)
      .style('font-size', '16px')
      .style('margin-bottom', '8px')
      .style('line-height', '1.3')
      .style('letter-spacing', '0.3px');

    countryInfoOverlay.append('div')
      .attr('class', 'selected-country-temp')
      .style('color', COLORS.primary)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('line-height', '1.3')
      .style('margin-bottom', '12px');

    countryInfoOverlay.append('button')
      .attr('class', 'clear-selection-btn')
      .style('background', COLORS.white)
      .style('color', COLORS.secondary)
      .style('border', `2px solid ${COLORS.secondary}`)
      .style('padding', '6px 12px')
      .style('border-radius', '6px')
      .style('font-size', '11px')
      .style('cursor', 'pointer')
      .style('font-weight', '600')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Clear Selection')
      .on('click', function() {
        selectedCountry = null;
        updateCountryInfo(null);
        mapInstance.renderCountries(currentYear);
      });

    return { svg, renderCountries, colorScale, colorDomain };
  }

  // Legend creation
  function createLegend(colorScale, colorDomain, container) {
    const availableHeight = container.node().clientHeight || 500;
    const sidebarWidth = parseInt(container.style('width')) || 260;
    
    const legendContainer = container.append('div')
      .attr('class', 'vertical-legend')
      .style('background', COLORS.white)
      .style('border-radius', '8px')
      .style('padding', '16px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.08)')
      .style('border-left', `4px solid ${COLORS.primary}`)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '12px')
      .style('opacity', '0')
      .style('width', (sidebarWidth - 40) + 'px')
      .style('height', Math.max(400, Math.min(520, availableHeight * 0.8)) + 'px');

    legendContainer.append('div')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('font-size', '15px')
      .style('text-align', 'center')
      .style('margin-bottom', '4px')
      .text('Temperature Change w.r.t. year 1900');

    const legendHeight = Math.max(200, Math.min(300, availableHeight * 0.4));
    const gradientContainer = legendContainer.append('div')
      .style('display', 'flex')
      .style('align-items', 'stretch')
      .style('gap', '12px')
      .style('margin', '12px 0');

    const legendSvg = gradientContainer.append('svg')
      .attr('width', 30)
      .attr('height', legendHeight);

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
      .attr('width', 25)
      .attr('height', legendHeight - 20)
      .attr('x', 3)
      .attr('y', 10)
      .style('fill', 'url(#vertical-legend-gradient)')
      .style('stroke', 'rgba(29, 53, 87, 0.2)')
      .style('stroke-width', 1)
      .style('rx', 5);

    const labelsContainer = gradientContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'space-between')
      .style('height', legendHeight + 'px')
      .style('padding', '10px 0');

    labelsContainer.append('div')
      .style('color', COLORS.primary)
      .style('font-weight', '600')
      .style('font-size', '13px')
      .style('text-align', 'left')
      .text(`+${colorDomain[1].toFixed(1)}°C`);
    
    labelsContainer.append('div')
      .style('color', COLORS.text)
      .style('font-size', '11px')
      .style('font-weight', '400')
      .style('text-align', 'left')
      .text('0°C');
    
    labelsContainer.append('div')
      .style('color', COLORS.secondary)
      .style('font-weight', '600')
      .style('font-size', '13px')
      .style('text-align', 'left')
      .text(`${colorDomain[0].toFixed(1)}°C`);

    legendContainer.append('div')
      .style('font-size', '11px')
      .style('color', COLORS.secondary)
      .style('text-align', 'bottom')
      .style('margin-top', '4px')
      .text('Click on a country to focus on it. Click again on the same country to reset focus.');

    return legendContainer;
  }

  // Controls creation
  function createControls(container) {
    let isPlaying = false;
    let playInterval = null;

    const availableHeight = container.node().clientHeight || 500;
    const sidebarWidth = parseInt(container.style('width')) || 260;

    const controlsContainer = container.append('div')
      .attr('class', 'vertical-controls')
      .style('background', COLORS.white)
      .style('border-radius', '12px')
      .style('padding', '20px 16px')
      .style('box-shadow', '0 4px 20px rgba(0,0,0,0.08)')
      .style('border-left', `4px solid ${COLORS.primary}`)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '14px')
      .style('opacity', '0')
      .style('width', (sidebarWidth - 40) + 'px')
      .style('height', Math.max(400, Math.min(500, availableHeight * 1)) + 'px')
      .style('box-sizing', 'border-box')
      .style('overflow', 'hidden');

    yearDisplay = controlsContainer.append('div')
      .attr('class', 'year-display')
      .style('font-size', '22px')
      .style('font-weight', '700')
      .style('color', COLORS.primary)
      .style('text-align', 'center')
      .style('margin-bottom', '2px')
      .style('letter-spacing', '1px')
      .style('text-shadow', '0 1px 2px rgba(230, 57, 70, 0.1)')
      .text('1900');

    controlsContainer.append('div')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('color', COLORS.secondary)
      .style('text-align', 'center')
      .style('margin-bottom', '6px')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Timeline');

    const sliderHeight = Math.max(150, Math.min(180, availableHeight * 0.35));
    const sliderContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '8px')
      .style('height', sliderHeight + 'px')
      .style('justify-content', 'space-between')
      .style('margin', '6px 0');

    sliderContainer.append('span')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('letter-spacing', '0.5px')
      .text('2015');

    // Custom CSS for vertical slider
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

    // Vertical slider
    slider = sliderContainer.append('input')
      .attr('type', 'range')
      .attr('min', 1900)
      .attr('max', 2015)
      .attr('value', 1900)
      .attr('class', 'vertical-slider')
      .attr('orient', 'vertical')
      .style('writing-mode', 'bt-lr')
      .style('-webkit-appearance', 'slider-vertical')
      .style('width', '22px')
      .style('height', (sliderHeight - 60) + 'px')
      .style('outline', 'none')
      .style('opacity', '0.9')
      .style('transition', 'all 0.3s ease')
      .style('cursor', 'pointer')
      .on('input', function() {
        if (isPlaying) {
          isPlaying = false;
          if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
          }
          d3.select('.play-pause-btn')
            .html('▶')
            .style('background', COLORS.primary);
        }
        
        const year = +this.value;
        currentYear = year;
        yearDisplay.text(year);
        if (yearInput) {
          yearInput.property('value', year);
        }
        if (mapInstance) {
          mapInstance.renderCountries(year);
        }
        updateCountryInfo(selectedCountry);
      })
      .on('mouseover', function() {
        d3.select(this)
          .style('opacity', '1')
          .style('transform', 'scale(1.03)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', '0.9')
          .style('transform', 'scale(1)');
      });

    sliderContainer.append('span')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('letter-spacing', '0.5px')
      .text('1900');

    const combinedControlsContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('gap', '12px')
      .style('width', '100%')
      .style('margin-top', '12px')
      .style('justify-content', 'space-between');

    // Auto Play controls
    const playContainer = combinedControlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '6px')
      .style('flex', '1');

    playContainer.append('div')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('text-align', 'center')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Auto Play');

    const playButton = playContainer.append('button')
      .attr('class', 'play-pause-btn')
      .style('background', COLORS.primary)
      .style('color', COLORS.white)
      .style('border', 'none')
      .style('width', '36px')
      .style('height', '36px')
      .style('border-radius', '50%')
      .style('cursor', 'pointer')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('font-size', '14px')
      .style('box-shadow', '0 3px 10px rgba(230, 57, 70, 0.3)')
      .style('transition', 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      .html('▶')
      .on('click', function() {
        if (isPlaying) {
          isPlaying = false;
          if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
          }
          d3.select(this)
            .html('▶')
            .style('background', COLORS.primary);
        } else {
          isPlaying = true;
          d3.select(this)
            .html('⏸')
            .style('background', COLORS.secondary);
          
          playInterval = setInterval(() => {
            const currentValue = +slider.property('value');
            const nextYear = currentValue + 1;
            
            if (nextYear <= 2015) {
              currentYear = nextYear;
              slider.property('value', nextYear);
              yearDisplay.text(nextYear);
              if (yearInput) {
                yearInput.property('value', nextYear);
              }
              if (mapInstance) {
                mapInstance.renderCountries(nextYear);
              }
              updateCountryInfo(selectedCountry);
            } else {
              isPlaying = false;
              clearInterval(playInterval);
              playInterval = null;
              d3.select(this)
                .html('▶')
                .style('background', COLORS.primary);
            }
          }, 150);
        }
      })
      .on('mouseover', function() {
        if (!isPlaying) {
          d3.select(this)
            .style('background', COLORS.secondary)
            .style('transform', 'scale(1.08)')
            .style('box-shadow', '0 4px 12px rgba(69, 123, 157, 0.4)');
        }
      })
      .on('mouseout', function() {
        if (!isPlaying) {
          d3.select(this)
            .style('background', COLORS.primary)
            .style('transform', 'scale(1)')
            .style('box-shadow', '0 3px 10px rgba(230, 57, 70, 0.3)');
        }
      });

    // Manual Entry controls
    const inputContainer = combinedControlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('gap', '6px')
      .style('flex', '1');

    inputContainer.append('label')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('text-align', 'center')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Manual Entry');

    inputContainer.append('div')
      .style('font-size', '8px')
      .style('color', COLORS.secondary)
      .style('text-align', 'center')
      .style('margin-bottom', '2px')
      .style('opacity', '0.7')
      .style('line-height', '1.2')
      .text('(1900-2015)');

    yearInput = inputContainer.append('input')
      .attr('type', 'number')
      .attr('min', 1900)
      .attr('max', 2015)
      .attr('value', 1900)
      .attr('step', 1)
      .attr('class', 'year-input')
      .style('width', '70px')
      .style('padding', '6px 4px')
      .style('border', `2px solid ${COLORS.secondary}`)
      .style('border-radius', '6px')
      .style('text-align', 'center')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('background', COLORS.white)
      .style('outline', 'none')
      .style('transition', 'all 0.2s ease')
      .on('input', function() {
        if (isPlaying) {
          isPlaying = false;
          if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
          }
          d3.select('.play-pause-btn')
            .html('▶')
            .style('background', COLORS.primary);
        }
        
        const year = +this.value;
        
        if (!isNaN(year) && year >= 1900 && year <= 2015) {
          currentYear = year;
          yearDisplay.text(year);
          if (slider) {
            slider.property('value', year);
          }
          if (mapInstance) {
            mapInstance.renderCountries(year);
          }
          updateCountryInfo(selectedCountry);
        }
      })
      .on('keydown', function(event) {
        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(event.keyCode) !== -1 ||
            (event.keyCode === 65 && event.ctrlKey === true) ||
            (event.keyCode === 67 && event.ctrlKey === true) ||
            (event.keyCode === 86 && event.ctrlKey === true) ||
            (event.keyCode === 88 && event.ctrlKey === true)) {
          return;
        }
        if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
          event.preventDefault();
        }
      })
      .on('focus', function() {
        d3.select(this)
          .style('border-color', COLORS.primary)
          .style('box-shadow', `0 0 0 2px rgba(230, 57, 70, 0.1)`)
          .node().select();
      })
      .on('blur', function() {
        d3.select(this)
          .style('border-color', COLORS.secondary)
          .style('box-shadow', 'none');
        
        let year = +this.value;
        if (isNaN(year) || year < 1900) {
          year = 1900;
        } else if (year > 2015) {
          year = 2015;
        }
        
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

    // Quick navigation
    const quickNavContainer = controlsContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '6px')
      .style('margin-top', '8px')
      .style('width', '100%');

    quickNavContainer.append('div')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('color', COLORS.text)
      .style('text-align', 'center')
      .style('margin-bottom', '2px')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.5px')
      .text('Quick Nav');

    const buttonRow = quickNavContainer.append('div')
      .style('display', 'flex')
      .style('gap', '4px')
      .style('justify-content', 'center')
      .style('flex-wrap', 'wrap');

    const quickYears = [1900, 1950, 1980, 2000, 2015];
    
    quickYears.forEach(year => {
      buttonRow.append('button')
        .attr('class', 'quick-nav-btn')
        .style('background', COLORS.white)
        .style('color', COLORS.secondary)
        .style('border', `1px solid ${COLORS.secondary}`)
        .style('padding', '3px 6px')
        .style('border-radius', '4px')
        .style('font-size', '9px')
        .style('cursor', 'pointer')
        .style('font-weight', '500')
        .style('transition', 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)')
        .style('min-width', '28px')
        .text(year)
        .on('click', function() {
          if (isPlaying) {
            isPlaying = false;
            if (playInterval) {
              clearInterval(playInterval);
              playInterval = null;
            }
            d3.select('.play-pause-btn')
              .html('▶')
              .style('background', COLORS.primary);
          }
          
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

    return controlsContainer;
  }

  // Helper functions
  function updateCountryInfo(countryName) {
    const countryInfoOverlay = d3.select('.country-info-overlay');
    const selectedCountryName = d3.select('.selected-country-name');
    const selectedCountryTemp = d3.select('.selected-country-temp');
    
    if (countryName) {
      const delta = getTempDelta(countryName, currentYear);
      selectedCountryName.text(countryName);
      selectedCountryTemp.text(delta !== null ? 
        (delta >= 0 ? '+' : '') + delta.toFixed(2) + '°C change from 1900' : 'No temperature data available');
      
      // Simple fade-in without transform
      countryInfoOverlay
        .style('display', 'block')
        .transition()
        .duration(300)
        .style('opacity', '1');
    } else {
      // Simple fade-out without transform
      countryInfoOverlay
        .transition()
        .duration(200)
        .style('opacity', '0')
        .on('end', function() {
          d3.select(this).style('display', 'none');
        });
    }
  }

  let mapInstance;
  let isReplaying = false;

  // Animation functions
  async function replayAnimation() {
    if (isReplaying || !mapInstance) return;
    isReplaying = true;

    const globalReplayButton = d3.select("#replay-button");
    globalReplayButton
      .style('opacity', '0.6')
      .style('transform', 'scale(0.95)')
      .attr('disabled', true);

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
      
      const delay = year > 1980 ? 80 : 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    isReplaying = false;
    globalReplayButton
      .style('opacity', '1')
      .style('transform', 'scale(1)')
      .attr('disabled', null);
  }

  // Main animation sequence
  async function animateScene() {
    console.log("Starting enhanced Scene 3 bowl design animation...");

    try {
      viz.html('');

      const globalReplayButton = d3.select("#replay-button")
        .style("opacity", "0")
        .style("transform", "scale(0)");

      if (!worldGeo || !worldGeo.features || worldGeo.features.length === 0) {
        throw new Error("World geography data is not available");
      }

      if (!tempData || tempData.length === 0) {
        throw new Error("Temperature data is not available");
      }

      mapInstance = createMap();
      
      const leftSidebar = d3.select('.legend-sidebar');
      const rightSidebar = d3.select('.controls-sidebar');
      
      const legend = createLegend(mapInstance.colorScale, mapInstance.colorDomain, leftSidebar);
      const controls = createControls(rightSidebar);

      // Set up slider interaction
      slider.on('input', function() {
        const year = +this.value;
        currentYear = year;
        yearDisplay.text(year);
        if (yearInput) {
          yearInput.property('value', year);
        }
        mapInstance.renderCountries(year);
        updateCountryInfo(selectedCountry);
      });

      mapInstance.renderCountries(1900);

      await new Promise(resolve => setTimeout(resolve, 600));

      mapInstance.svg
        .transition()
        .duration(1000)
        .ease(d3.easeBackOut.overshoot(1.2))
        .style('opacity', '1')
        .style('transform', 'translateY(0)');

      await new Promise(resolve => setTimeout(resolve, 400));

      legend
        .transition()
        .duration(600)
        .ease(d3.easeBackOut)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 400));

      controls
        .transition()
        .duration(600)
        .ease(d3.easeBackOut)
        .style('opacity', '1');

      await new Promise(resolve => setTimeout(resolve, 800));

      globalReplayButton
        .style("display", "flex")
        .transition()
        .duration(400)
        .ease(d3.easeBackOut.overshoot(1.3))
        .style("opacity", "1")
        .style("transform", "scale(1)");

    } catch (error) {
      console.error("Error in enhanced Scene 3 bowl design:", error);
      viz.html(`
        <div style="text-align: center; padding: 60px; color: #e63946; background: rgba(248,249,250,0.9); border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
          <h3 style="font-size: 24px; margin-bottom: 15px;">Unable to Load Interactive Map</h3>
          <p style="font-size: 16px; margin-bottom: 10px;">There was an error loading the climate data visualization.</p>
          <p style="font-size: 13px; color: #666; font-style: italic;">Check the browser console for technical details.</p>
        </div>
      `);
    }
  }

  d3.select("#replay-button").on("click", replayAnimation);

  animateScene();
}
