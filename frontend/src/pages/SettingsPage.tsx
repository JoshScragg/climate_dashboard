import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import axios from 'axios';

interface DashboardSettings {
  defaultRegion: 'global' | 'usa' | 'europe' | 'asia';
  defaultTimeRange: '1y' | '5y' | '10y' | 'max';
  widgets: string[];
  theme: 'light' | 'dark' | 'system';
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<DashboardSettings>({
    defaultRegion: 'global',
    defaultTimeRange: '5y',
    widgets: ['temperature', 'co2', 'precipitation'],
    theme: 'light'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/users/dashboard-settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching dashboard settings:', error);
        setMessage({
          text: 'Failed to load settings. Please try again.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      setIsSaving(true);
      await axios.put('/api/users/dashboard-settings', settings);
      setMessage({
        text: 'Dashboard settings saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
      setMessage({
        text: 'Failed to save settings. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWidget = (widget: string) => {
    setSettings(prev => {
      const widgets = [...prev.widgets];
      
      if (widgets.includes(widget)) {
        return {
          ...prev,
          widgets: widgets.filter(w => w !== widget)
        };
      } else {
        return {
          ...prev,
          widgets: [...widgets, widget]
        };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Settings</h1>

      {message.text && (
        <div 
          className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Default Region" className="col-span-1">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Select your default region for climate data visualization.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['global', 'usa', 'europe', 'asia'] as const).map(region => (
                  <div
                    key={region}
                    className={`
                      border rounded-md p-3 cursor-pointer transition-colors
                      ${settings.defaultRegion === region 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSettings({...settings, defaultRegion: region})}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-4 h-4 rounded-full mr-2 flex items-center justify-center
                        ${settings.defaultRegion === region ? 'bg-primary-500' : 'border border-gray-400'}
                      `}>
                        {settings.defaultRegion === region && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-medium capitalize">
                        {region === 'usa' ? 'USA' : region}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Default Time Range" className="col-span-1">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Select your default time range for data visualization.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['1y', '5y', '10y', 'max'] as const).map(range => (
                  <div
                    key={range}
                    className={`
                      border rounded-md p-3 cursor-pointer transition-colors
                      ${settings.defaultTimeRange === range 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSettings({...settings, defaultTimeRange: range})}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-4 h-4 rounded-full mr-2 flex items-center justify-center
                        ${settings.defaultTimeRange === range ? 'bg-primary-500' : 'border border-gray-400'}
                      `}>
                        {settings.defaultTimeRange === range && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-medium">
                        {range === '1y' ? '1 Year' : 
                         range === '5y' ? '5 Years' : 
                         range === '10y' ? '10 Years' : 
                         'Maximum'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Widgets" className="col-span-1 md:col-span-2">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Select which widgets to display on your dashboard.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'temperature', name: 'Temperature' },
                  { id: 'co2', name: 'CO₂ Levels' },
                  { id: 'precipitation', name: 'Precipitation' },
                  { id: 'sea-level', name: 'Sea Level' },
                  { id: 'ice-extent', name: 'Ice Extent' },
                  { id: 'extreme-events', name: 'Extreme Events' }
                ].map(widget => (
                  <div
                    key={widget.id}
                    className={`
                      border rounded-md p-3 cursor-pointer transition-colors
                      ${settings.widgets.includes(widget.id) 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => toggleWidget(widget.id)}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-5 h-5 rounded mr-2 flex items-center justify-center
                        ${settings.widgets.includes(widget.id) 
                          ? 'bg-primary-500' 
                          : 'border border-gray-400'
                        }
                      `}>
                        {settings.widgets.includes(widget.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">
                        {widget.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Theme" className="col-span-1 md:col-span-2">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Choose your preferred theme for the dashboard.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map(theme => (
                  <div
                    key={theme}
                    className={`
                      border rounded-md p-3 cursor-pointer transition-colors
                      ${settings.theme === theme 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSettings({...settings, theme})}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-4 h-4 rounded-full mr-2 flex items-center justify-center
                        ${settings.theme === theme ? 'bg-primary-500' : 'border border-gray-400'}
                      `}>
                        {settings.theme === theme && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-medium capitalize">
                        {theme}
                      </span>
                    </div>
                    <div className="mt-2 h-8 rounded overflow-hidden">
                      {theme === 'light' && (
                        <div className="w-full h-full bg-white border border-gray-300"></div>
                      )}
                      {theme === 'dark' && (
                        <div className="w-full h-full bg-gray-800"></div>
                      )}
                      {theme === 'system' && (
                        <div className="flex h-full">
                          <div className="w-1/2 bg-white border border-gray-300"></div>
                          <div className="w-1/2 bg-gray-800"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="relative"
          >
            {isSaving ? (
              <>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                <span className="opacity-0">Save Settings</span>
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;