// frontend/src/pages/DrillDownPage.tsx (Updated)
import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import ScatterPlotChart from '../components/Charts/ScatterPlotChart';
import HeatMapChart from '../components/Charts/HeatMapChart';
import EnhancedGeographicMap from '../components/Charts/EnhancedGeographicMap';
import { Region, TimeRange } from '../types/climate';

const DrillDownPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('5y');
  const [region, setRegion] = useState<Region>('global');
  const [activeTab, setActiveTab] = useState<'map' | 'scatter' | 'heatmap'>('map');

  useEffect(() => {
    const storedTab = localStorage.getItem('analysisTab');
    if (storedTab === 'scatter' || storedTab === 'heatmap' || storedTab === 'map') {
      setActiveTab(storedTab);

      localStorage.removeItem('analysisTab');
    }
  }, []);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleRegionChange = (selectedRegion: Region) => {
    setRegion(selectedRegion);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Climate Analysis</h1>
        <div className="flex space-x-2">
          <div className="bg-white p-1 rounded-md shadow-sm">
            <div className="flex space-x-1">
              {(['1y', '5y', '10y', 'max'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === range
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {range === 'max' ? 'Max' : range}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white p-1 rounded-md shadow-sm">
            <div className="flex space-x-1">
              {(['global', 'usa', 'europe', 'asia'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRegionChange(r)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    region === r
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {r === 'global' ? 'Global' : r === 'usa' ? 'N. America' : r === 'europe' ? 'Europe' : 'Asia'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'map'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('map')}
          >
            Geographic Analysis
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'scatter'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('scatter')}
          >
            Correlation Analysis
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'heatmap'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('heatmap')}
          >
            Temporal Patterns
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'map' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Geographic Climate Data Analysis</h2>
              <p className="text-sm text-gray-600 mb-6">
                Explore climate patterns across different geographic regions. Click on a region for detailed information 
                and analysis of historical trends.
              </p>
              <EnhancedGeographicMap region={region} isFullScreen={true} />
            </div>
          )}

          {activeTab === 'scatter' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Climate Variable Correlation Analysis</h2>
              <p className="text-sm text-gray-600 mb-6">
                Analyze the relationship between CO₂ concentration and temperature anomalies. Each point represents 
                a year of data, showing how these variables correlate over time.
              </p>
              <ScatterPlotChart timeRange={timeRange} region={region} isFullScreen={true} />
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Temporal Climate Pattern Analysis</h2>
              <p className="text-sm text-gray-600 mb-6">
                Examine how temperature patterns have changed over time with this heat map visualization. 
                Identify seasonal patterns, long-term trends, and anomalies across different years.
              </p>
              <HeatMapChart timeRange={timeRange} region={region} isFullScreen={true} />
            </div>
          )}
        </div>
      </div>

      <Card title="Climate Insights & Analysis" className="col-span-1">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-medium text-gray-900">Key Findings:</h3>
          </div>
          
          {activeTab === 'map' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                The geographic analysis reveals significant regional variations in climate patterns. 
                {region === 'global' 
                  ? ' Arctic regions show warming at rates 2-3 times the global average, while some ocean areas experience less dramatic changes.'
                  : region === 'usa'
                  ? ' Western regions are experiencing more severe drought conditions, while the northeastern areas show increased precipitation patterns.'
                  : region === 'europe'
                  ? ' Southern Europe is experiencing warming and drying trends, while Northern Europe shows increased precipitation patterns.'
                  : ' Central and Southern Asia are experiencing more extreme temperature increases, particularly in continental regions.'}
              </p>
              <p className="text-sm text-gray-600">
                The interactive map allows for detailed regional analysis, highlighting both temperature anomalies and precipitation patterns.
                Areas with the most significant climate changes are indicated by larger, more intensely colored circles.
              </p>
              <div className="flex items-center mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 mr-2">Suggested Analysis:</span>
                <Button size="sm" variant="outline">Explore Arctic Warming</Button>
              </div>
            </div>
          )}
          
          {activeTab === 'scatter' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                The scatter plot analysis demonstrates a strong positive correlation between CO₂ concentrations and temperature anomalies.
                As atmospheric CO₂ has increased over time, global temperatures have shown a corresponding rise.
              </p>
              <p className="text-sm text-gray-600">
                {region === 'global'
                  ? 'On a global scale, the relationship shows a clear trend with an approximate increase of 0.1°C per 10 ppm CO₂ increase.'
                  : region === 'usa'
                  ? 'In North America, the correlation may be impacted by other factors such as aerosol pollution and land use changes.'
                  : region === 'europe'
                  ? 'European temperature trends track closely with global patterns, showing clear sensitivity to CO₂ changes.'
                  : 'Asian regional responses show some of the most pronounced temperature increases per unit of CO₂ change.'}
                More recent data points (shown in the upper right) demonstrate accelerating changes.
              </p>
              <div className="flex items-center mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 mr-2">Suggested Analysis:</span>
                <Button size="sm" variant="outline">Compare Regions</Button>
              </div>
            </div>
          )}
          
          {activeTab === 'heatmap' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                The heat map visualization reveals both seasonal patterns and long-term temperature trends.
                Clear warming signals can be observed across all seasons, but the most pronounced warming is in the
                {region === 'global'
                  ? ' winter months in the Northern Hemisphere.'
                  : region === 'usa'
                  ? ' winter and early spring months across North America.'
                  : region === 'europe'
                  ? ' summer and autumn months across Europe.'
                  : ' winter and spring months across Asia.'}
              </p>
              <p className="text-sm text-gray-600">
                The visualization also highlights that warming hasn't been uniform across time. There are periods of accelerated warming 
                (visible as bands of darker red) and periods of relative stability. Recent years show a clear intensification of the warming pattern.
              </p>
              <div className="flex items-center mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 mr-2">Suggested Analysis:</span>
                <Button size="sm" variant="outline">Seasonal Trends</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-900">Export & Share</h3>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Data
            </Button>
            <Button size="sm" variant="outline">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Analysis
            </Button>
            <Button size="sm" variant="primary">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrillDownPage;