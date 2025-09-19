'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Download, CheckCircle, Menu, X, Zap, Shield, Edit, RotateCcw, Lock, Unlock, Merge, Split, Image, FileSpreadsheet, Presentation, Crop, Droplets, Hash, Scan, Eye, GitCompare, Trash2, Globe, Type, Archive, FileStack, Brain, Network, Sparkles } from 'lucide-react';
import PDFUploader from '@/components/PDFUploader';
import CompressionResults from '@/components/CompressionResults';
import MergePDF from '@/components/MergePDF';
import SplitPDF from '@/components/SplitPDF';
import RemovePages from '@/components/RemovePages';
import ExtractPages from '@/components/ExtractPages';
import RotatePDF from '@/components/RotatePDF';
import OrganizePDF from '@/components/OrganizePDF';
import ScanToPDF from '@/components/ScanToPDF';
import RepairPDF from '@/components/RepairPDF';
import OCRPDF from '@/components/OCRPDF';
import PDFToWord from '@/components/PDFToWord';
import PDFToPowerPoint from '@/components/PDFToPowerPoint';
import PDFToExcel from '@/components/PDFToExcel';
import PDFToJPG from '@/components/PDFToJPG';
import WordToPDF from '@/components/WordToPDF';
import PowerPointToPDF from '@/components/PowerPointToPDF';
import ExcelToPDF from '@/components/ExcelToPDF';
import JPGToPDF from '@/components/JPGToPDF';
import EditPDF from '@/components/EditPDF';
import AddPageNumbers from '@/components/AddPageNumbers';
import AddWatermark from '@/components/AddWatermark';
import CropPDF from '@/components/CropPDF';
import UnlockPDF from '@/components/UnlockPDF';
import ProtectPDF from '@/components/ProtectPDF';
import SignPDF from '@/components/SignPDF';
import RedactPDF from '@/components/RedactPDF';
import ComparePDF from '@/components/ComparePDF';
import HTMLToPDF from '@/components/HTMLToPDF';
import CSVToPDF from '@/components/CSVToPDF';
import PNGWebPToPDF from '@/components/PNGWebPToPDF';
import TXTToPDF from '@/components/TXTToPDF';
import RTFToPDF from '@/components/RTFToPDF';
import BatchProcessing from '@/components/BatchProcessing';
import PDFForms from '@/components/PDFForms';
import WebhookSettings from '@/components/WebhookSettings';
import AIDocumentChat from '@/components/AIDocumentChat';
import AdobeStyleAIChat from '@/components/AdobeStyleAIChat';
import SmartDocumentRelationships from '@/components/SmartDocumentRelationships';
import PredictiveProcessing from '@/components/PredictiveProcessing';
import AdvancedSecurity from '@/components/AdvancedSecurity';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  const [dropdownAnimating, setDropdownAnimating] = useState(false);
  const [mobileMenuAnimating, setMobileMenuAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleDropdownClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animation handlers
  const handleDropdownOpen = (categoryId: string) => {
    if (activeDropdown === categoryId) {
      handleDropdownClose();
      return;
    }
    
    setDropdownAnimating(true);
    setActiveDropdown(categoryId);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setDropdownAnimating(false);
    }, 200);
  };

  const handleDropdownClose = () => {
    setDropdownAnimating(true);
    
    // Start exit animation
    setTimeout(() => {
      setActiveDropdown(null);
      setDropdownAnimating(false);
    }, 150);
  };

  const handleMobileMenuToggle = () => {
    if (mobileMenuOpen) {
      setMobileMenuAnimating(true);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setMobileMenuAnimating(false);
      }, 200);
    } else {
      setMobileMenuAnimating(true);
      setMobileMenuOpen(true);
      setTimeout(() => {
        setMobileMenuAnimating(false);
      }, 300);
    }
  };

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
      name: 'Organize',
      icon: FileText,
      color: 'blue',
      tools: [
        { id: 'merge', name: 'Merge PDF', icon: Merge, description: 'Combine PDFs in the order you want' },
        { id: 'split', name: 'Split PDF', icon: Split, description: 'Separate pages into independent PDFs' },
        { id: 'remove-pages', name: 'Remove Pages', icon: Trash2, description: 'Delete unwanted pages from PDF' },
        { id: 'extract-pages', name: 'Extract Pages', icon: Download, description: 'Extract specific pages from PDF' },
        { id: 'organize', name: 'Organize PDF', icon: FileText, description: 'Sort and arrange PDF pages' },
        { id: 'scan', name: 'Scan to PDF', icon: Scan, description: 'Convert scans to PDF documents' },
        { id: 'batch-processing', name: 'Batch Process PDFs', icon: Archive, description: 'Process multiple PDFs at once' }
      ]
    },
    {
      id: 'optimize',
      name: 'Optimize',
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
      name: 'Convert',
      icon: RotateCcw,
      color: 'purple',
      tools: [
        { id: 'pdf-to-word', name: 'PDF to Word', icon: FileText, description: 'Convert PDF to editable Word documents' },
        { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', icon: Presentation, description: 'Convert PDF to PowerPoint presentations' },
        { id: 'pdf-to-excel', name: 'PDF to Excel', icon: FileSpreadsheet, description: 'Convert PDF to Excel spreadsheets' },
        { id: 'pdf-to-jpg', name: 'PDF to JPG', icon: Image, description: 'Convert PDF pages to JPG images' },
        { id: 'word-to-pdf', name: 'Word to PDF', icon: FileText, description: 'Convert Word documents to PDF' },
        { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: Presentation, description: 'Convert PowerPoint to PDF' },
        { id: 'excel-to-pdf', name: 'Excel to PDF', icon: FileSpreadsheet, description: 'Convert Excel to PDF' },
        { id: 'jpg-to-pdf', name: 'JPG to PDF', icon: Image, description: 'Convert JPG images to PDF' },
        { id: 'html-to-pdf', name: 'HTML to PDF', icon: Globe, description: 'Convert web pages to PDF' },
        { id: 'csv-to-pdf', name: 'CSV to PDF', icon: FileSpreadsheet, description: 'Convert CSV files to PDF tables' },
        { id: 'png-webp-to-pdf', name: 'PNG/WebP to PDF', icon: Image, description: 'Convert PNG/WebP images to PDF' },
        { id: 'txt-to-pdf', name: 'TXT to PDF', icon: Type, description: 'Convert text files to PDF' },
        { id: 'rtf-to-pdf', name: 'RTF to PDF', icon: Type, description: 'Convert RTF files to PDF' }
      ]
    },
    {
      id: 'edit',
      name: 'Edit',
      icon: Edit,
      color: 'orange',
      tools: [
        { id: 'rotate', name: 'Rotate PDF', icon: RotateCcw, description: 'Rotate PDF pages as needed' },
        { id: 'watermark', name: 'Add Watermark', icon: Droplets, description: 'Add text or image watermarks' },
        { id: 'crop', name: 'Crop PDF', icon: Crop, description: 'Crop margins or specific areas' },
        { id: 'page-numbers', name: 'Add Page Numbers', icon: Hash, description: 'Add page numbers to PDF' },
        { id: 'edit-pdf', name: 'Edit PDF', icon: Edit, description: 'Add text, images, and annotations' },
        { id: 'pdf-forms', name: 'Create & Edit Forms', icon: FileText, description: 'Create fillable forms and edit existing ones' }
      ]
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      color: 'red',
      tools: [
        { id: 'protect', name: 'Protect PDF', icon: Lock, description: 'Add password protection to PDF' },
        { id: 'unlock', name: 'Unlock PDF', icon: Unlock, description: 'Remove password protection' },
        { id: 'sign', name: 'Sign PDF', icon: FileText, description: 'Add digital signatures' },
        { id: 'redact', name: 'Redact PDF', icon: Trash2, description: 'Permanently remove sensitive information' },
        { id: 'compare', name: 'Compare PDF', icon: GitCompare, description: 'Compare different PDF versions' },
        { id: 'advanced-security', name: 'Advanced Security', icon: Shield, description: 'Blockchain verification, military encryption, and audit trails' }
      ]
    },
    {
      id: 'ai_tools',
      name: 'AI Tools',
      icon: Brain,
      color: 'purple',
      tools: [
        { id: 'ai-chat', name: 'AI Document Chat', icon: Brain, description: 'Chat with your PDFs - ask questions about content, get summaries' },
        { id: 'adobe-ai-chat', name: 'Adobe-Style AI Assistant', icon: Sparkles, description: 'Advanced AI assistant with Adobe-level intelligence and document understanding' },
        { id: 'smart-relationships', name: 'Smart Document Relationships', icon: Network, description: 'AI detects related documents and suggests connections' },
        { id: 'predictive-processing', name: 'Predictive Processing', icon: Sparkles, description: 'AI learns your patterns and suggests operations' },
        { id: 'webhooks', name: 'Webhook Notifications', icon: Zap, description: 'Get real-time notifications when operations complete' }
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
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden lg:overflow-x-visible">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-4 xl:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 md:py-4 lg:py-4">
            <button 
              onClick={() => setActiveTool('home')}
              className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity flex-shrink-0 xl:mr-8"
            >
              <div className="bg-blue-600 p-1 sm:p-1.5 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-lg xl:text-2xl font-bold">
                  <span className="text-blue-800 dark:text-blue-600">Doc</span>
                  <span className="text-green-500 dark:text-green-400">Nestly</span>
                </h1>
                <p className="text-xs sm:text-xs md:text-sm lg:text-xs xl:text-sm text-gray-500 dark:text-gray-400 font-medium italic -mt-1">
                  Where documents find their flow.
                </p>
              </div>
            </button>
            
            {/* Desktop Navigation */}
            <nav ref={dropdownRef} className="hidden lg:flex space-x-1 xl:space-x-0.5 flex-shrink-0 overflow-x-auto max-w-none">
              {tools.map((category, index) => (
                <div key={category.id} className="relative flex-shrink-0">
                  <button 
                    onClick={() => handleDropdownOpen(category.id)}
                    className={`navbar-button flex items-center px-0.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 text-xs lg:text-sm xl:text-sm font-normal lg:font-medium xl:font-medium rounded transition-all duration-200 whitespace-nowrap min-w-0 ${
                      activeDropdown === category.id
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <category.icon className="h-3 w-3 lg:h-4 lg:w-4 xl:h-4 xl:w-4 mr-0.5 lg:mr-1 xl:mr-1 flex-shrink-0" />
                    <span className="truncate text-xs lg:text-sm xl:text-sm font-normal lg:font-medium xl:font-medium">{category.name}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === category.id && (
                    <div className={`navbar-dropdown absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[99999] max-h-96 overflow-y-auto ${
                      index >= tools.length - 2 ? 'right-0' : 'left-0'
                    } ${dropdownAnimating ? 'dropdown-enter' : ''}`} style={{ 
                      maxWidth: 'calc(100vw - 2rem)', 
                      zIndex: 99999,
                      position: 'absolute',
                      top: '100%',
                      left: index >= tools.length - 2 ? 'auto' : '0',
                      right: index >= tools.length - 2 ? '0' : 'auto'
                    }}>
                      <div className="p-3 sm:p-4">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">{category.name}</h3>
                        <div className="grid grid-cols-1 gap-1 sm:gap-2">
                          {category.tools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setActiveTool(tool.id);
                                handleDropdownClose();
                                setMobileMenuOpen(false);
                              }}
                              className="navbar-button flex items-start p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 w-full hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <tool.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
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

            {/* Tablet Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="navbar-button hidden md:flex lg:hidden items-center p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white touch-manipulation min-h-[44px] min-w-[44px] flex-shrink-0 transition-all duration-200"
            >
              <div className={`transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="navbar-button md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white touch-manipulation min-h-[44px] min-w-[44px] flex-shrink-0 transition-all duration-200"
            >
              <div className={`transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </button>
          </div>

          {/* Mobile & Tablet Navigation */}
          {mobileMenuOpen && (
            <div className={`lg:hidden border-t border-gray-200 dark:border-gray-700 py-2 max-h-[80vh] overflow-y-auto scroll-smooth ${mobileMenuAnimating ? 'mobile-menu-enter' : ''}`}>
              <div className="space-y-2 px-2">
                {tools.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center px-2">
                      <category.icon className="h-4 w-4 mr-2" />
                      {category.name}
                    </h3>
                    <div className="ml-4 space-y-1">
                      {category.tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTool(tool.id);
                            handleMobileMenuToggle();
                          }}
                          className="navbar-button flex items-start p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 w-full touch-manipulation min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <tool.icon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tool.description}</div>
                          </div>
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
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8 lg:py-8">
        {/* Hero Section - Show when no specific tool is selected */}
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf', 'organize-pdf', 'scan-to-pdf', 'repair-pdf', 'ocr-pdf', 'pdf-to-word', 'pdf-to-powerpoint', 'pdf-to-excel', 'pdf-to-jpg', 'word-to-pdf', 'powerpoint-to-pdf', 'excel-to-pdf', 'jpg-to-pdf', 'html-to-pdf', 'csv-to-pdf', 'png-webp-to-pdf', 'txt-to-pdf', 'rtf-to-pdf', 'batch-processing', 'pdf-forms', 'unlock', 'protect', 'sign', 'redact', 'compare', 'edit-pdf', 'add-page-numbers', 'add-watermark', 'crop-pdf'].includes(activeTool) && (
          <div className="text-center mb-4 sm:mb-8 lg:mb-12 px-1 sm:px-4">
            <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 leading-tight">
              Work with PDFs the way they were meant to be — fast, secure, and effortless.
            </h1>
            <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-3 sm:mb-6 lg:mb-8 leading-relaxed px-1">
              From batch processing to advanced protection, DocNestly delivers enterprise-level solutions that keep your workflow moving smoothly. All in your browser. No uploads, no registrations. Just powerful tools, always in flow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 lg:gap-6 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                100% Free
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                No Registration Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
                Secure & Private
              </div>
            </div>
          </div>
        )}

        {/* Tool Header - Show when specific tool is selected */}
        {['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf', 'organize-pdf', 'scan-to-pdf', 'repair-pdf', 'ocr-pdf', 'pdf-to-word', 'pdf-to-powerpoint', 'pdf-to-excel', 'pdf-to-jpg', 'word-to-pdf', 'powerpoint-to-pdf', 'excel-to-pdf', 'jpg-to-pdf', 'batch-processing', 'pdf-forms', 'unlock', 'protect', 'sign', 'redact', 'compare', 'edit-pdf', 'add-page-numbers', 'add-watermark', 'crop-pdf', 'html-to-pdf', 'csv-to-pdf', 'png-webp-to-pdf', 'txt-to-pdf', 'rtf-to-pdf', 'webhooks', 'ai-chat', 'smart-relationships', 'predictive-processing', 'advanced-security'].includes(activeTool) && (
          <div className="text-center mb-8">
            {/* Back Button */}
            <div className="flex justify-start mb-4">
              <button
                onClick={() => setActiveTool('home')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to All Tools
              </button>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentTool?.name || 'PDF Tools'}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              {currentTool?.description || 'Choose a tool from the menu above to get started'}
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf', 'organize-pdf', 'scan-to-pdf', 'repair-pdf', 'ocr-pdf', 'pdf-to-word', 'pdf-to-powerpoint', 'pdf-to-excel', 'pdf-to-jpg', 'word-to-pdf', 'powerpoint-to-pdf', 'excel-to-pdf', 'jpg-to-pdf', 'html-to-pdf', 'csv-to-pdf', 'png-webp-to-pdf', 'txt-to-pdf', 'rtf-to-pdf', 'batch-processing', 'pdf-forms', 'unlock', 'protect', 'sign', 'redact', 'compare', 'edit-pdf', 'add-page-numbers', 'add-watermark', 'crop-pdf', 'webhooks', 'ai-chat', 'smart-relationships', 'predictive-processing', 'advanced-security'].includes(activeTool) && (
          <div className="space-y-8 sm:space-y-12">
            {/* Organize */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Organize
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
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
                  status="available"
                  onClick={() => setActiveTool('organize-pdf')}
                />
                <ToolCard
                  icon={Scan}
                  title="Scan to PDF"
                  description="Convert scanned documents and images into searchable PDF files."
                  status="available"
                  onClick={() => setActiveTool('scan-to-pdf')}
                />
                <ToolCard
                  icon={Archive}
                  title="Batch Process PDFs"
                  description="Process multiple PDFs at once with compression, conversion, watermarking, and more."
                  status="available"
                  onClick={() => setActiveTool('batch-processing')}
                />
              </div>
            </div>

            {/* Optimize */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-green-600" />
                Optimize
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
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
                  status="available"
                  onClick={() => setActiveTool('repair-pdf')}
                />
                <ToolCard
                  icon={Eye}
                  title="OCR PDF"
                  description="Convert scanned PDFs into searchable and selectable documents."
                  status="available"
                  onClick={() => setActiveTool('ocr-pdf')}
                />
              </div>
            </div>

            {/* Convert */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <RotateCcw className="h-6 w-6 mr-2 text-purple-600" />
                Convert
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
                <ToolCard
                  icon={FileText}
                  title="PDF to Word"
                  description="Convert PDF files into easy to edit DOC and DOCX documents."
                  status="available"
                  onClick={() => setActiveTool('pdf-to-word')}
                />
                <ToolCard
                  icon={Presentation}
                  title="PDF to PowerPoint"
                  description="Turn PDF files into easy to edit PPT and PPTX slideshows."
                  status="available"
                  onClick={() => setActiveTool('pdf-to-powerpoint')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="PDF to Excel"
                  description="Extract data from PDFs into Excel spreadsheets in seconds."
                  status="available"
                  onClick={() => setActiveTool('pdf-to-excel')}
                />
                <ToolCard
                  icon={Image}
                  title="PDF to JPG"
                  description="Convert each PDF page into JPG images or extract all images."
                  status="available"
                  onClick={() => setActiveTool('pdf-to-jpg')}
                />
                <ToolCard
                  icon={FileText}
                  title="Word to PDF"
                  description="Convert DOC and DOCX files to PDF for easy viewing."
                  status="available"
                  onClick={() => setActiveTool('word-to-pdf')}
                />
                <ToolCard
                  icon={Presentation}
                  title="PowerPoint to PDF"
                  description="Convert PPT and PPTX slideshows to PDF format."
                  status="available"
                  onClick={() => setActiveTool('powerpoint-to-pdf')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Excel to PDF"
                  description="Convert Excel spreadsheets to PDF for easy sharing."
                  status="available"
                  onClick={() => setActiveTool('excel-to-pdf')}
                />
                <ToolCard
                  icon={Image}
                  title="JPG to PDF"
                  description="Convert JPG images to PDF in seconds with custom orientation."
                  status="available"
                  onClick={() => setActiveTool('jpg-to-pdf')}
                />
                <ToolCard
                  icon={Globe}
                  title="HTML to PDF"
                  description="Convert HTML content or web pages to PDF documents."
                  status="available"
                  onClick={() => setActiveTool('html-to-pdf')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="CSV to PDF"
                  description="Convert CSV files to PDF tables with customizable formatting."
                  status="available"
                  onClick={() => setActiveTool('csv-to-pdf')}
                />
                <ToolCard
                  icon={Image}
                  title="PNG/WebP to PDF"
                  description="Convert PNG, WebP, and JPEG images to PDF documents."
                  status="available"
                  onClick={() => setActiveTool('png-webp-to-pdf')}
                />
                <ToolCard
                  icon={Type}
                  title="TXT to PDF"
                  description="Convert plain text files to PDF documents with custom formatting."
                  status="available"
                  onClick={() => setActiveTool('txt-to-pdf')}
                />
                <ToolCard
                  icon={Type}
                  title="RTF to PDF"
                  description="Convert Rich Text Format files to PDF documents."
                  status="available"
                  onClick={() => setActiveTool('rtf-to-pdf')}
                />
              </div>
            </div>

            {/* Edit */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <Edit className="h-6 w-6 mr-2 text-orange-600" />
                Edit
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
                <ToolCard
                  icon={Edit}
                  title="Edit PDF"
                  description="Add text, images, shapes or annotations to PDF documents."
                  status="available"
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
                  status="available"
                  onClick={() => setActiveTool('add-page-numbers')}
                />
                <ToolCard
                  icon={Droplets}
                  title="Add Watermark"
                  description="Stamp images or text over your PDF with custom transparency."
                  status="available"
                  onClick={() => setActiveTool('add-watermark')}
                />
                <ToolCard
                  icon={Crop}
                  title="Crop PDF"
                  description="Crop margins or select specific areas in your PDF documents."
                  status="available"
                  onClick={() => setActiveTool('crop-pdf')}
                />
                <ToolCard
                  icon={FileText}
                  title="Create & Edit Forms"
                  description="Create fillable PDF forms with text fields, checkboxes, dropdowns, and more."
                  status="available"
                  onClick={() => setActiveTool('pdf-forms')}
                />
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-red-600" />
                Security
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
                <ToolCard
                  icon={Unlock}
                  title="Unlock PDF"
                  description="Remove PDF password security and use your PDFs freely."
                  status="available"
                  onClick={() => setActiveTool('unlock')}
                />
                <ToolCard
                  icon={Lock}
                  title="Protect PDF"
                  description="Protect PDF files with passwords and encrypt documents."
                  status="available"
                  onClick={() => setActiveTool('protect')}
                />
                <ToolCard
                  icon={FileText}
                  title="Sign PDF"
                  description="Sign yourself or request electronic signatures from others."
                  status="available"
                  onClick={() => setActiveTool('sign')}
                />
                <ToolCard
                  icon={Trash2}
                  title="Redact PDF"
                  description="Permanently remove sensitive information from PDF documents."
                  status="available"
                  onClick={() => setActiveTool('redact')}
                />
                <ToolCard
                  icon={GitCompare}
                  title="Compare PDF"
                  description="Show side-by-side comparison and spot changes between versions."
                  status="available"
                  onClick={() => setActiveTool('compare')}
                />
                <ToolCard
                  icon={Shield}
                  title="Advanced Security"
                  description="Blockchain verification, military-grade encryption, and comprehensive audit trails."
                  status="available"
                  onClick={() => setActiveTool('advanced-security')}
                />
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <h2 className="text-sm sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 md:mb-5 lg:mb-6 flex items-center">
                <Brain className="h-6 w-6 mr-2 text-purple-600" />
                AI Tools
                <span className="ml-3 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full animate-pulse">
                  NEW
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6">
                <ToolCard
                  icon={Brain}
                  title="AI Document Chat"
                  description="Chat with your PDFs - ask questions about content, get summaries, find specific information."
                  status="available"
                  onClick={() => setActiveTool('ai-chat')}
                />
                <ToolCard
                  icon={Network}
                  title="Smart Document Relationships"
                  description="AI automatically detects related documents and suggests smart connections and merging opportunities."
                  status="available"
                  onClick={() => setActiveTool('smart-relationships')}
                />
                <ToolCard
                  icon={Sparkles}
                  title="Predictive Processing"
                  description="AI learns your patterns and suggests operations before you even think of them."
                  status="available"
                  onClick={() => setActiveTool('predictive-processing')}
                />
                <ToolCard
                  icon={Zap}
                  title="Webhook Notifications"
                  description="Get real-time notifications when your PDF operations complete."
                  status="available"
                  onClick={() => setActiveTool('webhooks')}
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
          <MergePDF onReset={() => setActiveTool('home')} />
        )}

        {/* Split PDF Tool */}
        {activeTool === 'split' && (
          <SplitPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Remove Pages Tool */}
        {activeTool === 'remove-pages' && (
          <RemovePages onReset={() => setActiveTool('home')} />
        )}

        {/* Extract Pages Tool */}
        {activeTool === 'extract-pages' && (
          <ExtractPages onReset={() => setActiveTool('home')} />
        )}

        {/* Rotate PDF Tool */}
        {activeTool === 'rotate-pdf' && (
          <RotatePDF onReset={() => setActiveTool('home')} />
        )}

        {/* Organize PDF Tool */}
        {activeTool === 'organize-pdf' && (
          <OrganizePDF onReset={() => setActiveTool('home')} />
        )}

        {/* Scan to PDF Tool */}
        {activeTool === 'scan-to-pdf' && (
          <ScanToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Repair PDF Tool */}
        {activeTool === 'repair-pdf' && (
          <RepairPDF onReset={() => setActiveTool('home')} />
        )}

        {/* OCR PDF Tool */}
        {activeTool === 'ocr-pdf' && (
          <OCRPDF onReset={() => setActiveTool('home')} />
        )}

        {/* PDF to Word Tool */}
        {activeTool === 'pdf-to-word' && (
          <PDFToWord onReset={() => setActiveTool('home')} />
        )}

        {/* PDF to PowerPoint Tool */}
        {activeTool === 'pdf-to-powerpoint' && (
          <PDFToPowerPoint onReset={() => setActiveTool('home')} />
        )}

        {/* PDF to JPG Tool */}
        {activeTool === 'pdf-to-jpg' && (
          <PDFToJPG onReset={() => setActiveTool('home')} />
        )}

        {/* PDF to Excel Tool */}
        {activeTool === 'pdf-to-excel' && (
          <PDFToExcel onReset={() => setActiveTool('home')} />
        )}

        {/* Word to PDF Tool */}
        {activeTool === 'word-to-pdf' && (
          <WordToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* PowerPoint to PDF Tool */}
        {activeTool === 'powerpoint-to-pdf' && (
          <PowerPointToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Excel to PDF Tool */}
        {activeTool === 'excel-to-pdf' && (
          <ExcelToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* JPG to PDF Tool */}
        {activeTool === 'jpg-to-pdf' && (
          <JPGToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Edit PDF Tool */}
        {activeTool === 'edit-pdf' && (
          <EditPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Add Page Numbers Tool */}
        {activeTool === 'add-page-numbers' && (
          <AddPageNumbers onReset={() => setActiveTool('home')} />
        )}

        {/* Add Watermark Tool */}
        {activeTool === 'add-watermark' && (
          <AddWatermark onReset={() => setActiveTool('home')} />
        )}

        {/* Crop PDF Tool */}
        {activeTool === 'crop-pdf' && (
          <CropPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Unlock PDF Tool */}
        {activeTool === 'unlock' && (
          <UnlockPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Protect PDF Tool */}
        {activeTool === 'protect' && (
          <ProtectPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Sign PDF Tool */}
        {activeTool === 'sign' && (
          <SignPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Redact PDF Tool */}
        {activeTool === 'redact' && (
          <RedactPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Compare PDF Tool */}
        {activeTool === 'compare' && (
          <ComparePDF onReset={() => setActiveTool('home')} />
        )}

        {/* HTML to PDF Tool */}
        {activeTool === 'html-to-pdf' && (
          <HTMLToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* CSV to PDF Tool */}
        {activeTool === 'csv-to-pdf' && (
          <CSVToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* PNG/WebP to PDF Tool */}
        {activeTool === 'png-webp-to-pdf' && (
          <PNGWebPToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* TXT to PDF Tool */}
        {activeTool === 'txt-to-pdf' && (
          <TXTToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* RTF to PDF Tool */}
        {activeTool === 'rtf-to-pdf' && (
          <RTFToPDF onReset={() => setActiveTool('home')} />
        )}

        {/* Batch Processing Tool */}
        {activeTool === 'batch-processing' && (
          <BatchProcessing onReset={() => setActiveTool('home')} />
        )}

        {/* PDF Forms Tool */}
        {activeTool === 'pdf-forms' && (
          <PDFForms onReset={() => setActiveTool('home')} />
        )}

        {/* Webhook Settings */}
        {activeTool === 'webhooks' && (
          <WebhookSettings onReset={() => setActiveTool('home')} />
        )}

        {/* AI Document Chat */}
        {activeTool === 'ai-chat' && (
          <AIDocumentChat onReset={() => setActiveTool('home')} />
        )}

        {/* Adobe-Style AI Assistant */}
        {activeTool === 'adobe-ai-chat' && (
          <AdobeStyleAIChat onReset={() => setActiveTool('home')} />
        )}

        {/* Smart Document Relationships */}
        {activeTool === 'smart-relationships' && (
          <SmartDocumentRelationships onReset={() => setActiveTool('home')} />
        )}

        {/* Predictive Processing */}
        {activeTool === 'predictive-processing' && (
          <PredictiveProcessing onReset={() => setActiveTool('home')} />
        )}

        {/* Advanced Security */}
        {activeTool === 'advanced-security' && (
          <AdvancedSecurity onReset={() => setActiveTool('home')} />
        )}

        {/* Coming Soon Tool */}
        {!['compress', 'merge', 'split', 'remove-pages', 'extract-pages', 'rotate-pdf', 'organize-pdf', 'scan-to-pdf', 'repair-pdf', 'ocr-pdf', 'pdf-to-word', 'pdf-to-powerpoint', 'pdf-to-excel', 'pdf-to-jpg', 'word-to-pdf', 'powerpoint-to-pdf', 'excel-to-pdf', 'jpg-to-pdf', 'html-to-pdf', 'csv-to-pdf', 'png-webp-to-pdf', 'txt-to-pdf', 'rtf-to-pdf', 'edit-pdf', 'add-page-numbers', 'add-watermark', 'crop-pdf', 'unlock', 'protect', 'sign', 'redact', 'compare', 'batch-processing', 'pdf-forms', 'webhooks', 'ai-chat', 'smart-relationships', 'predictive-processing', 'advanced-security'].includes(activeTool) && activeTool !== 'home' && (
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
              © 2024 DocNestly. Built by Rutvij Deo.
            </p>
            <p className="text-sm">
              Your privacy is protected - all processing happens in your browser.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
}
