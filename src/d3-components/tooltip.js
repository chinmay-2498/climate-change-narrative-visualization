import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class UnifiedTooltip {
  constructor(container = 'body') {
    this.container = container;
    this.tooltip = null;
    this.offset = { x: 12, y: -8 };
    this.init();
  }

  init() {
    d3.select(this.container).select('.unified-tooltip').remove();
    
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'unified-tooltip')
      .style('position', 'fixed')
      .style('background', 'rgba(26, 32, 56, 0.95)')
      .style('color', 'white')
      .style('padding', '10px 14px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('font-family', '"Segoe UI", sans-serif')
      .style('line-height', '1.4')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('opacity', '0')
      .style('visibility', 'hidden')
      .style('transition', 'opacity 0.2s ease, transform 0.2s ease')
      .style('transform', 'translateY(-5px)')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
      .style('border', '1px solid rgba(255,255,255,0.1)')
      .style('backdrop-filter', 'blur(10px)')
      .style('max-width', '280px')
      .style('word-wrap', 'break-word');
  }

  show(content, event, options = {}) {
    if (!this.tooltip) this.init();
    
    const { 
      className = '', 
      offsetX = this.offset.x, 
      offsetY = this.offset.y,
      maxWidth = '280px'
    } = options;

    // Update content and styling
    this.tooltip
      .html(content)
      .attr('class', `unified-tooltip ${className}`)
      .style('max-width', maxWidth)
      .style('opacity', '1')
      .style('visibility', 'visible');

    // Position the tooltip near the mouse
    this.updatePosition(event, offsetX, offsetY);
  }

  updatePosition(event, offsetX = this.offset.x, offsetY = this.offset.y) {
    if (!this.tooltip || !event) return;

    const mouseX = event.pageX || event.clientX;
    const mouseY = event.pageY || event.clientY;
    
    const tooltipNode = this.tooltip.node();
    const rect = tooltipNode.getBoundingClientRect();
    
    let left = mouseX + offsetX;
    let top = mouseY + offsetY;
    
    if (left + rect.width > window.innerWidth - 10) {
      left = mouseX - rect.width - Math.abs(offsetX);
    }
    
    if (top + rect.height > window.innerHeight - 10) {
      top = mouseY - rect.height - Math.abs(offsetY);
    }
    
    if (left < 10) {
      left = 10;
    }
    
    if (top < 10) {
      top = mouseY + Math.abs(offsetY) + 10;
    }

    this.tooltip
      .style('left', `${left}px`)
      .style('top', `${top}px`);
  }

  move(event, offsetX = this.offset.x, offsetY = this.offset.y) {
    this.updatePosition(event, offsetX, offsetY);
  }

  hide() {
    if (this.tooltip) {
      this.tooltip
        .style('opacity', '0')
        .style('visibility', 'hidden');
    }
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  static formatBasicData(data) {
    return Object.entries(data)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
      .join('');
  }

  static formatHighlight(title, description) {
    return `
      <div style="font-weight: bold; margin-bottom: 6px; color: #f4a261;">${title}</div>
      <div style="font-size: 12px; line-height: 1.3;">${description}</div>
    `;
  }

  static formatCountryData(countryName, year, tempChange, hasData = true) {
    if (!hasData) {
      return `
        <div style="font-weight: bold; margin-bottom: 6px;">${countryName}</div>
        <div style="margin-bottom: 4px;">Year: ${year}</div>
        <div style="color: #999;">No temperature data available</div>
      `;
    }

    const changeColor = tempChange >= 0 ? '#ff6b6b' : '#4ecdc4';
    const changeSign = tempChange >= 0 ? '+' : '';
    
    return `
      <div style="font-weight: bold; margin-bottom: 6px;">${countryName}</div>
      <div style="margin-bottom: 4px;">Year: ${year}</div>
      <div style="margin-bottom: 4px;">Temperature Change: 
        <span style="color: ${changeColor}; font-weight: 500;">${changeSign}${tempChange.toFixed(2)}°C</span>
      </div>
      <div style="font-size: 11px; opacity: 0.8; margin-top: 6px;">vs 1900 baseline</div>
    `;
  }
}

export const globalTooltip = new UnifiedTooltip();
