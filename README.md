# Climate Change Narrative Visualization

A D3.js-powered interactive visualization that tells the story of global climate change through three narrative scenes.

## Overview

This project presents climate data through an engaging three-scene narrative:

1. **Global Temperature Trends** - Shows [land] vs [land+ocean] temperature changes from 1900-2015
2. **CO₂ and Temperature Correlation** - Explores the relationship between emissions and temperature
3. **Regional Temperature Changes** - Interactive world map showing country-specific temperature changes

## Features

- Interactive D3.js visualizations
- Smooth scene transitions with navigation
- Tooltips and hover interactions
- Clean, modern UI with narrative captions

## Technology Stack

- **D3.js v7** - Data visualization and DOM manipulation
- **TopoJSON** - Geographic data format and topology for scene 3 world map
- **Vanilla JavaScript** - Core application logic
- **CSS3** - Responsive styling and animations
- **HTML5** - Semantic markup

## Data Sources

- Global temperature data from Berkeley Earth
- CO₂ emissions data from Our World in Data
- Country geographic data for world map visualization

## Getting Started

1. Clone the repository
2. Serve the files using a local web server
3. Open `index.html` in your browser

## Project Structure

```
├── index.html                 # Main HTML file
├── src/
│   ├── main.js               # Application entry point
│   ├── navigation.js         # Scene navigation logic
│   ├── scenes/               # Individual scene implementations
│   │   ├── scene1.js
│   │   ├── scene2.js
│   │   └── scene3.js
│   └── d3-components/        # Reusable D3 components
│       └── tooltip.js
└── public/
    └── assets/
        ├── data/             # Climate datasets
        └── styles/
            └── main.css      # Application styles
```

## Usage

Navigate between scenes using the navigation buttons or arrow keys. Each scene tells part of the climate change story with interactive elements and detailed tooltips.