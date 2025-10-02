'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Droplets } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { useProgress } from '@/hooks/useProgress';

interface PDFWatermarkProps {
  onReset?: () => void;
}

interface WatermarkSettings {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';
  rotation: number;
}

export default function PDFWatermark({ onReset }: PDFWatermarkProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.3,
    color: '#FF0000',
    position: 'diagonal',
    rotation: -45
  });
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkedFile, setWatermarkedFile] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    steps,
    isProcessing,
    startProcessing,
    completeStep,
    setStepError,
    cancelProcessing,
    resetProgress
  } = useProgress({
    steps: [
      { id: 'validate', label: 'Validating PDF file', estimatedTime: 2 },
      { id: 'load-pdf', label: 'Loading PDF document', estimatedTime: 3 },
      { id: 'apply-watermark', label: 'Applying watermark', estimatedTime: 5 },
      { id: 'optimize', label: 'Optimizing watermarked PDF', estimatedTime: 2 },
      { id: 'finalize', label: 'Finalizing output', estimatedTime: 1 }
    ],
    onComplete: () => {
      setIsWatermarking(false);
    },
    onError: (err) => {
      setError(err);
      setIsWatermarking(false);
    },
    onCancel: async () => {
      setIsWatermarking(false);
      resetProgress();
    }
  });

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }

    try {
      setUploadedFile(file);
      
      // Load PDF to get page count
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdf);
      setTotalPages(pdf.getPageCount());
    } catch (err) {
      setError('Failed to load PDF. The file may be corrupted.');
      console.error('PDF load error:', err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const applyWatermark = async () => {
    if (!pdfDoc || !uploadedFile) return;

    try {
      setIsWatermarking(true);
      setError(null);
      setWatermarkedFile(null);
      startProcessing();

      // Step 1: Validate PDF
      completeStep('validate');
      
      // Step 2: Load PDF
      completeStep('load-pdf');

      // Step 3: Apply watermark
      completeStep('apply-watermark');

      // Create a copy of the PDF
      const watermarkedPdf = await PDFDocument.load(await uploadedFile.arrayBuffer());
      const pages = watermarkedPdf.getPages();

      // Parse color
      const color = watermarkSettings.color.startsWith('#') 
        ? watermarkSettings.color.slice(1) 
        : watermarkSettings.color;
      const r = parseInt(color.slice(0, 2), 16) / 255;
      const g = parseInt(color.slice(2, 4), 16) / 255;
      const b = parseInt(color.slice(4, 6), 16) / 255;

      // Apply watermark to each page
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Calculate position based on settings
        let x, y;
        switch (watermarkSettings.position) {
          case 'center':
            x = width / 2;
            y = height / 2;
            break;
          case 'top-left':
            x = 50;
            y = height - 50;
            break;
          case 'top-right':
            x = width - 50;
            y = height - 50;
            break;
          case 'bottom-left':
            x = 50;
            y = 50;
            break;
          case 'bottom-right':
            x = width - 50;
            y = 50;
            break;
          case 'diagonal':
            x = width / 2;
            y = height / 2;
            break;
          default:
            x = width / 2;
            y = height / 2;
        }

        // Draw watermark text
        page.drawText(watermarkSettings.text, {
          x,
          y,
          size: watermarkSettings.fontSize,
          color: rgb(r, g, b),
          opacity: watermarkSettings.opacity,
          rotate: { type: 'degrees', angle: watermarkSettings.rotation },
        });
      }

      // Step 4: Optimize PDF
      completeStep('optimize');

      const watermarkedBytes = await watermarkedPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setWatermarkedFile(watermarkedBytes);

      // Step 5: Finalize
      completeStep('finalize');

    } catch (err) {
      setError('Failed to apply watermark. Please try again.');
      console.error('Watermark application error:', err);
      setStepError('apply-watermark', 'Watermark application failed');
    }
  };

  const downloadWatermarkedPDF = () => {
    if (!watermarkedFile) return;
    
    const blob = new Blob([watermarkedFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watermarked-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setWatermarkedFile(null);
    setError(null);
    resetProgress();
    if (onReset) onReset();
  };

  const updateWatermarkSetting = (key: keyof WatermarkSettings, value: any) => {
    setWatermarkSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (watermarkedFile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Watermark Applied Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your PDF has been watermarked
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Watermark Another
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Droplets className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  watermarked-document.pdf
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(watermarkedFile.length)} • {totalPages} pages • Watermarked
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={downloadWatermarkedPDF}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Watermarked PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uploadedFile && pdfDoc) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Droplets className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDF Watermark
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Add text watermarks to your PDF
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Reset
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {uploadedFile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(uploadedFile.size)} • {totalPages} pages
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkSettings.text}
                onChange={(e) => updateWatermarkSetting('text', e.target.value)}
                placeholder="Enter watermark text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {watermarkSettings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="120"
                value={watermarkSettings.fontSize}
                onChange={(e) => updateWatermarkSetting('fontSize', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opacity: {Math.round(watermarkSettings.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={watermarkSettings.opacity}
                onChange={(e) => updateWatermarkSetting('opacity', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={watermarkSettings.color}
                onChange={(e) => updateWatermarkSetting('color', e.target.value)}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position
              </label>
              <select
                value={watermarkSettings.position}
                onChange={(e) => updateWatermarkSetting('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="center">Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="diagonal">Diagonal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rotation: {watermarkSettings.rotation}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={watermarkSettings.rotation}
                onChange={(e) => updateWatermarkSetting('rotation', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={applyWatermark}
              disabled={isWatermarking}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isWatermarking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Droplets className="w-5 h-5" />
              )}
              <span>
                {isWatermarking ? 'Applying Watermark...' : 'Apply Watermark'}
              </span>
            </button>
          </div>

          {isProcessing && (
            <div className="mt-6">
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      step.status === 'completed' 
                        ? 'bg-green-500' 
                        : step.status === 'active' 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                      {step.status === 'active' && <Loader2 className="w-3 h-3 text-white animate-spin" />}
                    </div>
                    <span className={`text-sm ${
                      step.status === 'completed' 
                        ? 'text-green-600 dark:text-green-400' 
                        : step.status === 'active' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <Droplets className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PDF Watermark
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add text watermarks to your PDF documents with customizable styling
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {isDragActive
              ? 'Drop the PDF file here...'
              : 'Drag & drop a PDF file here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Maximum file size: 50MB
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Upload PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select your PDF file to watermark
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Droplets className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Customize Watermark
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set text, color, and position
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Download Watermarked PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get your watermarked PDF file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
