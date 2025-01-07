"use client"

import React, { useState } from 'react';
import { Upload, ArrowRight, Download, X, CheckCircle, AlertCircle, FileDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SUPPORTED_FORMATS = [
  {label: 'Quantachrome (.txt)', value: 'txt-raw,qnt'},
  {label: 'BELSORP-max (.DAT)', value: 'dat,bel'},
  {label: 'BELSORP-max (.csv)', value: 'csv,bel,ENG'},
  {label: 'BELSORP-max (.xls)', value: 'xl,bel'},
  {label: 'JIS BELSORP-max (.csv)', value: 'csv,bel,JPN'},
  {label: 'Micromeritics (.xls)', value: 'xl,mic'},
  {label: 'generic (.xls)', value: 'xls,generic'},
];

export default function FileConverter() {
  const [files, setFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [sourceFormat, setSourceFormat] = useState('txt-raw,qnt');

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files).map(file => ({
      file,
      status: 'pending',
      convertedBlob: null,
      error: null
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleConvertAll = async () => {
    if (files.length === 0) {
      setError('Please select files first');
      return;
    }

    setConverting(true);
    setError(null);

    await Promise.all(files.map(async (fileObj, index) => {
      if (fileObj.status === 'completed') return;
      
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], status: 'converting', error: null };
        return newFiles;
      });

      const formData = new FormData();
      formData.append('file', fileObj.file);
      formData.append('source_format', sourceFormat);

      try {
        const response = await fetch('http://localhost:8000/api/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Conversion failed');
        }

        const blob = await response.blob();

        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            status: 'completed',
            convertedBlob: blob
          };
          return newFiles;
        });
      } catch (err) {
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            status: 'error',
            error: err.message
          };
          return newFiles;
        });
      }
    }));

    setConverting(false);
  };

  const handleDownload = (fileObj) => {
    if (!fileObj.convertedBlob) return;
    
    const url = window.URL.createObjectURL(fileObj.convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileObj.file.name}.aif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleTemplateDownload = () => {
    const link = document.createElement('a');
    link.href = '/template.xls';
    link.download = 'template.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'converting': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">raw2aif</h1>
        <p className="text-gray-600 mb-4">
          Convert your adsorption measurement files to the standardized AIF format.
          This tool supports various instrument formats and allows batch conversion
          for multiple files.
        </p>
        
        <Alert className="mb-4 bg-blue-50">
          <AlertDescription>
            In accordance with GDPR, we do not store or retain any of your uploaded data.
            All file processing is done locally in your browser, and files are automatically
            deleted after conversion.
          </AlertDescription>
        </Alert>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Source Format
        </label>
        <select
          value={sourceFormat}
          onChange={(e) => setSourceFormat(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        >
          {SUPPORTED_FORMATS.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <span>
            If your file format is not supported, you can use our generic Excel template
            and convert it using the generic format option.
          </span>
        </div>
        <button
          onClick={handleTemplateDownload}
          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FileDown className="w-4 h-4" />
          Download generic Excel template
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="flex justify-center mb-4">
          <Upload className="w-12 h-12 text-gray-400" />
        </div>
        <input
          type="file"
          multiple
          accept={`.${sourceFormat}`}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200">
          {files.map((fileObj, index) => (
            <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <div className="flex items-center space-x-4 flex-1">
                <span className={`${getStatusColor(fileObj.status)}`}>
                  {fileObj.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                   fileObj.status === 'converting' ? <ArrowRight className="w-5 h-5" /> :
                   fileObj.status === 'error' ? <AlertCircle className="w-5 h-5" /> :
                   <Upload className="w-5 h-5" />}
                </span>
                <span className="flex-1 truncate">{fileObj.file.name}</span>
                {fileObj.error && (
                  <span className="text-sm text-red-500">{fileObj.error}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {fileObj.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(fileObj)}
                    className="p-2 text-green-600 hover:text-green-700"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleConvertAll}
          disabled={files.length === 0 || converting}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {converting ? 'Converting...' : 'Convert All'}
          {!converting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}