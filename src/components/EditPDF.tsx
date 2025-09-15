'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, Edit, Image, Type, Square, Circle } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

interface EditResult {
  success: boolean;
  editedFile: Uint8Array | null;
  originalSize: number;
  editedSize: number;
  pagesEdited: number;
  error?: string;
}

export default function EditPDF({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editType, setEditType] = useState<'text' | 'image' | 'shape'>('text');
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [textSize, setTextSize] = useState(12);
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle' | 'line'>('rectangle');
  const [shapeColor, setShapeColor] = useState('#000000');

  // Validate PDF file
  const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Please select a PDF file' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: false, error: 'PDF editing is currently in development. This is a demonstration of the interface.' };
  };

  // Edit PDF (simulated)
  const editPDF = useCallback(async (file: File): Promise<EditResult> => {
    const originalSize = file.size;

    try {
      setEditProgress(10);
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      setEditProgress(20);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      setEditProgress(30);

      // Simulate editing process
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < Math.min(pages.length, 3); i++) {
        setEditProgress(30 + (i / Math.min(pages.length, 3)) * 50);
        
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add text annotation
        if (editType === 'text' && textContent) {
          page.drawText(textContent, {
            x: 50,
            y: height - 100,
            size: textSize,
            color: rgb(
              parseInt(textColor.slice(1, 3), 16) / 255,
              parseInt(textColor.slice(3, 5), 16) / 255,
              parseInt(textColor.slice(5, 7), 16) / 255
            ),
          });
        }
        
        // Add shape annotation
        if (editType === 'shape') {
          const shapeColorRgb = rgb(
            parseInt(shapeColor.slice(1, 3), 16) / 255,
            parseInt(shapeColor.slice(3, 5), 16) / 255,
            parseInt(shapeColor.slice(5, 7), 16) / 255
          );
          
          if (shapeType === 'rectangle') {
            page.drawRectangle({
              x: 50,
              y: height - 150,
              width: 200,
              height: 100,
              borderColor: shapeColorRgb,
              borderWidth: 2,
            });
          } else if (shapeType === 'circle') {
            page.drawCircle({
              x: 150,
              y: height - 200,
              size: 50,
              borderColor: shapeColorRgb,
              borderWidth: 2,
            });
          } else if (shapeType === 'line') {
            page.drawLine({
              start: { x: 50, y: height - 250 },
              end: { x: 250, y: height - 250 },
              thickness: 3,
              color: shapeColorRgb,
            });
          }
        }
        
        // Add image placeholder (simulated)
        if (editType === 'image') {
          page.drawText('[IMAGE PLACEHOLDER]', {
            x: 50,
            y: height - 100,
            size: 12,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      setEditProgress(85);

      // Generate the edited PDF
      const pdfBytes = await pdfDoc.save();
      const editedSize = pdfBytes.length;

      setEditProgress(100);

      return {
        success: true,
        editedFile: pdfBytes,
        originalSize,
        editedSize,
        pagesEdited: Math.min(pages.length, 3)
      };

    } catch (error) {
      console.error('PDF editing failed:', error);
      return {
        success: false,
        editedFile: null,
        originalSize,
        editedSize: 0,
        pagesEdited: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [editType, textContent, textColor, textSize, shapeType, shapeColor]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setEditResult(null);
    setIsEditing(true);
    setEditProgress(0);

    try {
      const result = await editPDF(file);
      setEditResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Editing failed');
    } finally {
      setIsEditing(false);
    }
  }, [editPDF]);

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
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Download edited file
  const downloadEditedFile = useCallback(() => {
    if (editResult?.editedFile) {
      const arrayBuffer = editResult.editedFile.buffer.slice(0) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${uploadedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [editResult, uploadedFile]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setEditResult(null);
    setError(null);
    setIsEditing(false);
    setEditProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Edit PDF
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Add text, images, shapes or annotations to PDF documents
          </p>
        </div>

        {/* Edit Options */}
        {!uploadedFile && (
          <div className="mb-6 space-y-6">
            {/* Edit Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Edit Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => setEditType('text')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    editType === 'text'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
                  }`}
                >
                  <Type className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Add Text</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Insert text annotations</div>
                </button>
                <button
                  onClick={() => setEditType('image')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    editType === 'image'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
                  }`}
                >
                  <Image className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Add Image</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Insert images and graphics</div>
                </button>
                <button
                  onClick={() => setEditType('shape')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    editType === 'shape'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
                  }`}
                >
                  <Square className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Add Shapes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Draw rectangles, circles, lines</div>
                </button>
              </div>
            </div>

            {/* Text Options */}
            {editType === 'text' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Content:
                  </label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter text to add..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Color:
                  </label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size:
                  </label>
                  <input
                    type="number"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    min="8"
                    max="72"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Shape Options */}
            {editType === 'shape' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shape Type:
                  </label>
                  <select
                    value={shapeType}
                    onChange={(e) => setShapeType(e.target.value as 'rectangle' | 'circle' | 'line')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="line">Line</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shape Color:
                  </label>
                  <input
                    type="color"
                    value={shapeColor}
                    onChange={(e) => setShapeColor(e.target.value)}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Image Options */}
            {editType === 'image' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Image insertion is currently in development. In the full version, you would be able to:
                </p>
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                  <li>Upload and insert images</li>
                  <li>Resize and position images</li>
                  <li>Add image annotations</li>
                  <li>Apply image filters and effects</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your PDF here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
                  className="inline-flex items-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 cursor-pointer transition-colors touch-manipulation min-h-[44px]"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose PDF File
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Maximum file size: 50MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isEditing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Editing PDF...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Adding {editType} annotations to your document
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${editProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {editProgress}% complete
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
              Editing Failed
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
        {editResult && (
          <div className="space-y-6">
            {editResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Editing Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully edited with {editType} annotations
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(editResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Edited Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(editResult.editedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Edited:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {editResult.pagesEdited}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadEditedFile}
                    className="inline-flex items-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Edited PDF
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-4 sm:px-6 py-3 text-sm sm:text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Edit Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Editing Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {editResult.error || 'Unable to edit the PDF document'}
                </p>
                <button
                  onClick={reset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Another File
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
