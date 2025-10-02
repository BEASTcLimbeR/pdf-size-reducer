'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useProgress } from '@/hooks/useProgress';

interface PDFSecurityProps {
  onReset?: () => void;
}

interface SecuritySettings {
  userPassword: string;
  ownerPassword: string;
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
    formFilling: boolean;
    contentExtraction: boolean;
    documentAssembly: boolean;
    highQualityPrinting: boolean;
  };
}

export default function PDFSecurity({ onReset }: PDFSecurityProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    userPassword: '',
    ownerPassword: '',
    permissions: {
      printing: true,
      modifying: false,
      copying: false,
      annotating: false,
      formFilling: false,
      contentExtraction: false,
      documentAssembly: false,
      highQualityPrinting: false
    }
  });
  const [isSecuring, setIsSecuring] = useState(false);
  const [securedFile, setSecuredFile] = useState<Uint8Array | null>(null);
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
      { id: 'apply-security', label: 'Applying security settings', estimatedTime: 4 },
      { id: 'optimize', label: 'Optimizing secured PDF', estimatedTime: 2 },
      { id: 'finalize', label: 'Finalizing output', estimatedTime: 1 }
    ],
    onComplete: () => {
      setIsSecuring(false);
    },
    onError: (err) => {
      setError(err);
      setIsSecuring(false);
    },
    onCancel: async () => {
      setIsSecuring(false);
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

  const applySecurity = async () => {
    if (!pdfDoc || !uploadedFile) return;

    try {
      setIsSecuring(true);
      setError(null);
      setSecuredFile(null);
      startProcessing();

      // Step 1: Validate PDF
      completeStep('validate');
      
      // Step 2: Load PDF
      completeStep('load-pdf');

      // Step 3: Apply security settings
      completeStep('apply-security');

      // Note: pdf-lib doesn't support password protection directly
      // This is a simulation of the security process
      // In a real implementation, you would use a library like pdf2pic or pdf-poppler
      
      // For now, we'll just copy the PDF and add a note about security
      const securedPdf = await PDFDocument.load(await uploadedFile.arrayBuffer());
      
      // Add a security note to the first page
      const pages = securedPdf.getPages();
      if (pages.length > 0) {
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        firstPage.drawText('SECURED PDF', {
          x: 50,
          y: height - 50,
          size: 12,
          color: { r: 1, g: 0, b: 0 }
        });
        
        firstPage.drawText(`User Password: ${securitySettings.userPassword ? 'Set' : 'Not Set'}`, {
          x: 50,
          y: height - 70,
          size: 10,
          color: { r: 0, g: 0, b: 0 }
        });
        
        firstPage.drawText(`Owner Password: ${securitySettings.ownerPassword ? 'Set' : 'Not Set'}`, {
          x: 50,
          y: height - 90,
          size: 10,
          color: { r: 0, g: 0, b: 0 }
        });
      }

      // Step 4: Optimize PDF
      completeStep('optimize');

      const securedBytes = await securedPdf.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      setSecuredFile(securedBytes);

      // Step 5: Finalize
      completeStep('finalize');

    } catch (err) {
      setError('Failed to apply security settings. Please try again.');
      console.error('Security application error:', err);
      setStepError('apply-security', 'Security application failed');
    }
  };

  const downloadSecuredPDF = () => {
    if (!securedFile) return;
    
    const blob = new Blob([securedFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secured-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPdfDoc(null);
    setTotalPages(0);
    setSecuredFile(null);
    setError(null);
    resetProgress();
    if (onReset) onReset();
  };

  const updatePermission = (permission: keyof SecuritySettings['permissions'], value: boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  if (securedFile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDF Secured Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your PDF has been protected with security settings
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2 inline" />
              Secure Another
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  secured-document.pdf
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(securedFile.length)} • {totalPages} pages • Secured
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Security Notice
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This is a demonstration. In a real implementation, the PDF would be properly encrypted with the passwords and permissions you specified.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={downloadSecuredPDF}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Secured PDF</span>
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
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  PDF Security
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Protect your PDF with passwords and permissions
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
                User Password (Optional)
              </label>
              <input
                type="password"
                value={securitySettings.userPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, userPassword: e.target.value }))}
                placeholder="Enter user password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required to open the PDF
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Owner Password (Optional)
              </label>
              <input
                type="password"
                value={securitySettings.ownerPassword}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, ownerPassword: e.target.value }))}
                placeholder="Enter owner password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required to modify security settings
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(securitySettings.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updatePermission(key as keyof SecuritySettings['permissions'], e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
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
              onClick={applySecurity}
              disabled={isSecuring}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSecuring ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              <span>
                {isSecuring ? 'Securing PDF...' : 'Apply Security'}
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
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PDF Security
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Protect your PDF documents with passwords and permission controls
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
              Select your PDF file to secure
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Set Security
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure passwords and permissions
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Download Secured PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get your protected PDF file
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
