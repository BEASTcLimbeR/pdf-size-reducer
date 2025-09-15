'use client';

import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RotateCcw, CheckCircle, AlertCircle, Image, FileText, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

interface ScanToPDFProps {
  onReset?: () => void;
}

export default function ScanToPDF({ onReset }: ScanToPDFProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pdfFile, setPdfFile] = useState<Uint8Array | null>(null);
  const [pdfName, setPdfName] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setImages(prev => [...prev, ...imageFiles]);
    setError(null);
    setSuccess(false);
    setPdfFile(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.tiff']
    },
    multiple: true
  });

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const moveImageUp = (index: number) => {
    if (index > 0) {
      moveImage(index, index - 1);
    }
  };

  const moveImageDown = (index: number) => {
    if (index < images.length - 1) {
      moveImage(index, index + 1);
    }
  };

  const createPDFFromImages = async () => {
    if (images.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);

      const pdfDoc = await PDFDocument.create();

      for (const imageFile of images) {
        const arrayBuffer = await imageFile.file.arrayBuffer();
        let image;

        // Determine image type and embed accordingly
        if (imageFile.file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (imageFile.file.type === 'image/jpeg' || imageFile.file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          // For other formats, try to convert to PNG first
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new window.Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const pngArrayBuffer = await blob.arrayBuffer();
                  image = await pdfDoc.embedPng(pngArrayBuffer);
                  resolve(image);
                } else {
                  reject(new Error('Failed to convert image to PNG'));
                }
              }, 'image/png');
            };
            img.onerror = reject;
            img.src = imageFile.preview;
          });
        }

        // Create a new page with the image
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Calculate dimensions to fit the image while maintaining aspect ratio
        if (!image) continue;
        
        const imageWidth = image.width;
        const imageHeight = image.height;
        const aspectRatio = imageWidth / imageHeight;
        
        let finalWidth = width;
        let finalHeight = width / aspectRatio;
        
        if (finalHeight > height) {
          finalHeight = height;
          finalWidth = height * aspectRatio;
        }
        
        // Center the image on the page
        const x = (width - finalWidth) / 2;
        const y = (height - finalHeight) / 2;
        
        page.drawImage(image, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      setPdfFile(pdfBytes);
      setPdfName(`scanned_document_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess(true);
    } catch (err) {
      setError('Failed to create PDF from images. Please try again.');
      console.error('Error creating PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfFile) return;

    const blob = new Blob([pdfFile as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    // Clean up object URLs
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
    setError(null);
    setSuccess(false);
    setPdfFile(null);
    setPdfName('');
    if (onReset) onReset();
  };

  if (success && pdfFile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              PDF Successfully Created!
            </h3>
          </div>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Your images have been converted to a PDF document with {images.length} pages. You can now download the PDF.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadPDF}
              className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Create Another PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => onReset && onReset()}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tools
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Scan to PDF
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Upload multiple images and convert them into a single PDF document. Perfect for creating PDFs from scanned documents or photos.
        </p>
      </div>

      {images.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop images here' : 'Upload image files'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports JPG, PNG, GIF, BMP, WebP, and TIFF files
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Images List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Images ({images.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag to reorder or use arrow buttons
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.preview}
                      alt={`Preview of ${image.name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {(image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => moveImageUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveImageDown(index)}
                        disabled={index === images.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Images */}
            <div className="mt-4">
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click to add more images
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={createPDFFromImages}
              disabled={isProcessing || images.length === 0}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating PDF...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Create PDF ({images.length} images)
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2 inline" />
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
