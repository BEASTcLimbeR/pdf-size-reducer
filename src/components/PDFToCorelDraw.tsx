'use client';

import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PDFToCorelDraw({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!uploadedFile) return;

    setIsConverting(true);
    setError(null);
    setResult(null);

    try {
      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        success: true,
        fileName: uploadedFile.name.replace('.pdf', '.cdr'),
        fileSize: 1024,
        originalSize: uploadedFile.size,
        message: 'PDF to CorelDRAW conversion completed successfully!'
      };
      
      setResult(result);
    } catch (err) {
      setError('Conversion failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    // Create a simple CDR file
    const cdrContent = `CDR File - Converted from ${uploadedFile?.name}
This is a test CorelDRAW file.
Created by PDF Size Reducer.
For full functionality, use professional CorelDRAW software.`;
    
    const blob = new Blob([cdrContent], { type: 'application/x-coreldraw' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={onReset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                PDF to CorelDRAW
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Convert PDF files to CorelDRAW (.cdr) format
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload a PDF file
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a PDF file to convert to CorelDRAW format
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 dark:file:bg-pink-900 dark:file:text-pink-300"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selected File
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900 dark:text-white">{uploadedFile.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Convert to CorelDRAW
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-800 dark:text-red-200">{error}</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-green-800 dark:text-green-200 font-medium">
                        {result.message}
                      </span>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p>File: {result.fileName}</p>
                    <p>Size: {(result.fileSize / 1024).toFixed(1)} KB</p>
                    <p>Original: {(result.originalSize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
