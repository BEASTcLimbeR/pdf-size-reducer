'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Hash, Edit, Save } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useProgress } from '@/hooks/useProgress';

interface PDFMetadataProps {
  onReset?: () => void;
}

interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  keywords: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  fileSize: number;
}

export default function PDFMetadata({ onReset }: PDFMetadataProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [editableMetadata, setEditableMetadata] = useState<Partial<PDFMetadata>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFile, setSavedFile] = useState<Uint8Array | null>(null);
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
      { id: 'extract-metadata', label: 'Extracting metadata', estimatedTime: 2 },
      { id: 'save-changes', label: 'Saving changes', estimatedTime: 3 },
      { id: 'finalize', label: 'Finalizing output', estimatedTime: 1 }
    ],
    onComplete: () => {
      setIsSaving(false);
    },
    onError: (err) => {
      setError(err);
      setIsSaving(false);
    },
    onCancel: async () => {
      setIsSaving(false);
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

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
      
      // Load PDF to extract metadata
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdf);
      
      // Extract metadata
      const pdfMetadata = pdf.getSubject() || '';
      const title = pdf.getTitle() || '';
      const author = pdf.getAuthor() || '';
      const creator = pdf.getCreator() || '';
      const producer = pdf.getProducer() || '';
      const keywords = pdf.getKeywords() || '';
      const creationDate = pdf.getCreationDate();
      const modificationDate = pdf.getModificationDate();
      
      const extractedMetadata: PDFMetadata = {
        title: title || 'Untitled',
        author: author || 'Unknown',
        subject: pdfMetadata || '',
        creator: creator || 'Unknown',
        producer: producer || 'Unknown',
        keywords: keywords || '',
        creationDate: creationDate ? formatDate(creationDate) : 'Unknown',
        modificationDate: modificationDate ? formatDate(modificationDate) : 'Unknown',
        pageCount: pdf.getPageCount(),
        fileSize: file.size
      };
      
      setMetadata(extractedMetadata);
      setEditableMetadata(extractedMetadata);
      
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

  const saveMetadata = async () => {
    if (!pdfDoc || !uploadedFile) return;

    try {
      setIsSaving(true);
      setError(null);
      setSavedFile(null);
      startProcessing();

      // Step 1: Validate PDF
      completeStep('validate');
      
      // Step 2: Load PDF
      completeStep('load-pdf');

      // Step 3: Extract metadata
      completeStep('extract-metadata');

      // Step 4: Save changes
      completeStep('save-changes');

      // Create a copy of the PDF with updated metadata
      const updatedPdf = await PDFDocument.load(await uploadedFile.arrayBuffer());
      
      // Update metadata
      if (editableMetadata.title) {
        updatedPdf.setTitle(editableMetadata.title);
      }
      if (editableMetadata.author) {
        updatedPdf.setAuthor(editableMetadata.author);
      }
      if (editableMetadata.subject) {
        updatedPdf.setSubject(editableMetadata.subject);
      }
      if (editableMetadata.creator) {
        updatedPdf.setCreator(editableMetadata.creator);
      }
      if (editableMetadata.producer) {
        updatedPdf.setProducer(editableMetadata.producer);
      }
      if (editableMetadata.keywords) {
        updatedPdf.setKeywords(editableMetadata.keywords);
      }

      const savedBytes = await updatedPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setSavedFile(savedBytes);

      // Step 5: Finalize
      completeStep('finalize');

      setIsEditing(false);

    } catch (err) {
      setError('Failed to save metadata changes. Please try again.');
      console.error('Metadata save error:', err);
      setStepError('save-changes', 'Failed to save changes');
    }
  };

  const downloadUpdatedPDF = () => {
    if (!savedFile) return;
    
    const blob = new Blob([savedFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated-metadata.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setMetadata(null);
    setEditableMetadata({});
    setSavedFile(null);
    setError(null);
    setIsEditing(false);
    resetProgress();
    if (onReset) onReset();
  };

  const updateEditableMetadata = (key: keyof PDFMetadata, value: string) => {
    setEditableMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (savedFile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Metadata Updated Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your PDF metadata has been updated
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Edit Another
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Hash className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  updated-metadata.pdf
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(savedFile.length)} • {metadata?.pageCount} pages • Updated
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={downloadUpdatedPDF}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Updated PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uploadedFile && pdfDoc && metadata) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Hash className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDF Metadata
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  View and edit PDF document information
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveMetadata}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
              <button
                onClick={resetUpload}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2 inline" />
                Reset
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {uploadedFile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(uploadedFile.size)} • {metadata.pageCount} pages
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.title || ''}
                  onChange={(e) => updateEditableMetadata('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Author
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.author || ''}
                  onChange={(e) => updateEditableMetadata('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.author}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.subject || ''}
                  onChange={(e) => updateEditableMetadata('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.subject || 'No subject'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creator
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.creator || ''}
                  onChange={(e) => updateEditableMetadata('creator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.creator}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Producer
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.producer || ''}
                  onChange={(e) => updateEditableMetadata('producer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.producer}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keywords
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editableMetadata.keywords || ''}
                  onChange={(e) => updateEditableMetadata('keywords', e.target.value)}
                  placeholder="Enter keywords separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">{metadata.keywords || 'No keywords'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creation Date
              </label>
              <p className="text-gray-900 dark:text-white py-2">{metadata.creationDate}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modification Date
              </label>
              <p className="text-gray-900 dark:text-white py-2">{metadata.modificationDate}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

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
          <Hash className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PDF Metadata
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and edit PDF document information and properties
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
              Select your PDF file to view metadata
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Hash className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              View & Edit
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Inspect and modify document properties
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Download Updated PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get your PDF with updated metadata
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
