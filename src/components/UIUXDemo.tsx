'use client';

import { useState } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, Presentation, Archive, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import UniversalFileDropZone from './UniversalFileDropZone';
import EnhancedProgressBar from './EnhancedProgressBar';
import EnhancedFileUploader from './EnhancedFileUploader';

export default function UIUXDemo() {
  const [demoFiles, setDemoFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([
    { id: 'validate', label: 'Validating files', status: 'pending' as const, estimatedTime: 2 },
    { id: 'process', label: 'Processing files', status: 'pending' as const, estimatedTime: 4 },
    { id: 'optimize', label: 'Optimizing output', status: 'pending' as const, estimatedTime: 3 },
    { id: 'complete', label: 'Processing complete', status: 'pending' as const, estimatedTime: 1 }
  ]);

  const handleFilesAccepted = (files: File[]) => {
    setDemoFiles(files);
    console.log('Files accepted:', files);
  };

  const handleError = (error: string) => {
    console.error('Error:', error);
  };

  const startProcessing = () => {
    setIsProcessing(true);
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    
    // Simulate processing
    let currentStep = 0;
    const processStep = () => {
      if (currentStep < processingSteps.length) {
        setProcessingSteps(prev => prev.map((step, index) => 
          index === currentStep 
            ? { ...step, status: 'active', startTime: Date.now() }
            : step
        ));
        
        setTimeout(() => {
          setProcessingSteps(prev => prev.map((step, index) => 
            index === currentStep 
              ? { ...step, status: 'completed', endTime: Date.now() }
              : step
          ));
          currentStep++;
          processStep();
        }, processingSteps[currentStep].estimatedTime * 1000);
      } else {
        setIsProcessing(false);
      }
    };
    
    processStep();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 Modern UI/UX Features Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Experience the enhanced drag-and-drop functionality and progress tracking
        </p>
      </div>

      {/* Universal File Drop Zone Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Universal File Drop Zone
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Drag and drop files with visual feedback, file type validation, and preview
        </p>
        
        <UniversalFileDropZone
          accept={{
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'text/csv': ['.csv']
          }}
          maxSize={50 * 1024 * 1024}
          maxFiles={3}
          onFilesAccepted={handleFilesAccepted}
          onError={handleError}
          title="Drop your files here"
          description="Supports PDF, images, and CSV files"
          showPreview={true}
          showFileTypes={true}
          variant="card"
        />
      </div>

      {/* Enhanced Progress Bar Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Enhanced Progress Bar
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Real-time progress tracking with time estimates and step-by-step visualization
        </p>
        
        <div className="space-y-4">
          <button
            onClick={startProcessing}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Start Demo Processing'}
          </button>
          
          {isProcessing && (
            <EnhancedProgressBar
              steps={processingSteps}
              currentStepIndex={processingSteps.findIndex(step => step.status === 'active')}
              isProcessing={isProcessing}
              showTimeEstimate={true}
              showCancelButton={true}
              variant="detailed"
            />
          )}
        </div>
      </div>

      {/* Enhanced File Uploader Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Enhanced File Uploader
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Multi-file type support with processing steps and progress tracking
        </p>
        
        <EnhancedFileUploader
          acceptedFileTypes={['pdf', 'image', 'spreadsheet']}
          maxFiles={5}
          onFilesAccepted={handleFilesAccepted}
          onError={handleError}
          title="Upload multiple file types"
          description="Supports PDF, images, and spreadsheets"
          showPreview={true}
          showFileTypes={true}
          variant="card"
          processingSteps={[
            { id: 'validate', label: 'Validating files', estimatedTime: 2 },
            { id: 'convert', label: 'Converting files', estimatedTime: 5 },
            { id: 'optimize', label: 'Optimizing output', estimatedTime: 3 }
          ]}
        />
      </div>

      {/* Progress Bar Variants Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Progress Bar Variants
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Different progress bar styles for different use cases
        </p>
        
        <div className="space-y-6">
          {/* Minimal Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Minimal</h3>
            <EnhancedProgressBar
              steps={processingSteps}
              currentStepIndex={1}
              isProcessing={false}
              variant="minimal"
              size="sm"
            />
          </div>
          
          {/* Default Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Default</h3>
            <EnhancedProgressBar
              steps={processingSteps}
              currentStepIndex={2}
              isProcessing={false}
              variant="default"
              size="md"
            />
          </div>
          
          {/* Detailed Variant */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Detailed</h3>
            <EnhancedProgressBar
              steps={processingSteps}
              currentStepIndex={0}
              isProcessing={false}
              variant="detailed"
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* File Type Support Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Supported File Types
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Comprehensive file type support with visual indicators
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: FileText, name: 'PDF', color: 'text-red-500', extensions: '.pdf' },
            { icon: Image, name: 'Images', color: 'text-green-500', extensions: '.jpg, .png' },
            { icon: FileSpreadsheet, name: 'Spreadsheets', color: 'text-green-600', extensions: '.xlsx, .csv' },
            { icon: Presentation, name: 'Presentations', color: 'text-orange-500', extensions: '.pptx' },
            { icon: Archive, name: 'Archives', color: 'text-purple-500', extensions: '.zip, .rar' }
          ].map((type, index) => {
            const IconComponent = type.icon;
            return (
              <div key={index} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <IconComponent className={`h-8 w-8 ${type.color} mb-2`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{type.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{type.extensions}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✨ Enhanced Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Drag & Drop</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Visual feedback on drag enter/leave</li>
              <li>• File type validation</li>
              <li>• File size limits</li>
              <li>• Multiple file support</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Progress Tracking</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Real-time progress updates</li>
              <li>• Time estimates</li>
              <li>• Step-by-step visualization</li>
              <li>• Error handling</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Visual Feedback</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Smooth animations</li>
              <li>• Color-coded file types</li>
              <li>• Loading states</li>
              <li>• Success/error indicators</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">User Experience</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Intuitive interface</li>
              <li>• Clear instructions</li>
              <li>• Responsive design</li>
              <li>• Accessibility support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
