"use client"

import React, { useState, useRef } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Download, Upload } from 'lucide-react';
import { API_BASE } from "@/lib/api";

// Keeping the existing field definitions
const requiredMetadata = [
  {"data name": "_exptl_adsorptive", "variable_type": "string", "label": "Experimental Adsorptive"},
  {"data name": "_exptl_temperature", "variable_type": "float", "label": "Experimental Temperature"},
  {"data name": "_exptl_method", "variable_type": "string", "label": "Experimental Method"},
  {"data name": "_exptl_isotherm_type", "variable_type": "string", "label": "Experimental Isotherm Type"},
  {"data name": "_exptl_p0", "variable_type": "float", "label": "Experimental p0"},
  {"data name": "_adsnt_sample_mass", "variable_type": "float", "label": "Adsorbent Sample Mass"},
  {"data name": "_adsnt_sample_density", "variable_type": "float", "label": "Adsorbent Sample Density"},
  {"data name": "_adsnt_material_id", "variable_type": "string", "label": "Adsorbent Material ID"},
  {"data name": "_adsnt_degas_summary", "variable_type": "string", "label": "Adsorbent Degas Summary"},
  {"data name": "_adsnt_degas_temperature", "variable_type": "float", "label": "Adsorbent Degas Temperature"},
  {"data name": "_adsnt_degas_time", "variable_type": "float", "label": "Adsorbent Degas Time"},
  {"data name": "_units_temperature", "variable_type": "string", "label": "Units Temperature"},
  {"data name": "_units_pressure", "variable_type": "string", "label": "Units Pressure"},
  {"data name": "_units_mass", "variable_type": "string", "label": "Units Mass"},
  {"data name": "_units_loading", "variable_type": "string", "label": "Units Loading"},
  {"data name": "_units_density", "variable_type": "string", "label": "Units Density"},
  {"data name": "_units_time", "variable_type": "string", "label": "Units Time"},
  {"data name": "_units_composition_type", "variable_type": "string", "label": "Units Composition Type"}
];

const metadataGroups = {
  experimental: requiredMetadata.filter(field => field["data name"].startsWith("_exptl")),
  adsorbent: requiredMetadata.filter(field => field["data name"].startsWith("_adsnt")),
  units: requiredMetadata.filter(field => field["data name"].startsWith("_units"))
};

const adsorptionFields = [
  {"data name": "_adsorp_pressure", "variable_type": "float", "label": "Adsorption Pressure"},
  {"data name": "_adsorp_amount", "variable_type": "float", "label": "Adsorption Amount"}
];

const desorptionFields = [
  {"data name": "_desorp_pressure", "variable_type": "float", "label": "Desorption Pressure"},
  {"data name": "_desorp_amount", "variable_type": "float", "label": "Desorption Amount"}
];

export default function AifInputDigitizer() {
  const [metadata, setMetadata] = useState({});
  const [adsorptionData, setAdsorptionData] = useState([{}]);
  const [desorptionData, setDesorptionData] = useState([{}]);
  const [isExporting, setIsExporting] = useState(false);
  
  const metadataRefs = useRef({});
  const adsorptionRefs = useRef([]);
  const desorptionRefs = useRef([]);

  const handleMetadataBlur = (field: string, inputRef: HTMLInputElement) => {
    const value = inputRef.value;
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDataBlur = (index: number, field: string, value: string, type: 'adsorption' | 'desorption') => {
    if (type === 'adsorption') {
      setAdsorptionData(prev => {
        const newData = [...prev];
        newData[index] = { ...newData[index], [field]: value };
        return newData;
      });
    } else {
      setDesorptionData(prev => {
        const newData = [...prev];
        newData[index] = { ...newData[index], [field]: value };
        return newData;
      });
    }
  };

  const addRow = (type: 'adsorption' | 'desorption') => {
    if (type === 'adsorption') {
      setAdsorptionData(prev => [...prev, {}]);
      adsorptionRefs.current.push({});
    } else {
      setDesorptionData(prev => [...prev, {}]);
      desorptionRefs.current.push({});
    }
  };

  const removeRow = (index: number, type: 'adsorption' | 'desorption') => {
    if (type === 'adsorption') {
      setAdsorptionData(prev => prev.filter((_, i) => i !== index));
      adsorptionRefs.current = adsorptionRefs.current.filter((_, i) => i !== index);
    } else {
      setDesorptionData(prev => prev.filter((_, i) => i !== index));
      desorptionRefs.current = desorptionRefs.current.filter((_, i) => i !== index);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (content.metadata) {
          setMetadata(content.metadata);
          // Update refs with new values
          Object.entries(content.metadata).forEach(([key, value]) => {
            if (metadataRefs.current[key]) {
              metadataRefs.current[key].value = value;
            }
          });
        }
        if (content.adsorption_data) setAdsorptionData(content.adsorption_data);
        if (content.desorption_data) setDesorptionData(content.desorption_data);
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };
    reader.readAsText(file);
  };

  const MetadataSection = ({ title, fields }: { title: string, fields: typeof requiredMetadata }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field["data name"]} className="space-y-2">
            <label className="text-sm font-medium">
              {field.label}
            </label>
            <Input
              type="text"
              defaultValue={metadata[field["data name"]] || ""}
              ref={el => metadataRefs.current[field["data name"]] = el}
              onBlur={(e) => handleMetadataBlur(field["data name"], e.target)}
              placeholder={`Enter ${field.label}`}
              className="font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const LoopDataTable = ({ 
    type, 
    data, 
    fields 
  }: { 
    type: 'adsorption' | 'desorption', 
    data: Record<string, string>[],
    fields: typeof adsorptionFields 
  }) => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field["data name"]} className="px-4 py-2 bg-gray-50 border-b">
                {field.label}
              </th>
            ))}
            <th className="px-4 py-2 bg-gray-50 border-b w-16"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((point, index) => (
            <tr key={index} className="border-b last:border-b-0">
              {fields.map((field) => (
                <td key={field["data name"]} className="px-2 py-1">
                  <Input
                    type="text"
                    defaultValue={point[field["data name"]] || ""}
                    ref={el => {
                      const refs = type === 'adsorption' ? adsorptionRefs : desorptionRefs;
                      if (!refs.current[index]) refs.current[index] = {};
                      refs.current[index][field["data name"]] = el;
                    }}
                    onBlur={(e) => handleDataBlur(index, field["data name"], e.target.value, type)}
                    placeholder={`Enter ${field.label}`}
                    className="w-full font-mono"
                  />
                </td>
              ))}
              <td className="px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index, type)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="flex justify-center mt-4 mb-2">
        <Button onClick={() => addRow(type)} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </Button>
      </div>
    </div>
  );

  const downloadJSON = () => {
    const data = {
      metadata,
      adsorption_data: adsorptionData,
      desorption_data: desorptionData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aif_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportAIF = async () => {
    setIsExporting(true);
    try {
      const data = {
        metadata,
        adsorption_data: adsorptionData.filter(row => Object.keys(row).length > 0),
        desorption_data: desorptionData.filter(row => Object.keys(row).length > 0)
      };

      const response = await fetch(`${API_BASE}/input-to-aif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert to AIF format');
      }

      const result = await response.json();
      const blob = new Blob([result.aif_content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'isotherm.aif';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting AIF:', error);
      alert('Error converting to AIF format: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">AIF Input Digitizer</h1>
        <p className="text-gray-600 mb-4">
          Create and export Adsorption Information Format (AIF) files with this interactive tool. 
          Input your experimental data, metadata, and measurement details in a structured format 
          that complies with AIF specifications. You can save your progress as JSON and continue 
          later, or export directly to AIF format.
        </p>
        
        <Alert className="mb-4 bg-blue-50">
          <AlertDescription>
            Your data stays private. Uploaded files are processed in memory and never stored.
          </AlertDescription>
        </Alert>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="space-x-2">
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="file-upload"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import JSON
              </span>
            </Button>
          </label>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={downloadJSON}>
            <Download className="w-4 h-4 mr-2" />
            Save as JSON
          </Button>
          <Button 
            variant="default"
            onClick={exportAIF}
            disabled={isExporting}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as AIF
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-6">Metadata</h2>
          <div className="space-y-8">
            <MetadataSection title="Experimental Details" fields={metadataGroups.experimental} />
            <MetadataSection title="Adsorbent Properties" fields={metadataGroups.adsorbent} />
            <MetadataSection title="Unit Specifications" fields={metadataGroups.units} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-medium mb-4">Adsorption Data</h2>
            <LoopDataTable 
              type="adsorption"
              data={adsorptionData}
              fields={adsorptionFields}
            />
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-medium mb-4">Desorption Data</h2>
            <LoopDataTable 
              type="desorption"
              data={desorptionData}
              fields={desorptionFields}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
