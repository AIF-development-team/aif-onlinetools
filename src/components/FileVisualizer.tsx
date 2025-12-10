"use client"

import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlotData {
  ads_press: number[];
  ads_amount: number[];
  des_press: number[];
  des_amount: number[];
}

interface Metadata {
  _exptl_temperature: string;
  _adsnt_sample_id: string;
  _exptl_adsorptive: string;
  _units_pressure: string;
  _units_loading: string;
  _units_temperature: string;
}

interface ProcessedData {
  plotData: PlotData;
  metadata: Metadata;
}

export default function AIFPlotter() {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogScale, setIsLogScale] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://online.adsorptioninformationformat.com/api/process-aif', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const processedData = await response.json();
      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform the data arrays into the format Recharts expects, preserving order
  const transformDataForChart = (plotData: PlotData) => {
    // Create array for adsorption data
    const adsorptionPoints = plotData.ads_press.map((pressure, index) => ({
      pressure,
      adsorption: plotData.ads_amount[index],
      desorption: null
    }));
    
    // Create array for desorption data
    const desorptionPoints = plotData.des_press.map((pressure, index) => ({
      pressure,
      adsorption: null,
      desorption: plotData.des_amount[index]
    }));
    
    // Combine both arrays without sorting
    return [...adsorptionPoints, ...desorptionPoints];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">AIF Data Visualizer</h1>
        <p className="text-gray-600 mb-4">
          Upload your AIF (Adsorption Information Format) file to visualize the adsorption isotherm
          and view key experimental metadata.
        </p>
        
        <Alert className="mb-4 bg-blue-50">
          <AlertDescription>
          In accordance with GDPR, no data is stored or retained after processing. All data processing is done locally.
          </AlertDescription>
        </Alert>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="flex justify-center mb-4">
          <FileCheck className="w-12 h-12 text-gray-400" />
        </div>
        <input
          type="file"
          accept=".aif"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleFileChange}
        />
      </div>

      {isLoading && (
        <div className="text-center text-gray-600">
          Processing file...
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Experimental Metadata</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600 mr-2">Temperature:</span>
                <span className="font-medium">{data.metadata._exptl_temperature} {data.metadata._units_temperature}</span>
              </div>
              <div>
                <span className="text-gray-600 mr-2">Adsorbent:</span>
                <span className="font-medium">{data.metadata._adsnt_sample_id}</span>
              </div>
              <div>
                <span className="text-gray-600 mr-2">Adsorbate:</span>
                <span className="font-medium">{data.metadata._exptl_adsorptive}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Adsorption Isotherm</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Scale:</label>
                <select 
                  className="border rounded px-2 py-1 text-sm"
                  value={isLogScale ? 'log' : 'linear'}
                  onChange={(e) => setIsLogScale(e.target.value === 'log')}
                >
                  <option value="linear">Linear</option>
                  <option value="log">Semi-log</option>
                </select>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={transformDataForChart(data.plotData)} 
                  margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="pressure" 
                    type="number"
                    scale={isLogScale ? 'log' : 'auto'}
                    domain={isLogScale ? ['auto', 'auto'] : undefined}
                    label={{ 
                      value: `pressure / ${data.metadata._units_pressure}`,
                      position: 'bottom',
                      offset: 15
                    }}
                    tick={{fontSize: 12}}
                    tickFormatter={(value) => isLogScale ? value.toExponential(1) : value.toString()}
                  />
                  <YAxis 
                    label={{ 
                      value: `amount adsorbed / ${data.metadata._units_loading}`,
                      angle: -90,
                      position: 'insideLeft',
                      offset: -10,
                      style: {
                        textAnchor: 'middle'
                      }
                    }}
                    tick={{fontSize: 12}}
                  />
                  <Tooltip 
                    formatter={(value) => value !== null ? value.toFixed(2) : 'N/A'}
                  />
                  <Legend 
                    layout="vertical"
                    align="insideLeft"
                    verticalAlign="top"
                    wrapperStyle={{
                      paddingLeft: 80,
                      paddingTop: 10,
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="adsorption" 
                    stroke="#2563eb" 
                    dot={{ r: 3 }}
                    name="adsorption"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="desorption" 
                    stroke="#dc2626" 
                    dot={{ r: 3 }}
                    name="desorption"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
