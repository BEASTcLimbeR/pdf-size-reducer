'use client';

import { useState } from 'react';
import { FileText, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import PDFUploader from '@/components/PDFUploader';
import CompressionResults from '@/components/CompressionResults';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Uint8Array | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError(null);
    setCompressedFile(null);
    setCompressionStats(null);
  };

  const handleCompression = async (compressedData: Uint8Array, stats: any) => {
    setCompressedFile(compressedData);
    setCompressionStats(stats);
    setIsCompressing(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsCompressing(false);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setCompressedFile(null);
    setCompressionStats(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                PDF Size Reducer
              </h1>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Free • Secure • Fast
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Reduce PDF File Size
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Compress your PDF files quickly and securely. Reduce file size while maintaining quality.
            No registration required.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your files are processed locally in your browser. We never store your documents.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-fit mx-auto mb-4">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Easy to Use</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simply drag and drop your PDF file or click to browse. No complex settings needed.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-fit mx-auto mb-4">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Download</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get your compressed PDF immediately. No waiting, no watermarks, no limits.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!uploadedFile ? (
          <PDFUploader onFileUpload={handleFileUpload} />
        ) : (
          <CompressionResults
            file={uploadedFile}
            onCompression={handleCompression}
            onError={handleError}
            onReset={resetUpload}
            isCompressing={isCompressing}
            setIsCompressing={setIsCompressing}
            compressedFile={compressedFile}
            compressionStats={compressionStats}
            error={error}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              © 2024 PDF Size Reducer. Built with Next.js and Tailwind CSS.
            </p>
            <p className="text-sm">
              Your privacy is protected - all processing happens in your browser.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
