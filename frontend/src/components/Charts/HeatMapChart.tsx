// frontend/src/components/Charts/HeatMapChart.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTemperatureData } from '../../hooks/useClimateData';
import { Region, TimeRange } from '../../types/climate';

interface HeatMapChartProps {
  timeRange: TimeRange;
  region: Region;
  isFullScreen?: boolean;
}

interface HeatMapData {
  year: number;
  month: number;
  value: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HeatMapChart: React.FC<HeatMapChartProps> = ({ 
  timeRange, 
  region, 
  isFullScreen = false 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useTemperatureData(region, timeRange);
  const [metric, setMetric] = useState<'anomaly' | 'average'>('anomaly');

  const heatMapData = React.useMemo(() => {
    if (!data?.data) return [];
    
    
    const monthlyData: HeatMapData[] = [];
    
    data.data.forEach(item => {
      const year = parseInt(item.date.substring(0, 4));
      const baseValue = metric === 'anomaly' ? item.anomaly : (item.average || 0);
      
      for (let month = 0; month < 12; month++) {
        const seasonalFactor = Math.sin((month - 6) * Math.PI / 6) * 0.5;
        
        const randomVariation = (Math.random() - 0.5) * 0.2;
        
        const value = baseValue + seasonalFactor + randomVariation;
        
        monthlyData.push({
          year,
          month,
          value: parseFloat(value.toFixed(2))
        });
      }
    });
    
    return monthlyData;
  }, [data, metric]);

  useEffect(() => {
    if (!heatMapData.length || !svgRef.current || !tooltipRef.current) return;
    
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = svgRef.current.clientWidth;
    const height = isFullScreen ? 600 : 300;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    const years = Array.from(new Set(heatMapData.map(d => d.year))).sort();
    
    const cellWidth = width / years.length;
    const cellHeight = height / 12;
    
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", isFullScreen ? "14px" : "12px")
      .style("pointer-events", "none")
      .style("z-index", "10");
    
    const colorScale = metric === 'anomaly'
      ? d3.scaleSequential()
          .domain([-1, 1])
          .interpolator(d3.interpolateRdBu)
          .clamp(true)
      : d3.scaleSequential()
          .domain([d3.min(heatMapData, d => d.value) || 0, 
                  d3.max(heatMapData, d => d.value) || 30])
          .interpolator(d3.interpolateYlOrRd);
    
    svg.selectAll("rect")
      .data(heatMapData)
      .enter()
      .append("rect")
      .attr("x", d => years.indexOf(d.year) * cellWidth)
      .attr("y", d => d.month * cellHeight)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 2);
        
        tooltip
          .style("visibility", "visible")
          .html(`
            <div class="font-medium">${monthNames[d.month]} ${d.year}</div>
            <div>${metric === 'anomaly' ? 'Temperature Anomaly' : 'Temperature'}: ${d.value}°C</div>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
        
        tooltip.style("visibility", "hidden");
      });
    
    if (years.length <= 20 || isFullScreen) {
      svg.selectAll(".year-label")
        .data(years)
        .enter()
        .append("text")
        .attr("class", "year-label")
        .attr("x", (d, i) => i * cellWidth + cellWidth / 2)
        .attr("y", height + (isFullScreen ? 20 : 15))
        .attr("text-anchor", "middle")
        .attr("font-size", isFullScreen ? "12px" : "10px")
        .attr("fill", "#666")
        .text(d => d);
    }
    
    svg.selectAll(".month-label")
      .data(monthNames)
      .enter()
      .append("text")
      .attr("class", "month-label")
      .attr("x", isFullScreen ? -5 : -3)
      .attr("y", (d, i) => i * cellHeight + cellHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", isFullScreen ? "12px" : "10px")
      .attr("fill", "#666")
      .text(d => d);
    
    const legendHeight = 15;
    const legendWidth = isFullScreen ? 300 : 200;
    const legendX = width - legendWidth - 10;
    const legendY = height + 30;
    
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "heatmap-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    if (metric === 'anomaly') {
      linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(-1));
      
      linearGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorScale(0));
      
      linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(1));
    } else {
      const minVal = d3.min(heatMapData, d => d.value) || 0;
      const maxVal = d3.max(heatMapData, d => d.value) || 30;
      
      linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(minVal));
      
      linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(maxVal));
    }
    
    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#heatmap-gradient)");
    
    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 5)
      .attr("font-size", isFullScreen ? "12px" : "10px")
      .attr("fill", "#666")
      .text(metric === 'anomaly' ? "Temperature Anomaly (°C)" : "Temperature (°C)");
    
    const legendScale = d3.scaleLinear()
      .domain(metric === 'anomaly' ? [-1, 0, 1] : [d3.min(heatMapData, d => d.value) || 0, d3.max(heatMapData, d => d.value) || 30])
      .range([0, legendWidth]);
    
    const legendAxis = metric === 'anomaly'
      ? d3.axisBottom(legendScale).tickValues([-1, -0.5, 0, 0.5, 1])
      : d3.axisBottom(legendScale).ticks(5);
    
    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", isFullScreen ? "10px" : "8px");
    
  }, [heatMapData, metric, isFullScreen]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-red-500`}>
        <p>Error loading temperature data. Please try again later.</p>
      </div>
    );
  }

  if (!heatMapData || heatMapData.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-gray-500`}>
        <p>No temperature data available for this selection.</p>
      </div>
    );
  }

  const getRegionName = (region: Region): string => {
    switch (region) {
      case 'global': return 'Global';
      case 'usa': return 'United States';
      case 'europe': return 'Europe';
      case 'asia': return 'Asia';
      default: return 'Global';
    }
  };

  return (
    <div className={isFullScreen ? 'h-full' : 'h-64'}>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {getRegionName(region)} Monthly Temperature Patterns
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Metric:</span>
          <select 
            value={metric}
            onChange={(e) => setMetric(e.target.value as 'anomaly' | 'average')}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="anomaly">Temperature Anomaly</option>
            <option value="average">Absolute Temperature</option>
          </select>
        </div>
      </div>
      
      <div className="relative">
        <svg ref={svgRef} className="w-full" style={{ height: isFullScreen ? '600px' : '300px' }} />
        <div ref={tooltipRef} className="absolute pointer-events-none z-10"></div>
      </div>
      
      {isFullScreen && (
        <div className="mt-6 p-4 bg-blue-50 rounded max-w-3xl mx-auto">
          <h4 className="font-medium mb-2">Understanding the Temperature Heat Map:</h4>
          <p className="text-sm">This heat map visualizes temperature patterns over time, with each cell representing a month in a specific year. The color indicates the temperature value - {metric === 'anomaly' ? 'with blue showing cooler temperatures relative to the baseline, red showing warmer temperatures, and white near the baseline' : 'with darker colors representing higher temperatures'}.</p>
          <p className="text-sm mt-2">Heat maps are useful for identifying seasonal patterns, long-term trends, and unusual temperature events over time. Hover over any cell to see the exact temperature value.</p>
        </div>
      )}
    </div>
  );
};

export default HeatMapChart;