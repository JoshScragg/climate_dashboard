import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { usePrecipitationData } from '../../hooks/useClimateData';
import { Region } from '../../types/climate';

interface PrecipitationMapProps {
  region: Region;
  isFullScreen?: boolean; 
}

const PrecipitationMap: React.FC<PrecipitationMapProps> = ({ region, isFullScreen = false }) => {
  const { data, loading, error } = usePrecipitationData(region);
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    const precipData = data.data;
    
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = svgRef.current.clientWidth;
    const height = isFullScreen ? window.innerHeight * 0.7 : 400; 
    
    let projection: d3.GeoProjection;
    
    switch (region) {
      case 'usa':
        projection = d3.geoAlbersUsa()
          .scale(isFullScreen ? 1200 : 800)
          .translate([width / 2, height / 2]);
        break;
      case 'europe':
        projection = d3.geoMercator()
          .center([15, 52])
          .scale(isFullScreen ? 750 : 500)
          .translate([width / 2, height / 2]);
        break;
      case 'asia':
        projection = d3.geoMercator()
          .center([100, 35])
          .scale(isFullScreen ? 450 : 300)
          .translate([width / 2, height / 2]);
        break;
      default:
        projection = d3.geoNaturalEarth1()
          .scale(isFullScreen ? width / 4 : width / 6)
          .translate([width / 2, height / 2]);
    }
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(precipData, d => d.value) || 100]);
    
    const circleRadius = isFullScreen ? 7 : 5;
    
    svg.selectAll("circle")
      .data(precipData)
      .enter()
      .append("circle")
      .attr("cx", d => {
        const coords = projection([d.longitude, d.latitude] as [number, number]);
        return coords ? coords[0] : 0;
      })
      .attr("cy", d => {
        const coords = projection([d.longitude, d.latitude] as [number, number]);
        return coords ? coords[1] : 0;
      })
      .attr("r", circleRadius)
      .attr("fill", d => colorScale(d.value))
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .append("title")
      .text(d => `Location: ${d.latitude.toFixed(1)}°, ${d.longitude.toFixed(1)}°
Precipitation: ${d.value} mm
Anomaly: ${d.anomaly ? d.anomaly + ' mm' : 'N/A'}`);
    
    const legendWidth = isFullScreen ? 300 : 200;
    const legendHeight = isFullScreen ? 30 : 20;
    
    const legendX = width - legendWidth - (isFullScreen ? 40 : 20);
    const legendY = height - (isFullScreen ? 60 : 40);
    
    const legend = svg.append("g")
      .attr("transform", `translate(${legendX},${legendY})`);
    
    const legendGradient = legend.append("defs")
      .append("linearGradient")
      .attr("id", "precipitation-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    const stops = [0, 0.25, 0.5, 0.75, 1];
    stops.forEach(stop => {
      legendGradient.append("stop")
        .attr("offset", `${stop * 100}%`)
        .attr("stop-color", colorScale(stop * (d3.max(precipData, d => d.value) || 100)));
    });
    
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#precipitation-gradient)");
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .attr("font-size", isFullScreen ? "14px" : "12px")
      .attr("fill", "#666")
      .text("Precipitation (mm)");
    
    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(precipData, d => d.value) || 100])
      .range([0, legendWidth]);
    
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(isFullScreen ? 8 : 5);
    
    legend.append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", isFullScreen ? "12px" : "10px");
      
    if (isFullScreen) {
      const regionName = 
        region === 'global' ? 'Global' : 
        region === 'usa' ? 'United States' :
        region === 'europe' ? 'Europe' : 'Asia';
        
      svg.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(`${regionName} Precipitation Pattern`);
    }
    
  }, [data, region, isFullScreen]);
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-96'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-96'} text-red-500`}>
        <p>Error loading precipitation data. Please try again later.</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-96'} text-gray-500`}>
        <p>No precipitation data available for this region.</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${isFullScreen ? 'h-full' : 'h-96'} overflow-hidden`}>
      <svg ref={svgRef} className="w-full h-full" />
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>Click on data points to see detailed precipitation information.</p>
        {isFullScreen && (
          <div className="mt-4 p-4 bg-blue-50 rounded max-w-3xl mx-auto">
            <h4 className="font-medium mb-2">About Precipitation Patterns:</h4>
            <p>This map shows precipitation levels across {region === 'global' ? 'the world' : region}. 
            Blue circles represent precipitation amounts in millimeters, with darker blue indicating higher precipitation. 
            Climate change is expected to intensify precipitation patterns, making wet areas wetter and dry areas drier.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrecipitationMap;