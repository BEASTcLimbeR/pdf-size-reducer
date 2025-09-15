'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Download, CheckCircle, Menu, X, Zap, Shield, Edit, RotateCcw, Lock, Unlock, Merge, Split, Image, FileSpreadsheet, FileText as WordIcon, Presentation, Crop, Droplets, Hash, Scan, Eye, GitCompare, Trash2 } from 'lucide-react';
import PDFUploader from '@/components/PDFUploader';
import CompressionResults from '@/components/CompressionResults';
import MergePDF from '@/components/MergePDF';
import SplitPDF from '@/components/SplitPDF';
import RemovePages from '@/components/RemovePages';
import ExtractPages from '@/components/ExtractPages';
import RotatePDF from '@/components/RotatePDF';
import ToolCard from '@/components/ToolCard';

export default function Home() {
  const [activeTool, setActiveTool] = useState('home');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<Uint8Array | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError(null);
    setCompressedFile(null);
    setCompressionStats(null);
  };

  const handleCompression = async (compressedData: Uint8Array, stats: {
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
    pagesCount: number;
  }) => {
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

  const tools = [
    {
      id: 'organize',
      name: 'Organize PDF',
      icon: FileText,
      color: 'blue',
      tools: [
        { id: 'merge', name: 'Merge PDF', icon: Merge, description: 'Combine PDFs in the order you want' },
        { id: 'split', name: 'Split PDF', icon: Split, description: 'Separate pages into independent PDFs' },
        { id: 'remove-pages', name: 'Remove Pages', icon: Trash2, description: 'Delete unwanted pages from PDF' },
        { id: 'extract-pages', name: 'Extract Pages', icon: Download, description: 'Extract specific pages from PDF' },
        { id: 'organize', name: 'Organize PDF', icon: FileText, description: 'Sort and arrange PDF pages' },
        { id: 'scan', name: 'Scan to PDF', icon: Scan, description: 'Convert scans to PDF documents' }
      ]
    },
    {
      id: 'optimize',
      name: 'Optimize PDF',
      icon: Zap,
      color: 'green',
      tools: [
        { id: 'compress', name: 'Compress PDF', icon: FileText, description: 'Reduce file size while optimizing quality' },
        { id: 'repair', name: 'Repair PDF', icon: Shield, description: 'Fix damaged or corrupt PDF files' },
        { id: 'ocr', name: 'OCR PDF', icon: Eye, description: 'Convert scanned PDFs to searchable text' }
      ]
    },
    {
      id: 'convert',
      name: 'Convert PDF',
      icon: RotateCcw,
      color: 'purple',
      tools: [
        { id: 'pdf-to-word', name: 'PDF to Word', icon: WordIcon, description: 'Convert PDF to editable Word documents' },
        { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', icon: Presentation, description: 'Convert PDF to PowerPoint presentations' },
        { id: 'pdf-to-excel', name: 'PDF to Excel', icon: FileSpreadsheet, description: 'Convert PDF to Excel spreadsheets' },
        { id: 'pdf-to-jpg', name: 'PDF to JPG', icon: Image, description: 'Convert PDF pages to JPG images' },
        { id: 'word-to-pdf', name: 'Word to PDF', icon: WordIcon, description: 'Convert Word documents to PDF' },
        { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: Presentation, description: 'Convert PowerPoint to PDF' },
        { id: 'excel-to-pdf', name: 'Excel to PDF', icon: FileSpreadsheet, description: 'Convert Excel to PDF' },
        { id: 'jpg-to-pdf', name: 'JPG to PDF', icon: Image, description: 'Convert JPG images to PDF' },
        { id: 'html-to-pdf', name: 'HTML to PDF', icon: FileText, description: 'Convert web pages to PDF' }
      ]
    },
    {
      id: 'edit',
      name: 'Edit PDF',
      icon: Edit,
      color: 'orange',
      tools: [
        { id: 'rotate', name: 'Rotate PDF', icon: RotateCcw, description: 'Rotate PDF pages as needed' },
        { id: 'watermark', name: 'Add Watermark', icon: Droplets, description: 'Add text or image watermarks' },
        { id: 'crop', name: 'Crop PDF', icon: Crop, description: 'Crop margins or specific areas' },
        { id: 'page-numbers', name: 'Add Page Numbers', icon: Hash, description: 'Add page numbers to PDF' },
        { id: 'edit-pdf', name: 'Edit PDF', icon: Edit, description: 'Add text, images, and annotations' }
      ]
    },
    {
      id: 'security',
      name: 'PDF Security',
      icon: Shield,
      color: 'red',
      tools: [
        { id: 'protect', name: 'Protect PDF', icon: Lock, description: 'Add password protection to PDF' },
        { id: 'unlock', name: 'Unlock PDF', icon: Unlock, description: 'Remove password protection' },
        { id: 'sign', name: 'Sign PDF', icon: FileText, description: 'Add digital signatures' },
        { id: 'redact', name: 'Redact PDF', icon: Trash2, description: 'Permanently remove sensitive information' },
        { id: 'compare', name: 'Compare PDF', icon: GitCompare, description: 'Compare different PDF versions' }
      ]
    }
  ];

  const getToolById = (toolId: string) => {
    for (const category of tools) {
      const tool = category.tools.find(t => t.id === toolId);
      if (tool) return { ...tool, category: category.name };
    }
    return null;
  };

  const currentTool = getToolById(activeTool);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                PDF Toolkit Pro
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav ref={dropdownRef} className="hidden md:flex space-x-1">
              {tools.map((category, index) => (
                <div key={category.id} className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === category.id ? null : category.id)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeDropdown === category.id
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === category.id && (
                    <div className={`absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto ${
                      index >= tools.length - 2 ? 'right-0' : 'left-0'
                    }`}>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{category.name}</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {category.tools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setActiveTool(tool.id);
                                setActiveDropdown(null);
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-start p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
                            >
                              <tool.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="space-y-4">
                {tools.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <category.icon className="h-4 w-4 mr-2" />
                      {category.name}
                    </h3>
                    <div className="ml-6 space-y-1">
                      {category.tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTool(tool.id);
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                        >
                          {tool.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Show when no specific tool is selected */}
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf'].includes(activeTool) && (
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Every tool you need to work with PDFs in one place
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! 
              Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                100% Free
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                No Registration Required
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Secure & Private
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Works Offline
              </span>
            </div>
          </div>
        )}

        {/* Tool Header - Show when specific tool is selected */}
        {['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf'].includes(activeTool) && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentTool?.name || 'PDF Tools'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {currentTool?.description || 'Choose a tool from the menu above to get started'}
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                100% Free
              </span>
              <span className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-blue-500" />
                100% Secure
              </span>
              <span className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-purple-500" />
                No Registration
              </span>
            </div>
          </div>
        )}

        {/* Tool Categories - Show when no specific tool is selected */}
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf'].includes(activeTool) && (
          <div className="space-y-12">
            {/* Organize PDF */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-blue-600" />
                Organize PDF
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                  icon={Merge}
                  title="Merge PDF"
                  description="Combine PDFs in the order you want with the easiest PDF merger available."
                  status="available"
                  onClick={() => setActiveTool('merge')}
                />
                <ToolCard
                  icon={Split}
                  title="Split PDF"
                  description="Separate one page or a whole set for easy conversion into independent PDF files."
                  status="available"
                  onClick={() => setActiveTool('split')}
                />
                <ToolCard
                  icon={Trash2}
                  title="Remove Pages"
                  description="Delete unwanted pages from your PDF documents quickly and easily."
                  status="available"
                  onClick={() => setActiveTool('remove-pages')}
                />
                <ToolCard
                  icon={Download}
                  title="Extract Pages"
                  description="Extract specific pages from your PDF and save them as separate files."
                  status="available"
                  onClick={() => setActiveTool('extract-pages')}
                />
                <ToolCard
                  icon={FileText}
                  title="Organize PDF"
                  description="Sort and rearrange pages in your PDF documents however you like."
                  status="coming-soon"
                  onClick={() => setActiveTool('organize-pdf')}
                />
                <ToolCard
                  icon={Scan}
                  title="Scan to PDF"
                  description="Convert scanned documents and images into searchable PDF files."
                  status="coming-soon"
                  onClick={() => setActiveTool('scan-to-pdf')}
                />
              </div>
            </div>

            {/* Optimize PDF */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-green-600" />
                Optimize PDF
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                  icon={Zap}
                  title="Compress PDF"
                  description="Reduce file size while optimizing for maximal PDF quality."
                  status="available"
                  onClick={() => setActiveTool('compress')}
                />
                <ToolCard
                  icon={Shield}
                  title="Repair PDF"
                  description="Fix damaged PDF files and recover data from corrupt documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('repair-pdf')}
                />
                <ToolCard
                  icon={Eye}
                  title="OCR PDF"
                  description="Convert scanned PDFs into searchable and selectable documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('ocr-pdf')}
                />
              </div>
            </div>

            {/* Convert PDF */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-purple-600" />
                Convert PDF
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                  icon={WordIcon}
                  title="PDF to Word"
                  description="Convert PDF files into easy to edit DOC and DOCX documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('pdf-to-word')}
                />
                <ToolCard
                  icon={Presentation}
                  title="PDF to PowerPoint"
                  description="Turn PDF files into easy to edit PPT and PPTX slideshows."
                  status="coming-soon"
                  onClick={() => setActiveTool('pdf-to-powerpoint')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="PDF to Excel"
                  description="Extract data from PDFs into Excel spreadsheets in seconds."
                  status="coming-soon"
                  onClick={() => setActiveTool('pdf-to-excel')}
                />
                <ToolCard
                  icon={Image}
                  title="PDF to JPG"
                  description="Convert each PDF page into JPG images or extract all images."
                  status="coming-soon"
                  onClick={() => setActiveTool('pdf-to-jpg')}
                />
                <ToolCard
                  icon={WordIcon}
                  title="Word to PDF"
                  description="Convert DOC and DOCX files to PDF for easy viewing."
                  status="coming-soon"
                  onClick={() => setActiveTool('word-to-pdf')}
                />
                <ToolCard
                  icon={Presentation}
                  title="PowerPoint to PDF"
                  description="Convert PPT and PPTX slideshows to PDF format."
                  status="coming-soon"
                  onClick={() => setActiveTool('powerpoint-to-pdf')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Excel to PDF"
                  description="Convert Excel spreadsheets to PDF for easy sharing."
                  status="coming-soon"
                  onClick={() => setActiveTool('excel-to-pdf')}
                />
                <ToolCard
                  icon={Image}
                  title="JPG to PDF"
                  description="Convert JPG images to PDF in seconds with custom orientation."
                  status="coming-soon"
                  onClick={() => setActiveTool('jpg-to-pdf')}
                />
              </div>
            </div>

            {/* Edit PDF */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-orange-600" />
                Edit PDF
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                  icon={Edit}
                  title="Edit PDF"
                  description="Add text, images, shapes or annotations to PDF documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('edit-pdf')}
                />
                <ToolCard
                  icon={RotateCcw}
                  title="Rotate PDF"
                  description="Rotate PDFs the way you need them, even multiple PDFs at once."
                  status="available"
                  onClick={() => setActiveTool('rotate-pdf')}
                />
                <ToolCard
                  icon={Hash}
                  title="Add Page Numbers"
                  description="Add page numbers to PDFs with custom positions and styling."
                  status="coming-soon"
                  onClick={() => setActiveTool('add-page-numbers')}
                />
                <ToolCard
                  icon={Droplets}
                  title="Add Watermark"
                  description="Stamp images or text over your PDF with custom transparency."
                  status="coming-soon"
                  onClick={() => setActiveTool('add-watermark')}
                />
                <ToolCard
                  icon={Crop}
                  title="Crop PDF"
                  description="Crop margins or select specific areas in your PDF documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('crop-pdf')}
                />
              </div>
            </div>

            {/* PDF Security */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-red-600" />
                PDF Security
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                  icon={Unlock}
                  title="Unlock PDF"
                  description="Remove PDF password security and use your PDFs freely."
                  status="coming-soon"
                  onClick={() => setActiveTool('unlock-pdf')}
                />
                <ToolCard
                  icon={Lock}
                  title="Protect PDF"
                  description="Protect PDF files with passwords and encrypt documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('protect-pdf')}
                />
                <ToolCard
                  icon={Edit}
                  title="Sign PDF"
                  description="Sign yourself or request electronic signatures from others."
                  status="coming-soon"
                  onClick={() => setActiveTool('sign-pdf')}
                />
                <ToolCard
                  icon={Trash2}
                  title="Redact PDF"
                  description="Permanently remove sensitive information from PDF documents."
                  status="coming-soon"
                  onClick={() => setActiveTool('redact-pdf')}
                />
                <ToolCard
                  icon={GitCompare}
                  title="Compare PDF"
                  description="Show side-by-side comparison and spot changes between versions."
                  status="coming-soon"
                  onClick={() => setActiveTool('compare-pdf')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tool Content - Show when specific tool is selected */}
        {activeTool === 'compress' && (
          <>
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
          </>
        )}

        {/* Merge PDF Tool */}
        {activeTool === 'merge' && (
          <MergePDF onReset={() => setActiveTool('compress')} />
        )}

        {/* Split PDF Tool */}
        {activeTool === 'split' && (
          <SplitPDF onReset={() => setActiveTool('compress')} />
        )}

        {/* Remove Pages Tool */}
        {activeTool === 'remove-pages' && (
          <RemovePages onReset={() => setActiveTool('compress')} />
        )}

        {/* Extract Pages Tool */}
        {activeTool === 'extract-pages' && (
          <ExtractPages onReset={() => setActiveTool('compress')} />
        )}

        {/* Rotate PDF Tool */}
        {activeTool === 'rotate-pdf' && (
          <RotatePDF onReset={() => setActiveTool('compress')} />
        )}

        {/* Coming Soon Tool */}
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf'].includes(activeTool) && activeTool !== 'home' && (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {getToolById(activeTool)?.name} Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This tool is currently under development. We&apos;re working hard to bring you the best PDF experience.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTool('compress')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Compress PDF
                </button>
                <button
                  onClick={() => setActiveTool('merge')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Merge PDF
                </button>
                <button
                  onClick={() => setActiveTool('split')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Split PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              © 2024 PDF Toolkit Pro. Built with Next.js and Tailwind CSS.
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