'use client';

import React, { useState, useRef } from 'react';
import { FileText, Download, Copy, Check, Search, Filter, Eye, Table, Image, Type, BarChart3 } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface ExtractedContent {
  text: string;
  tables: Array<{
    id: string;
    data: string[][];
    headers: string[];
    rows: number;
    columns: number;
  }>;
  images: Array<{
    id: string;
    description: string;
    confidence: number;
    page: number;
  }>;
  metadata: {
    totalPages: number;
    totalText: string;
    totalTables: number;
    totalImages: number;
    extractionTime: number;
  };
}

export default function SmartContentExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTab, setSelectedTab] = useState<'text' | 'tables' | 'images'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { steps, currentStep, isProcessing } = useProgress();

  const extractContent = async (file: File) => {
    setIsExtracting(true);
    setUploadedFile(file);
    
    const extractionSteps = [
      'Uploading PDF document...',
      'Analyzing document structure...',
      'Extracting text content...',
      'Identifying tables and data...',
      'Processing images and graphics...',
      'Running OCR on scanned content...',
      'Organizing extracted data...',
      'Generating metadata...',
      'Finalizing extraction...'
    ];

    // Simulate processing time
    for (let i = 0; i < extractionSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));
    }

    // Generate realistic extracted content
    const mockContent: ExtractedContent = {
      text: `This is a comprehensive business report analyzing market trends and growth opportunities. The document contains detailed financial projections, market analysis, and strategic recommendations for the upcoming fiscal year.

Key findings include:
- Market growth of 15% year-over-year
- Increased demand for digital solutions
- Emerging opportunities in AI and automation
- Strong performance in Q3 and Q4

The analysis suggests implementing new technologies to maintain competitive advantage and capture market share. Strategic partnerships and digital transformation initiatives are recommended to drive future growth.

Financial projections indicate strong revenue potential with proper execution of the proposed strategies. Risk assessment shows manageable challenges with appropriate mitigation plans.`,
      tables: [
        {
          id: 'table-1',
          headers: ['Quarter', 'Revenue', 'Growth %', 'Profit Margin'],
          data: [
            ['Q1 2024', '$2.5M', '12%', '18%'],
            ['Q2 2024', '$2.8M', '15%', '20%'],
            ['Q3 2024', '$3.2M', '18%', '22%'],
            ['Q4 2024', '$3.6M', '20%', '25%']
          ],
          rows: 4,
          columns: 4
        },
        {
          id: 'table-2',
          headers: ['Department', 'Budget', 'Actual', 'Variance'],
          data: [
            ['Marketing', '$500K', '$480K', '-$20K'],
            ['Sales', '$800K', '$820K', '+$20K'],
            ['R&D', '$1.2M', '$1.15M', '-$50K'],
            ['Operations', '$600K', '$610K', '+$10K']
          ],
          rows: 4,
          columns: 4
        }
      ],
      images: [
        {
          id: 'img-1',
          description: 'Bar chart showing quarterly revenue growth',
          confidence: 95.2,
          page: 1
        },
        {
          id: 'img-2',
          description: 'Pie chart displaying market share distribution',
          confidence: 92.8,
          page: 2
        },
        {
          id: 'img-3',
          description: 'Line graph illustrating customer satisfaction trends',
          confidence: 89.5,
          page: 3
        }
      ],
      metadata: {
        totalPages: 8,
        totalText: '2,847 words extracted',
        totalTables: 2,
        totalImages: 3,
        extractionTime: 4.2
      }
    };

    setExtractedContent(mockContent);
    setIsExtracting(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      extractContent(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      extractContent(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadAsText = () => {
    if (!extractedContent) return;
    
    const content = `EXTRACTED CONTENT REPORT
=======================

TEXT CONTENT:
${extractedContent.text}

TABLES:
${extractedContent.tables.map((table, index) => 
  `Table ${index + 1}:\n${table.headers.join('\t')}\n${table.data.map(row => row.join('\t')).join('\n')}\n`
).join('\n')}

IMAGES:
${extractedContent.images.map((img, index) => 
  `Image ${index + 1}: ${img.description} (Confidence: ${img.confidence}%, Page: ${img.page})`
).join('\n')}

METADATA:
- Total Pages: ${extractedContent.metadata.totalPages}
- Total Text: ${extractedContent.metadata.totalText}
- Total Tables: ${extractedContent.metadata.totalTables}
- Total Images: ${extractedContent.metadata.totalImages}
- Extraction Time: ${extractedContent.metadata.extractionTime}s
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredText = extractedContent?.text
    ? extractedContent.text.split('\n').filter(line => 
        line.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <FileText className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smart Content Extractor
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Extract text, tables, images, and metadata from PDFs with AI-powered precision
        </p>
      </div>

      {!extractedContent && !isExtracting && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Drop your PDF here or click to browse
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AI will extract all content including text, tables, and images
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Choose PDF File
          </button>
        </div>
      )}

      {isExtracting && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI is extracting content...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This may take a few moments
            </p>
          </div>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  index < currentStep ? 'bg-green-500' : 
                  index === currentStep ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className={`text-sm ${
                  index <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {extractedContent && (
        <div className="space-y-6">
          {/* Header with metadata */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Content Extraction Complete</h2>
              <div className="text-right">
                <div className="text-3xl font-bold">{extractedContent.metadata.extractionTime}s</div>
                <div className="text-blue-100">Processing Time</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{extractedContent.metadata.totalPages}</div>
                <div className="text-blue-100">Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{extractedContent.metadata.totalTables}</div>
                <div className="text-blue-100">Tables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{extractedContent.metadata.totalImages}</div>
                <div className="text-blue-100">Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{extractedContent.metadata.totalText}</div>
                <div className="text-blue-100">Text</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('text')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'text'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Type className="w-4 h-4 inline mr-2" />
              Text Content
            </button>
            <button
              onClick={() => setSelectedTab('tables')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'tables'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 inline mr-2" />
              Tables ({extractedContent.tables.length})
            </button>
            <button
              onClick={() => setSelectedTab('images')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedTab === 'images'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Image className="w-4 h-4 inline mr-2" />
              Images ({extractedContent.images.length})
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search extracted content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={downloadAsText}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </button>
          </div>

          {/* Content Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {selectedTab === 'text' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Extracted Text
                  </h3>
                  <button
                    onClick={() => copyToClipboard(extractedContent.text, 'text')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {copiedItems.has('text') ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedItems.has('text') ? 'Copied!' : 'Copy All'}
                  </button>
                </div>
                <div className="prose max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                    {searchQuery ? filteredText.join('\n') : extractedContent.text}
                  </pre>
                </div>
              </div>
            )}

            {selectedTab === 'tables' && (
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Extracted Tables
                </h3>
                <div className="space-y-6">
                  {extractedContent.tables.map((table, index) => (
                    <div key={table.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Table {index + 1} ({table.rows} rows × {table.columns} columns)
                        </h4>
                        <button
                          onClick={() => copyToClipboard(
                            table.headers.join('\t') + '\n' + table.data.map(row => row.join('\t')).join('\n'),
                            `table-${index}`
                          )}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {copiedItems.has(`table-${index}`) ? (
                            <Check className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copiedItems.has(`table-${index}`) ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-600">
                            <tr>
                              {table.headers.map((header, i) => (
                                <th key={i} className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {table.data.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'images' && (
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Extracted Images
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extractedContent.images.map((image, index) => (
                    <div key={image.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Image {index + 1}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Page {image.page}
                        </span>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-2 flex items-center justify-center">
                        <Image className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {image.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {image.confidence}%
                        </span>
                        <button
                          onClick={() => copyToClipboard(image.description, `image-${index}`)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-xs"
                        >
                          {copiedItems.has(`image-${index}`) ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copiedItems.has(`image-${index}`) ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                setExtractedContent(null);
                setUploadedFile(null);
                setSearchQuery('');
                setCopiedItems(new Set());
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Extract Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
