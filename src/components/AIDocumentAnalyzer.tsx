'use client';

import React, { useState, useRef } from 'react';
import { FileText, Brain, Eye, Search, BarChart3, Lightbulb, Download, X } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface DocumentAnalysis {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  language: string;
  confidence: number;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  documentType: string;
  pageCount: number;
  wordCount: number;
  readingTime: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  suggestions: string[];
}

export default function AIDocumentAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { steps, currentStep, isProcessing } = useProgress();

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setUploadedFile(file);
    
    // Simulate AI analysis with realistic processing steps
    const analysisSteps = [
      'Uploading document...',
      'Extracting text content...',
      'Analyzing document structure...',
      'Detecting language and sentiment...',
      'Generating key insights...',
      'Creating document summary...',
      'Analyzing complexity level...',
      'Generating recommendations...',
      'Finalizing analysis...'
    ];

    // Simulate processing time
    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    }

    // Generate realistic analysis results
    const mockAnalysis: DocumentAnalysis = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: "Document Author",
      subject: "Business Document",
      keywords: ["business", "strategy", "analysis", "growth", "market"],
      language: "English",
      confidence: 94.5,
      summary: "This document contains comprehensive business analysis with strategic insights and market research data. The content covers growth strategies, market analysis, and future projections.",
      keyPoints: [
        "Strategic business planning and analysis",
        "Market research and competitive analysis", 
        "Growth projections and financial forecasts",
        "Risk assessment and mitigation strategies",
        "Implementation timeline and milestones"
      ],
      sentiment: "positive",
      documentType: "Business Report",
      pageCount: Math.floor(Math.random() * 20) + 5,
      wordCount: Math.floor(Math.random() * 5000) + 2000,
      readingTime: Math.floor(Math.random() * 15) + 5,
      complexity: "intermediate",
      suggestions: [
        "Consider adding visual charts for better data representation",
        "Include executive summary for quick overview",
        "Add table of contents for better navigation",
        "Consider breaking into smaller sections for readability"
      ]
    };

    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      analyzeDocument(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      analyzeDocument(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-12 h-12 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Document Analyzer
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Upload any PDF document and get instant AI-powered insights, analysis, and recommendations
        </p>
      </div>

      {!analysis && !isAnalyzing && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-purple-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Drop your PDF here or click to browse
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AI will analyze your document and provide detailed insights
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Choose PDF File
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI is analyzing your document...
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
                  index === currentStep ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
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

      {analysis && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{analysis.title}</h2>
                <p className="text-purple-100">{analysis.documentType} • {analysis.language}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{analysis.confidence}%</div>
                <div className="text-purple-100">Confidence</div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.pageCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pages</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.wordCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Words</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.readingTime}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Min Read</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{analysis.complexity}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Complexity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary and Key Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600" />
                Document Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                Key Points
              </h3>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keywords and Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <span key={index} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sentiment Analysis
              </h3>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  analysis.sentiment === 'positive' ? 'bg-green-500' :
                  analysis.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {analysis.sentiment} Tone
                </span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
              AI Recommendations
            </h3>
            <ul className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Download Analysis Report
            </button>
            <button 
              onClick={() => {
                setAnalysis(null);
                setUploadedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Analyze Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
