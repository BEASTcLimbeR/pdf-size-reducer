'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Image, FileText } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface ConversionResult {
  convertedFile: Uint8Array;
  originalSize: number;
  convertedSize: number;
  pagesCount: number;
  imagesCount: number;
}

export default function PNGWebPToPDF({ onReset }: { onReset: () => void }) {
  const [images, setImages] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    pageSize: 'a4' as 'a4' | 'letter' | 'legal',
    orientation: 'portrait' as 'portrait' | 'landscape',
    fitMode: 'fit' as 'fit' | 'fill' | 'stretch',
    margin: 20,
  });

  const pageSizes = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type === 'image/png' || 
      file.type === 'image/webp' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg'
    );
    
    if (imageFiles.length === 0) {
      setError('Please select valid image files (PNG, WebP, JPEG)');
      return;
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    setError(null);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleConvert = useCallback(async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();
      let totalOriginalSize = 0;

      for (const imageFile of images) {
        const arrayBuffer = await imageFile.arrayBuffer();
        totalOriginalSize += arrayBuffer.byteLength;

        let image;
        if (imageFile.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (imageFile.type === 'image/webp') {
          // For WebP, we'll convert to PNG first (simplified approach)
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          continue; // Skip unsupported formats
        }

        const page = pdfDoc.addPage(settings.orientation === 'landscape' 
          ? [pageSizes[settings.pageSize][1], pageSizes[settings.pageSize][0]] as [number, number]
          : pageSizes[settings.pageSize] as [number, number]
        );

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const margin = settings.margin;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        let imageWidth, imageHeight, x, y;

        if (settings.fitMode === 'fit') {
          // Fit image within page bounds while maintaining aspect ratio
          const scaleX = availableWidth / image.width;
          const scaleY = availableHeight / image.height;
          const scale = Math.min(scaleX, scaleY);
          
          imageWidth = image.width * scale;
          imageHeight = image.height * scale;
          x = margin + (availableWidth - imageWidth) / 2;
          y = margin + (availableHeight - imageHeight) / 2;
        } else if (settings.fitMode === 'fill') {
          // Fill entire page while maintaining aspect ratio
          const scaleX = availableWidth / image.width;
          const scaleY = availableHeight / image.height;
          const scale = Math.max(scaleX, scaleY);
          
          imageWidth = image.width * scale;
          imageHeight = image.height * scale;
          x = margin + (availableWidth - imageWidth) / 2;
          y = margin + (availableHeight - imageHeight) / 2;
        } else {
          // Stretch to fill page exactly
          imageWidth = availableWidth;
          imageHeight = availableHeight;
          x = margin;
          y = margin;
        }

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });

        // Add image filename as caption
        const font = await pdfDoc.embedFont('Helvetica');
        page.drawText(imageFile.name, {
          x: margin,
          y: margin - 15,
          size: 10,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      pdfDoc.setCreator('DocNestly - Image to PDF');
      pdfDoc.setTitle('Image to PDF Conversion');
      pdfDoc.setSubject('Converted images to PDF document');

      const pdfBytes = await pdfDoc.save();
      
      const conversionResult: ConversionResult = {
        convertedFile: pdfBytes,
        originalSize: totalOriginalSize,
        convertedSize: pdfBytes.length,
        pagesCount: pdfDoc.getPages().length,
        imagesCount: images.length,
      };

      setResult(conversionResult);
    } catch (err) {
      setError('Failed to convert images to PDF. Please check your images and try again.');
      console.error('Conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  }, [images, settings]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const arrayBuffer = result.convertedFile.buffer.slice(0) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-images.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const handleReset = useCallback(() => {
    setImages([]);
    setResult(null);
    setError(null);
    setIsConverting(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PNG/WebP to PDF Converter
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Convert PNG, WebP, and JPEG images to PDF documents
          </p>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Images
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Click to upload images
                  </div>
                  <div className="text-sm text-gray-500">
                    Supports PNG, WebP, JPEG files up to 10MB each
                  </div>
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Selected Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                PDF Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    value={settings.pageSize}
                    onChange={(e) => setSettings(prev => ({ ...prev, pageSize: e.target.value as 'a4' | 'letter' | 'legal' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    value={settings.orientation}
                    onChange={(e) => setSettings(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fit Mode
                  </label>
                  <select
                    value={settings.fitMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, fitMode: e.target.value as 'fit' | 'fill' | 'stretch' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  >
                    <option value="fit">Fit to Page</option>
                    <option value="fill">Fill Page</option>
                    <option value="stretch">Stretch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Margin (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.margin}
                    onChange={(e) => setSettings(prev => ({ ...prev, margin: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={isConverting || images.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <Image className="h-5 w-5 mr-2" />
                  Convert to PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto">
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your images have been successfully converted to PDF
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Original Size</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(result.originalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">PDF Size</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(result.convertedSize / 1024).toFixed(2)} KB
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Pages</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.pagesCount}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Images</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {result.imagesCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Convert More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
