// frontend/src/components/Charts/EnhancedGeographicMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { usePrecipitationData, useTemperatureData } from '../../hooks/useClimateData';
import { Region } from '../../types/climate';

interface EnhancedGeographicMapProps {
  region: Region;
  isFullScreen?: boolean;
}

const regionCoordinates: Record<string, [number, number]> = {
  // North America
  'USA': [-95, 39],
  'Canada': [-106, 60],
  'Mexico': [-102, 23],
  // Europe
  'UK': [0, 54],
  'France': [3, 47],
  'Germany': [10, 51],
  'Italy': [12, 43],
  'Spain': [-4, 40],
  // Asia
  'China': [105, 35],
  'India': [80, 21],
  'Japan': [138, 36],
  'Russia': [100, 60],
  // Other major regions
  'Brazil': [-53, -10],
  'Australia': [134, -25],
  'South Africa': [24, -29],
};

interface DataPoint {
  region: string;
  coordinate: [number, number];
  temperature: number;
  precipitation: number;
}

const EnhancedGeographicMap: React.FC<EnhancedGeographicMapProps> = ({ 
  region, 
  isFullScreen = false 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dataMetric, setDataMetric] = useState<'temperature' | 'precipitation'>('temperature');
  const [viewMode, setViewMode] = useState<'globe' | 'map'>('map');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topojsonLoaded, setTopojsonLoaded] = useState<boolean>(false);
  
  const { data: precipData } = usePrecipitationData(region);
  const { data: tempData } = useTemperatureData(region, '5y');

  const mapData = React.useMemo(() => {
    
    const dataPoints: DataPoint[] = [];
    
    Object.entries(regionCoordinates).forEach(([name, coordinate]) => {
      const temperature = parseFloat((Math.random() * 3 - 1).toFixed(1));
      
      const latitude = coordinate[1];
      const basePrecipitation = Math.abs(latitude) < 30 
        ? 150 + Math.random() * 50 
        : 80 + Math.random() * 70; 
      
      dataPoints.push({
        region: name,
        coordinate,
        temperature,
        precipitation: parseFloat(basePrecipitation.toFixed(1))
      });
    });
    
    return dataPoints;
  }, []); 

  const filteredMapData = React.useMemo(() => {
    if (region === 'global') return mapData;
    
    return mapData.filter(dataPoint => {
      const longitude = dataPoint.coordinate[0];
      const latitude = dataPoint.coordinate[1];
      
      switch (region) {
        case 'usa':
          return dataPoint.region === 'USA' || dataPoint.region === 'Canada' || dataPoint.region === 'Mexico';
        case 'europe':
          return longitude >= -10 && longitude <= 40 && latitude >= 35 && latitude <= 70;
        case 'asia':
          return longitude >= 60 && longitude <= 150 && latitude >= 0 && latitude <= 60;
        default:
          return true;
      }
    });
  }, [mapData, region]);

  useEffect(() => {
    if (window.topojson) {
      setTopojsonLoaded(true);
      setLoading(false);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    script.onload = () => {
      setTopojsonLoaded(true);
      setLoading(false);
    };
    script.onerror = () => {
      setError('Failed to load required mapping library. Please try again later.');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || filteredMapData.length === 0 || loading || !topojsonLoaded) return;
    
    d3.select(svgRef.current).selectAll("*").remove();
    
    const container = mapContainerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = isFullScreen ? 600 : 350;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
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
    
    let projection: d3.GeoProjection;

    if (viewMode === 'globe') {
      projection = d3.geoOrthographic()
        .scale(isFullScreen ? width / 3 : width / 4)
        .translate([width / 2, height / 2])
        .rotate([0, 0, 0]); 
    } else {
      switch (region) {
        case 'usa':
          projection = d3.geoAlbersUsa()
            .scale(isFullScreen ? 800 : 500)
            .translate([width / 2, height / 2]);
          break;
        case 'europe':
          projection = d3.geoMercator()
            .center([15, 52])
            .scale(isFullScreen ? 600 : 400)
            .translate([width / 2, height / 2]);
          break;
        case 'asia':
          projection = d3.geoMercator()
            .center([100, 35])
            .scale(isFullScreen ? 400 : 250)
            .translate([width / 2, height / 2]);
          break;
        default:
          projection = d3.geoEquirectangular() 
            .scale(isFullScreen ? width / 6 : width / 8)  
            .translate([width / 2, height / 2])
            .clipExtent([[10, 10], [width - 10, height - 10]]);
      }
    }
    
    const geoPath = d3.geoPath().projection(projection);

    const drawMap = () => {
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
        if (!world) return;

        const countries = window.topojson.feature(world, world.objects.countries);

        svg.append("path")
          .datum({type: "Sphere"})
          .attr("fill", "#f0f8ff")
          .attr("stroke", "#ccc")
          .attr("d", geoPath as any);

        svg.selectAll(".country")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", geoPath as any)
        .attr("fill", (d) => {

          if (viewMode === 'globe') {
            const centroid = d3.geoCentroid(d as any);

            const currentRotation = projection.rotate();
            const lambda = currentRotation[0] * Math.PI / 180; 
            const phi = currentRotation[1] * Math.PI / 180;

            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const cosLambda = Math.cos(lambda);
            const sinLambda = Math.sin(lambda);
            
            const point = [centroid[0] * Math.PI / 180, centroid[1] * Math.PI / 180];
            const cosPointPhi = Math.cos(point[1]);
            
            const dot = Math.cos(point[0] + lambda) * cosPointPhi * cosPhi + 
                        Math.sin(point[1]) * sinPhi;

            return dot < -0.1 ? 'none' : '#e5e7eb';
          }
          return '#e5e7eb';
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("display", (d) => {
          if (viewMode === 'globe') {
            const centroid = d3.geoCentroid(d as any);
            const currentRotation = projection.rotate();
            const lambda = currentRotation[0] * Math.PI / 180;
            const phi = currentRotation[1] * Math.PI / 180;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            
            const point = [centroid[0] * Math.PI / 180, centroid[1] * Math.PI / 180];
            const cosPointPhi = Math.cos(point[1]);
            
            const dot = Math.cos(point[0] + lambda) * cosPointPhi * cosPhi + 
                        Math.sin(point[1]) * sinPhi;
                        
            return dot < -0.1 ? 'none' : null;
          }
          return null;
        });
        
        const colorScale = dataMetric === 'temperature'
          ? d3.scaleSequential()
              .domain([-1, 2])
              .interpolator(d3.interpolateRdBu)
              .clamp(true)
          : d3.scaleSequential()
              .domain([50, 200])
              .interpolator(d3.interpolateBlues);

        const baseCircleSize = isFullScreen ? 20 : 12;

        svg.selectAll(".data-point")
          .data(filteredMapData)
          .enter()
          .append("circle")
          .attr("class", "data-point")
          .attr("cx", d => {
            const projected = projection([d.coordinate[0], d.coordinate[1]]);
            return projected ? projected[0] : 0;
          })
          .attr("cy", d => {
            const projected = projection([d.coordinate[0], d.coordinate[1]]);
            return projected ? projected[1] : 0;
          })
          .attr("r", d => selectedRegion === d.region ? baseCircleSize * 1.5 : baseCircleSize)
          .attr("fill", d => colorScale(dataMetric === 'temperature' ? d.temperature : d.precipitation))
          .attr("stroke", d => selectedRegion === d.region ? "#000" : "#fff")
          .attr("stroke-width", d => selectedRegion === d.region ? 2 : 1)
          .attr("opacity", 0.8)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .attr("stroke", "#000")
              .attr("stroke-width", 2)
              .attr("r", baseCircleSize * 1.5);
            
            tooltip
              .style("visibility", "visible")
              .html(`
                <div class="font-medium">${d.region}</div>
                <div>Temperature Anomaly: ${d.temperature}°C</div>
                <div>Precipitation: ${d.precipitation} mm</div>
                <div class="text-xs mt-1 text-gray-500">Click for details</div>
              `);
          })
          .on("mousemove", function(event) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const tooltipWidth = 200; 
            const tooltipHeight = 100; 

            let xPos = event.pageX + 10;
            let yPos = event.pageY - 10;

            if (xPos + tooltipWidth > viewportWidth) {
              xPos = event.pageX - tooltipWidth - 10;
            }

            if (yPos + tooltipHeight > viewportHeight) {
              yPos = event.pageY - tooltipHeight - 10;
            }

            if (yPos < 0) {
              yPos = 10;
            }

            tooltip
              .style("top", yPos + "px")
              .style("left", xPos + "px");
          })
          .on("mouseout", function(event, d) {
            d3.select(this)
              .attr("stroke", selectedRegion === d.region ? "#000" : "#fff")
              .attr("stroke-width", selectedRegion === d.region ? 2 : 1)
              .attr("r", selectedRegion === d.region ? baseCircleSize * 1.5 : baseCircleSize);
            
            tooltip.style("visibility", "hidden");
          })
          .on("click", function(event, d) {
            setSelectedRegion(selectedRegion === d.region ? null : d.region);
          });
        
        if (isFullScreen) {
          svg.selectAll(".region-label")
            .data(filteredMapData)
            .enter()
            .append("text")
            .attr("class", "region-label")
            .attr("x", d => {
              const projected = projection([d.coordinate[0], d.coordinate[1]]);
              return projected ? projected[0] : 0;
            })
            .attr("y", d => {
              const projected = projection([d.coordinate[0], d.coordinate[1]]);
              return projected ? projected[1] + baseCircleSize + 12 : 0;
            })
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#333")
            .text(d => d.region);
        }

        if (viewMode === 'globe' && isFullScreen) {
          const rotationControls = svg.append("g")
            .attr("transform", `translate(${width - 100}, ${height - 80})`);

          rotationControls.append("rect")
            .attr("x", -10)
            .attr("y", -10)
            .attr("width", 90)
            .attr("height", 70)
            .attr("rx", 5)
            .attr("fill", "rgba(255, 255, 255, 0.7)")
            .attr("stroke", "#ccc");
          
          rotationControls.append("text")
            .attr("x", 35)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#666")
            .text("Rotate Globe");

          const buttons = [
            { label: "←", x: 10, y: 30, rotate: [10, 0] }, 
            { label: "→", x: 60, y: 30, rotate: [-10, 0] }, 
            { label: "↑", x: 35, y: 20, rotate: [0, -10] },
            { label: "↓", x: 35, y: 40, rotate: [0, 10] }
          ];
          
          buttons.forEach(button => {
            const controlButton = rotationControls.append("g")
              .attr("transform", `translate(${button.x}, ${button.y})`)
              .style("cursor", "pointer");
            
            controlButton.append("circle")
              .attr("r", 12)
              .attr("fill", "#f9fafb")
              .attr("stroke", "#ccc");
              
            controlButton.append("text")
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", "12px")
              .attr("fill", "#333")
              .text(button.label);
              
            controlButton.on("click", function() {
              const currentRotation = projection.rotate();
              projection.rotate([
                currentRotation[0] + button.rotate[0],
                currentRotation[1] + button.rotate[1]
              ]);

              svg.selectAll("*").remove();
              drawMap();
            });
          });
        }
      }).catch(error => {
        console.error("Error loading world map data:", error);
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "red")
          .text("Error loading map data");
      });
    };
    
    drawMap();
    
    const legendHeight = 15;
    const legendWidth = isFullScreen ? 300 : 200;
    const legendX = 20;
    const legendY = height - 40;

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "data-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    if (dataMetric === 'temperature') {
      linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#2166ac"); 
      
      linearGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#f7f7f7"); 
      linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#b2182b"); 
    } else {
      linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#deebf7");
      
      linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#08519c");
    }

    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#data-gradient)");

    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 5)
      .attr("font-size", isFullScreen ? "12px" : "10px")
      .attr("fill", "#666")
      .text(dataMetric === 'temperature' ? "Temperature Anomaly (°C)" : "Precipitation (mm)");
    
    const legendScale = d3.scaleLinear()
      .domain(dataMetric === 'temperature' ? [-1, 0, 2] : [50, 200])
      .range([0, legendWidth]);
    
    const legendAxis = dataMetric === 'temperature'
      ? d3.axisBottom(legendScale).tickValues([-1, 0, 1, 2])
      : d3.axisBottom(legendScale).tickValues([50, 100, 150, 200]);
    
    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", isFullScreen ? "10px" : "8px");
    
  }, [filteredMapData, region, isFullScreen, dataMetric, viewMode, selectedRegion, loading, topojsonLoaded]);

  useEffect(() => {
    setSelectedRegion(null);
  }, [region]);

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
        <p>{error}</p>
      </div>
    );
  }

  if (!filteredMapData || filteredMapData.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-96'}`}>
        <p className="text-gray-500">No geographic data available for this region.</p>
      </div>
    );
  }

  const renderDetailedView = () => {
    if (!selectedRegion) return null;
    
    const regionData = filteredMapData.find(d => d.region === selectedRegion);
    if (!regionData) return null;
    
    return (
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">{regionData.region} Climate Details</h3>
          <button 
            onClick={() => setSelectedRegion(null)}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Temperature Anomaly</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {regionData.temperature > 0 ? '+' : ''}{regionData.temperature}°C
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {regionData.temperature > 1 ? 
                'Significantly warmer than baseline' : 
                regionData.temperature > 0 ? 
                'Warmer than baseline' : 
                'Cooler than baseline'}
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500">Precipitation</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {regionData.precipitation} mm
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {regionData.precipitation > 150 ? 
                'High precipitation region' : 
                regionData.precipitation > 100 ? 
                'Moderate precipitation' : 
                'Low precipitation region'}
            </div>
          </div>
        </div>
        
        {isFullScreen && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900 mb-2">Historical Trends</h4>
            <p className="text-sm text-gray-600">
              {regionData.region} has experienced {regionData.temperature > 0 ? 'warming' : 'cooling'} trends 
              over recent decades, with average temperature changes of approximately {Math.abs(regionData.temperature)}°C 
              relative to the baseline period. Precipitation patterns have 
              {regionData.precipitation > 150 ? ' increased' : regionData.precipitation < 100 ? ' decreased' : ' remained stable'}.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="text-sm text-blue-500 cursor-pointer hover:underline">
                Click to view detailed historical data for {regionData.region}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={isFullScreen ? 'h-full' : 'h-96'} ref={mapContainerRef}>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-600">
            {region === 'global' ? 'Global' : 
             region === 'usa' ? 'North America' :
             region === 'europe' ? 'Europe' : 'Asia'} Climate Data
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">Show:</span>
            <select 
              value={dataMetric}
              onChange={(e) => setDataMetric(e.target.value as 'temperature' | 'precipitation')}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="temperature">Temperature</option>
              <option value="precipitation">Precipitation</option>
            </select>
          </div>
        </div>
        
        {isFullScreen && (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">View:</span>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2 py-1 text-xs rounded ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Flat Map
            </button>
            <button
              onClick={() => setViewMode('globe')}
              className={`px-2 py-1 text-xs rounded ${viewMode === 'globe' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              3D Globe
            </button>
          </div>
        )}
      </div>
      
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        <svg ref={svgRef} className="w-full" style={{ height: isFullScreen ? '600px' : '350px' }} />
        <div ref={tooltipRef} className="absolute pointer-events-none z-10"></div>
      </div>
      
      {renderDetailedView()}
      
      {isFullScreen && !selectedRegion && (
        <div className="mt-6 p-4 bg-blue-50 rounded max-w-3xl mx-auto">
          <h4 className="font-medium mb-2">Exploring Geographic Climate Data:</h4>
          <p className="text-sm">This interactive map shows {dataMetric === 'temperature' ? 'temperature anomalies' : 'precipitation levels'} across different regions. The colored circles represent data points, with size and color indicating the intensity.</p>
          <p className="text-sm mt-2">Click on any region to view detailed climate information and historical trends. {viewMode === 'globe' ? 'Use the rotation controls in the bottom right to rotate the globe view.' : ''}</p>
        </div>
      )}
    </div>
  );
};

const getRegionName = (region: Region): string => {
  switch (region) {
    case 'global': return 'Global';
    case 'usa': return 'North America';
    case 'europe': return 'Europe';
    case 'asia': return 'Asia';
    default: return 'Global';
  }
};

export default EnhancedGeographicMap;