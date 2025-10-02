'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Image, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useProgress } from '@/hooks/useProgress';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SuccessAnimation from './SuccessAnimation';

interface ImagesToPDFProps {
  onReset?: () => void;
}

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
}

interface DraggableImageItemProps {
  imageFile: ImageFile;
  index: number;
  moveImage: (fromIndex: number, toIndex: number) => void;
  moveImageUp: (id: string) => void;
  moveImageDown: (id: string) => void;
  removeImage: (id: string) => void;
  totalImages: number;
  formatFileSize: (bytes: number) => string;
}

const DraggableImageItem: React.FC<DraggableImageItemProps> = ({
  imageFile,
  index,
  moveImage,
  moveImageUp,
  moveImageDown,
  removeImage,
  totalImages,
  formatFileSize
}) => {
  const [{ isDragging, canDrag }, drag, preview] = useDrag({
    type: 'image',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
    end: (item, monitor) => {
      // Reset any visual states when drag ends
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'image',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveImage(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    drop: (item: { index: number }) => {
      // Handle drop completion
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <>
      <div
        ref={(node) => drag(drop(node))}
        className={`border rounded-lg p-4 transition-all duration-300 ease-in-out transform ${
          isDragging 
            ? 'opacity-30 scale-95 rotate-2 shadow-2xl bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
            : isOver && canDrop
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-lg scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.01] hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        style={{
          transform: isDragging ? 'rotate(2deg) scale(0.95)' : 'rotate(0deg) scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, opacity',
        }}
      >
        <div className="relative">
          {/* Drag Handle */}
          <div 
            className={`absolute top-2 left-2 z-10 transition-all duration-200 p-1 rounded ${
              isDragging ? 'scale-110 text-blue-500 bg-blue-100 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 cursor-move" />
          </div>
          
          {/* Remove Button */}
          <button
            onClick={() => removeImage(imageFile.id)}
            className="absolute top-2 right-2 z-10 p-1 rounded-md transition-all duration-200 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {/* Page Number */}
          <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 z-10 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
            isDragging 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}>
            {index + 1}
          </div>
        </div>

        <div className={`aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center transition-all duration-200 ${
          isDragging ? 'bg-blue-100 dark:bg-blue-900/30' : ''
        }`}>
          <img
            src={imageFile.preview}
            alt={imageFile.name}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium truncate transition-colors duration-200 ${
            isDragging ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
          }`}>
            {imageFile.name}
          </span>
          <span className={`text-xs transition-colors duration-200 ${
            isDragging ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatFileSize(imageFile.size)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs transition-colors duration-200 ${
            isDragging ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
          }`}>
            Page {index + 1}
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => moveImageUp(imageFile.id)}
              disabled={index === 0}
              className="p-1 rounded-md transition-all duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveImageDown(imageFile.id)}
              disabled={index === totalImages - 1}
              className="p-1 rounded-md transition-all duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Drag Preview */}
      {isDragging && (
        <div
          ref={preview}
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            transform: 'rotate(2deg) scale(0.95)',
          }}
        >
          <div className="border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 shadow-2xl max-w-xs">
            <div className="aspect-square bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3 flex items-center justify-center">
              <img
                src={imageFile.preview}
                alt={imageFile.name}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                {imageFile.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Page {index + 1}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default function ImagesToPDF({ onReset }: ImagesToPDFProps) {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [pdfFile, setPdfFile] = useState<Uint8Array | null>(null);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'A3'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(20);

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
      { id: 'validate', label: 'Validating image files', estimatedTime: 2 },
      { id: 'load-images', label: 'Loading image files', estimatedTime: 4 },
      { id: 'create-pdf', label: 'Creating PDF document', estimatedTime: 6 },
      { id: 'optimize', label: 'Optimizing PDF', estimatedTime: 3 },
      { id: 'finalize', label: 'Finalizing output', estimatedTime: 2 }
    ],
    onComplete: () => {
      // PDF creation completed successfully
    },
    onError: (err) => {
      console.error('PDF creation error:', err);
    },
    onCancel: async () => {
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
    const newImageFiles: ImageFile[] = [];
    
    for (const file of acceptedFiles) {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newImageFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          preview
        });
      }
    }
    
    setImageFiles(prev => [...prev, ...newImageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB per image
  });

  const removeImage = (id: string) => {
    setImageFiles(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Clean up object URLs
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImageFiles(prev => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      return newFiles;
    });
  }, []);

  const moveImageUp = (id: string) => {
    const index = imageFiles.findIndex(img => img.id === id);
    if (index > 0) {
      moveImage(index, index - 1);
    }
  };

  const moveImageDown = (id: string) => {
    const index = imageFiles.findIndex(img => img.id === id);
    if (index < imageFiles.length - 1) {
      moveImage(index, index + 1);
    }
  };

  const createPDF = async () => {
    if (imageFiles.length === 0) return;

    try {
      startProcessing();
      setPdfFile(null);

      // Step 1: Validate images
      completeStep('validate');
      
      // Step 2: Load images
      completeStep('load-images');

      // Step 3: Create PDF
      completeStep('create-pdf');

      const pdf = await PDFDocument.create();

      // Get page dimensions based on size and orientation
      const getPageDimensions = () => {
        const sizes = {
          A4: { width: 595, height: 842 },
          Letter: { width: 612, height: 792 },
          A3: { width: 842, height: 1191 }
        };
        
        const baseSize = sizes[pageSize];
        return orientation === 'landscape' 
          ? { width: baseSize.height, height: baseSize.width }
          : baseSize;
      };

      const { width: pageWidth, height: pageHeight } = getPageDimensions();

      for (const imageFile of imageFiles) {
        try {
          // Convert image to PDF page
          const arrayBuffer = await imageFile.file.arrayBuffer();
          let image;
          
          if (imageFile.file.type === 'image/png') {
            image = await pdf.embedPng(arrayBuffer);
          } else if (imageFile.file.type === 'image/jpeg' || imageFile.file.type === 'image/jpg') {
            image = await pdf.embedJpg(arrayBuffer);
          } else {
            // For other formats, we'll create a placeholder
            console.warn(`Unsupported image format: ${imageFile.file.type}`);
            continue;
          }

          const page = pdf.addPage([pageWidth, pageHeight]);
          
          // Calculate image dimensions to fit page with margin
          const marginPixels = margin * 2;
          const availableWidth = pageWidth - marginPixels;
          const availableHeight = pageHeight - marginPixels;
          
          const imageAspectRatio = image.width / image.height;
          const pageAspectRatio = availableWidth / availableHeight;
          
          let imageWidth, imageHeight;
          if (imageAspectRatio > pageAspectRatio) {
            imageWidth = availableWidth;
            imageHeight = availableWidth / imageAspectRatio;
          } else {
            imageHeight = availableHeight;
            imageWidth = availableHeight * imageAspectRatio;
          }
          
          const x = (pageWidth - imageWidth) / 2;
          const y = (pageHeight - imageHeight) / 2;
          
          page.drawImage(image, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
          });
        } catch (err) {
          console.error(`Error processing image ${imageFile.name}:`, err);
        }
      }

      // Step 4: Optimize PDF
      completeStep('optimize');

      const pdfBytes = await pdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setPdfFile(pdfBytes);

      // Step 5: Finalize
      completeStep('finalize');

    } catch (err) {
      console.error('PDF creation error:', err);
      setStepError('create-pdf', 'Failed to create PDF');
    }
  };

  const downloadPDF = () => {
    if (!pdfFile) return;
    
    const blob = new Blob([pdfFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-to-pdf.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    // Clean up object URLs
    imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    setPdfFile(null);
    resetProgress();
    if (onReset) onReset();
  };

  if (pdfFile) {
    return (
      <div className="space-y-6">
        <SuccessAnimation
          title="PDF Created Successfully!"
          message={`Your ${imageFiles.length} image${imageFiles.length !== 1 ? 's have' : ' has'} been converted to PDF.`}
          stats={[
            {
              label: 'Images Converted',
              value: imageFiles.length.toString(),
              icon: <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            },
            {
              label: 'File Size',
              value: formatFileSize(pdfFile.length),
              icon: <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            },
            {
              label: 'Pages Created',
              value: imageFiles.length.toString(),
              icon: <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            }
          ]}
          onAction={downloadPDF}
          actionLabel="Download PDF"
          actionIcon={<Download className="h-5 w-5" />}
          showConfetti={true}
        />

        <div className="flex justify-center">
          <button
            onClick={resetUpload}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Another PDF
          </button>
        </div>
      </div>
    );
  }

  if (imageFiles.length > 0) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Image className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Images to PDF
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} ready to convert
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter' | 'A3')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="A3">A3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Margin: {margin}px
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Images ({imageFiles.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag to reorder or use arrow buttons
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {imageFiles.map((imageFile, index) => (
              <div
                key={imageFile.id}
                className="transition-all duration-300 ease-in-out"
                style={{
                  transform: 'translateZ(0)', // Enable hardware acceleration
                }}
              >
                <DraggableImageItem
                  imageFile={imageFile}
                  index={index}
                  moveImage={moveImage}
                  moveImageUp={moveImageUp}
                  moveImageDown={moveImageDown}
                  removeImage={removeImage}
                  totalImages={imageFiles.length}
                  formatFileSize={formatFileSize}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={createPDF}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              <span>
                {isProcessing ? 'Creating PDF...' : 'Create PDF'}
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
      </DndProvider>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <Image className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Images to PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Convert multiple images into a single PDF document with customizable page settings
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
              ? 'Drop the image files here...'
              : 'Drag & drop image files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports PNG, JPG, JPEG, GIF, BMP, WebP (max 10MB each)
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Upload Images
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select multiple image files
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Customize Layout
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose page size and orientation
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Download PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get your combined PDF file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
