'use client';

import { useState } from 'react';
import { FileText, Image, FileSpreadsheet, Presentation, Upload, Zap, CheckCircle } from 'lucide-react';
import EnhancedFileUploader from './EnhancedFileUploader';
import EnhancedPDFUploader from './EnhancedPDFUploader';
import { FileTypeDetector } from '@/utils/fileTypeDetector';

export default function UploadDemo() {
  const [selectedDemo, setSelectedDemo] = useState<'general' | 'pdf' | 'multi'>('general');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesUpload = (files: File[]) => {
    setUploadedFiles(files);
    console.log('Files uploaded:', files);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFiles([file]);
    console.log('File uploaded:', file);
  };

  const demos = [
    {
      id: 'general',
      title: 'General File Upload',
      description: 'Upload any supported file type with smart detection',
      icon: Upload,
      color: 'blue',
      component: (
        <EnhancedFileUploader
          onFilesUpload={handleFilesUpload}
          acceptedTypes={['.pdf', '.docx', '.xlsx', '.pptx', '.jpg', '.jpeg', '.png', '.txt']}
          maxFiles={5}
          maxSize={50}
          multiple={true}
          showPreview={true}
        />
      )
    },
    {
      id: 'pdf',
      title: 'PDF-Specific Upload',
      description: 'Enhanced PDF upload with preview and validation',
      icon: FileText,
      color: 'red',
      component: (
        <EnhancedPDFUploader
          onFileUpload={handleFileUpload}
          maxFiles={1}
          maxSize={100}
          showPreview={true}
          showFileInfo={true}
        />
      )
    },
    {
      id: 'multi',
      title: 'Multi-File Upload',
      description: 'Upload multiple files with batch processing',
      icon: Zap,
      color: 'green',
      component: (
        <EnhancedFileUploader
          onFilesUpload={handleFilesUpload}
          acceptedTypes={['.pdf', '.docx', '.xlsx', '.pptx', '.jpg', '.jpeg', '.png', '.txt', '.csv', '.rtf']}
          maxFiles={10}
          maxSize={25}
          multiple={true}
          showPreview={true}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Enhanced File Upload Experience
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the next generation of file upload with drag & drop, smart validation, 
            file previews, and intelligent suggestions.
          </p>
        </div>

        {/* Demo Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo.id as any)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedDemo === demo.id
                      ? `bg-${demo.color}-600 text-white shadow-lg`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{demo.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {demos.find(demo => demo.id === selectedDemo)?.component}
        </div>

        {/* Features Showcase */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Drag & Drop
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intuitive drag and drop interface with visual feedback and smooth animations.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Smart Validation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intelligent file type detection with real-time validation and helpful error messages.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              File Previews
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Instant file previews with thumbnails and detailed file information.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time upload progress with smooth animations and status indicators.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Multi-Format Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Support for PDF, Word, Excel, PowerPoint, images, and text files.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Batch Processing
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload and process multiple files simultaneously with queue management.
            </p>
          </div>
        </div>

        {/* Uploaded Files Summary */}
        {uploadedFiles.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Uploaded Files Summary
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => {
                const fileType = FileTypeDetector.detectFileType(file);
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-2xl">{fileType.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fileType.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${FileTypeDetector.getCategoryColor(fileType.category)}`}>
                      {fileType.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
