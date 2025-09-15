'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Image, FileText, Trash2 } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ImageFile {
  file: File;
  id: string;
  preview: string;
}

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  totalSize: number;
  convertedSize: number;
  imagesProcessed: number;
  error?: string;
}

export default function JPGToPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'auto'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Validate image files
  const validateImageFiles = (files: File[]): { isValid: boolean; error?: string } => {
    if (files.length === 0) {
      return { isValid: false, error: 'No files selected' };
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      return { isValid: false, error: 'Please select only image files (JPG, PNG, GIF, BMP, WebP)' };
    }
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 100 * 1024 * 1024) { // 100MB limit
      return { isValid: false, error: 'Total file size must be less than 100MB' };
    }
    
    return { isValid: true };
  };

  // Convert images to PDF
  const convertImagesToPDF = useCallback(async (imageFiles: ImageFile[]): Promise<ConversionResult> => {
    const totalSize = imageFiles.reduce((sum, img) => sum + img.file.size, 0);

    try {
      setConversionProgress(10);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      setConversionProgress(20);

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        setConversionProgress(20 + (i / imageFiles.length) * 60);
        
        try {
          // Read the image file
          const imageBytes = await imageFile.file.arrayBuffer();
          
          // Embed the image in the PDF
          let embeddedImage;
          if (imageFile.file.type === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }
          
          // Get image dimensions
          const { width: imgWidth, height: imgHeight } = embeddedImage;
          
          // Calculate page dimensions
          let pageWidth, pageHeight;
          if (pageSize === 'auto') {
            // Use image dimensions
            pageWidth = imgWidth;
            pageHeight = imgHeight;
          } else {
            // Use standard page sizes
            const dimensions = {
              a4: { width: 595, height: 842 },
              letter: { width: 612, height: 792 }
            };
            
            if (orientation === 'landscape') {
              pageWidth = dimensions[pageSize].height;
              pageHeight = dimensions[pageSize].width;
            } else {
              pageWidth = dimensions[pageSize].width;
              pageHeight = dimensions[pageSize].height;
            }
          }
          
          // Create a new page
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          
          // Calculate scaling to fit image on page
          const scaleX = pageWidth / imgWidth;
          const scaleY = pageHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          
          // Center the image on the page
          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2;
          
          // Draw the image
          page.drawImage(embeddedImage, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          });
          
        } catch (imageError) {
          console.error(`Error processing image ${i + 1}:`, imageError);
          // Continue with other images
        }
      }

      setConversionProgress(85);

      // Generate the PDF
      const pdfBytes = await pdfDoc.save();
      const convertedSize = pdfBytes.length;

      setConversionProgress(100);

      return {
        success: true,
        convertedFile: pdfBytes,
        totalSize,
        convertedSize,
        imagesProcessed: imageFiles.length
      };

    } catch (error) {
      console.error('Images to PDF conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        totalSize,
        convertedSize: 0,
        imagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [pageSize, orientation]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    const validation = validateImageFiles(files);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid files');
      return;
    }

    // Create image file objects with previews
    const imageFiles: ImageFile[] = await Promise.all(
      files.map(async (file) => {
        const preview = URL.createObjectURL(file);
        return {
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview
        };
      })
    );

    setUploadedFiles(imageFiles);
    setError(null);
    setConversionResult(null);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  }, [handleFileUpload]);

  // Remove image
  const removeImage = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Reorder images
  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  }, []);

  // Start conversion
  const startConversion = useCallback(async () => {
    if (uploadedFiles.length === 0) return;

    setIsConverting(true);
    setConversionProgress(0);

    try {
      const result = await convertImagesToPDF(uploadedFiles);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [uploadedFiles, convertImagesToPDF]);

  // Download converted PDF
  const downloadConvertedPDF = useCallback(() => {
    if (conversionResult?.convertedFile) {
      const arrayBuffer = conversionResult.convertedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_images.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [conversionResult]);

  // Reset function
  const reset = useCallback(() => {
    // Clean up preview URLs
    uploadedFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedFiles([]);
    setConversionResult(null);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
  }, [uploadedFiles]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            JPG to PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert JPG images to PDF in seconds with custom orientation
          </p>
        </div>

        {/* Conversion Options */}
        {uploadedFiles.length === 0 && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'auto')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="auto">Auto (Image Size)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation:
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {uploadedFiles.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your images here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose Images
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports JPG, PNG, GIF, BMP, WebP • Maximum 100MB total
            </p>
          </div>
        )}

        {/* Image Preview */}
        {uploadedFiles.length > 0 && !isConverting && !conversionResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Selected Images ({uploadedFiles.length})
              </h3>
              <button
                onClick={reset}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedFiles.map((imageFile, index) => (
                <div key={imageFile.id} className="relative group">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={imageFile.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeImage(imageFile.id)}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {imageFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(imageFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={startConversion}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Convert to PDF
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting Images to PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Processing images and creating PDF
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversionProgress}% complete
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Conversion Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {conversionResult && (
          <div className="space-y-6">
            {conversionResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your images have been successfully converted to PDF
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Total Images Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.totalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">PDF Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.convertedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Images Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.imagesProcessed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadConvertedPDF}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Convert More Images
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {conversionResult.error || 'Unable to convert the images to PDF'}
                </p>
                <button
                  onClick={reset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onReset}
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Tools
          </button>
        </div>
      </div>
    </div>
  );
}
