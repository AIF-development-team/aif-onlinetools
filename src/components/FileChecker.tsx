"use client"

import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE } from "@/lib/api";

interface CheckResult {
  valid: boolean;
  errors?: string[] | string;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'checking' | 'complete' | 'error';
  result?: CheckResult;
  error?: string;
}

export default function FileChecker() {
  const [files, setFiles] = useState<FileStatus[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map(file => ({
      file,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const checkFile = async (fileObj: FileStatus, index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], status: 'checking' };
      return newFiles;
    });

    try {
      const fileContent = await fileObj.file.text();
      
      const response = await fetch(`${API_BASE}/check-aif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();

      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = {
          ...newFiles[index],
          status: 'complete',
          result
        };
        return newFiles;
      });
    } catch (error) {
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = {
          ...newFiles[index],
          status: 'error',
          error: error.message
        };
        return newFiles;
      });
    }
  };

  const handleCheckAll = () => {
    files.forEach((file, index) => {
      if (file.status === 'pending') {
        checkFile(file, index);
      }
    });
  };

  const isWarningOnly = (errors: string[] | string): boolean => {
    if (Array.isArray(errors)) {
      return errors.every(error => error.startsWith('WARNING:'));
    }
    return errors.startsWith('WARNING:');
  };

  const getStatusIcon = (fileObj: FileStatus) => {
    if (fileObj.status === 'complete') {
      if (fileObj.result?.valid) {
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      }
      // Check if there are any errors and if they're warnings or errors
      if (fileObj.result?.errors) {
        if (isWarningOnly(fileObj.result.errors)) {
          return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        }
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      }
    } else if (fileObj.status === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Upload className="w-5 h-5 text-gray-400" />;
  };

  const getAlertVariant = (errors: string[] | string) => {
    return isWarningOnly(errors) ? "warning" : "destructive";
  };

  const formatErrors = (errors: string[] | string) => {
    if (Array.isArray(errors)) {
      return errors;
    }
    return [errors];
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">checkAIF</h1>
        <p className="text-gray-600 mb-4">
          Validate your AIF (Adsorption Information Format) files for compliance 
          with the standard specifications. This tool performs comprehensive checks on 
          file structure, required fields, and data consistency. Upload multiple files 
          to check them in batch.
        </p>
        
        <Alert className="mb-4 bg-blue-50">
          <AlertDescription>
            Your data stays private. Uploaded files are processed in memory and never stored.
          </AlertDescription>
        </Alert>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="flex justify-center mb-4">
          <FileCheck className="w-12 h-12 text-gray-400" />
        </div>
        <input
          type="file"
          multiple
          accept=".aif"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-4 mb-6">
          {files.map((fileObj, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(fileObj)}
                  <span className="font-medium">{fileObj.file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {fileObj.status === 'complete' && fileObj.result && (
                <div className="mt-2">
                  {fileObj.result.valid ? (
                    <Alert variant="default">
                      <AlertDescription>
                        File structure and content validated successfully
                      </AlertDescription>
                    </Alert>
                  ) : fileObj.result.errors && (
                    <Alert 
                      variant={getAlertVariant(fileObj.result.errors)}
                      className={`${
                        isWarningOnly(fileObj.result.errors)
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                        : ''
                      }`}
                    >
                      <AlertDescription>
                        <div className="font-medium mb-2">
                          {isWarningOnly(fileObj.result.errors) 
                            ? 'Warnings found:'
                            : 'Validation errors found:'}
                        </div>
                        <ul className="list-disc pl-5">
                          {formatErrors(fileObj.result.errors).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {fileObj.status === 'error' && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{fileObj.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleCheckAll}
          disabled={files.length === 0 || files.every(f => f.status !== 'pending')}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check All Files
        </button>
      </div>
    </div>
  );
}
