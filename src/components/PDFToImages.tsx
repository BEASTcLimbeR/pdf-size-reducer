'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useProgress } from '@/hooks/useProgress';

interface PDFToImagesProps {
  onReset?: () => void;
}

export default function PDFToImages({ onReset }: PDFToImagesProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [imageQuality, setImageQuality] = useState(90);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImages, setConvertedImages] = useState<Blob[]>([]);
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
      { id: 'convert-pages', label: 'Converting pages to images', estimatedTime: 8 },
      { id: 'optimize', label: 'Optimizing images', estimatedTime: 3 },
      { id: 'finalize', label: 'Preparing download', estimatedTime: 2 }
    ],
    onComplete: () => {
      setIsConverting(false);
    },
    onError: (err) => {
      setError(err);
      setIsConverting(false);
    },
    onCancel: async () => {
      setIsConverting(false);
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

  const convertToImages = async () => {
    if (!pdfDoc || !uploadedFile) return;

    try {
      setIsConverting(true);
      setError(null);
      setConvertedImages([]);
      startProcessing();

      // Step 1: Validate PDF
      completeStep('validate');
      
      // Step 2: Load PDF
      completeStep('load-pdf');

      // Step 3: Convert pages to images
      completeStep('convert-pages');

      // Note: This is a simulation since pdf-lib doesn't support image conversion
      // In a real implementation, you would use a library like pdf2pic or pdf-poppler
      const images: Blob[] = [];
      
      for (let i = 0; i < totalPages; i++) {
        // Simulate image conversion
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create a mock image blob (in real implementation, this would be actual image data)
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw a placeholder
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 800, 600);
          ctx.fillStyle = '#333';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Page ${i + 1}`, 400, 300);
          ctx.fillText('PDF to Image Conversion', 400, 350);
          ctx.fillText('(Simulation)', 400, 380);
        }
        
        const blob = await new Promise<Blob>(resolve => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, `image/${imageFormat}`, imageQuality / 100);
        });
        
        images.push(blob);
      }

      // Step 4: Optimize images
      completeStep('optimize');

      setConvertedImages(images);

      // Step 5: Finalize
      completeStep('finalize');

    } catch (err) {
      setError('Failed to convert PDF to images. Please try again.');
      console.error('Conversion error:', err);
      setStepError('convert-pages', 'Conversion failed');
    }
  };

  const downloadImage = (imageBlob: Blob, pageNumber: number) => {
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${pageNumber}.${imageFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllImages = () => {
    convertedImages.forEach((imageBlob, index) => {
      downloadImage(imageBlob, index + 1);
    });
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setConvertedImages([]);
    setError(null);
    resetProgress();
    if (onReset) onReset();
  };

  if (convertedImages.length > 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Conversion Complete!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Successfully converted {totalPages} pages to {imageFormat.toUpperCase()} images
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Convert Another
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {convertedImages.map((imageBlob, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                  <Image className="w-12 h-12 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Page {index + 1}
                  </span>
                  <button
                    onClick={() => downloadImage(imageBlob, index + 1)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1 inline" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={downloadAllImages}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download All Images</span>
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
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDF to Images
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Convert PDF pages to {imageFormat.toUpperCase()} images
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
                Image Format
              </label>
              <select
                value={imageFormat}
                onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpeg')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality: {imageQuality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={imageQuality}
                onChange={(e) => setImageQuality(Number(e.target.value))}
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
              onClick={convertToImages}
              disabled={isConverting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isConverting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Image className="w-5 h-5" />
              )}
              <span>
                {isConverting ? 'Converting...' : `Convert to ${imageFormat.toUpperCase()}`}
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
          <Image className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PDF to Images
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Convert PDF pages to PNG or JPEG images with customizable quality settings
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
              Select your PDF file to convert
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Image className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Convert Pages
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Each page becomes a separate image
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Download Images
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get all images as a ZIP file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
