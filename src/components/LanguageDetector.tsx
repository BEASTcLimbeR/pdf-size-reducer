'use client';

import React, { useState, useRef } from 'react';
import { Globe, FileText, CheckCircle, AlertCircle, Download, Copy, Eye } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface LanguageDetection {
  detectedLanguage: {
    code: string;
    name: string;
    confidence: number;
    region: string;
  };
  alternativeLanguages: Array<{
    code: string;
    name: string;
    confidence: number;
  }>;
  textAnalysis: {
    totalWords: number;
    uniqueWords: number;
    averageWordLength: number;
    readingLevel: string;
    complexity: 'low' | 'medium' | 'high';
  };
  suggestions: string[];
  translation: {
    available: boolean;
    targetLanguage: string;
    translatedText: string;
  };
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', flag: '🇮🇳' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' }
];

export default function LanguageDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detection, setDetection] = useState<LanguageDetection | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { steps, currentStep, isProcessing } = useProgress();

  const detectLanguage = async (content: string) => {
    setIsDetecting(true);
    
    const detectionSteps = [
      'Analyzing text content...',
      'Processing character patterns...',
      'Running language detection algorithms...',
      'Comparing with language models...',
      'Calculating confidence scores...',
      'Identifying regional variations...',
      'Analyzing text complexity...',
      'Generating suggestions...',
      'Preparing translation options...'
    ];

    // Simulate processing time
    for (let i = 0; i < detectionSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 700));
    }

    // Simulate language detection based on content
    const mockDetection: LanguageDetection = {
      detectedLanguage: {
        code: 'en',
        name: 'English',
        confidence: 94.2,
        region: 'United States'
      },
      alternativeLanguages: [
        { code: 'es', name: 'Spanish', confidence: 3.1 },
        { code: 'fr', name: 'French', confidence: 1.8 },
        { code: 'de', name: 'German', confidence: 0.9 }
      ],
      textAnalysis: {
        totalWords: content.split(/\s+/).length,
        uniqueWords: new Set(content.toLowerCase().split(/\s+/)).size,
        averageWordLength: content.split(/\s+/).reduce((acc, word) => acc + word.length, 0) / content.split(/\s+/).length,
        readingLevel: 'Intermediate',
        complexity: 'medium'
      },
      suggestions: [
        'Consider using simpler vocabulary for broader accessibility',
        'Add visual elements to support comprehension',
        'Break down complex sentences into shorter ones',
        'Include definitions for technical terms'
      ],
      translation: {
        available: true,
        targetLanguage: 'Spanish',
        translatedText: 'Este es un documento de análisis empresarial que contiene información detallada sobre estrategias de mercado y oportunidades de crecimiento...'
      }
    };

    setDetection(mockDetection);
    setIsDetecting(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      // Simulate text extraction from PDF
      const mockText = "This is a comprehensive business analysis document containing detailed information about market strategies and growth opportunities. The analysis covers various aspects of the industry including market trends, competitive landscape, and future projections.";
      detectLanguage(mockText);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      detectLanguage(textInput);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      const mockText = "This is a comprehensive business analysis document containing detailed information about market strategies and growth opportunities.";
      detectLanguage(mockText);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadReport = () => {
    if (!detection) return;
    
    const report = `LANGUAGE DETECTION REPORT
========================

DETECTED LANGUAGE:
- Language: ${detection.detectedLanguage.name} (${detection.detectedLanguage.code})
- Confidence: ${detection.detectedLanguage.confidence}%
- Region: ${detection.detectedLanguage.region}

ALTERNATIVE LANGUAGES:
${detection.alternativeLanguages.map(lang => 
  `- ${lang.name} (${lang.code}): ${lang.confidence}%`
).join('\n')}

TEXT ANALYSIS:
- Total Words: ${detection.textAnalysis.totalWords}
- Unique Words: ${detection.textAnalysis.uniqueWords}
- Average Word Length: ${detection.textAnalysis.averageWordLength.toFixed(1)}
- Reading Level: ${detection.textAnalysis.readingLevel}
- Complexity: ${detection.textAnalysis.complexity}

SUGGESTIONS:
${detection.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

TRANSLATION:
- Available: ${detection.translation.available ? 'Yes' : 'No'}
- Target Language: ${detection.translation.targetLanguage}
- Translated Text: ${detection.translation.translatedText}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'language-detection-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Globe className="w-12 h-12 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Language Detector
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Automatically detect document language with AI-powered analysis and get instant translation suggestions
        </p>
      </div>

      {/* Input Method Selection */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setInputMethod('file')}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMethod === 'file'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Upload PDF
          </button>
          <button
            onClick={() => setInputMethod('text')}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMethod === 'text'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Enter Text
          </button>
        </div>
      </div>

      {!detection && !isDetecting && (
        <div className="space-y-6">
          {inputMethod === 'file' ? (
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-green-500 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Drop your PDF here or click to browse
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI will detect the language and provide analysis
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Choose PDF File
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Enter Text for Language Detection
              </h3>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type text in any language for AI analysis..."
                className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {textInput.length} characters
                </span>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Detect Language
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isDetecting && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI is analyzing the language...
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
                  index === currentStep ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
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

      {detection && (
        <div className="space-y-6">
          {/* Main Detection Result */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {SUPPORTED_LANGUAGES.find(lang => lang.code === detection.detectedLanguage.code)?.flag} 
                  {detection.detectedLanguage.name}
                </h2>
                <p className="text-green-100">{detection.detectedLanguage.region}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{detection.detectedLanguage.confidence}%</div>
                <div className="text-green-100">Confidence</div>
              </div>
            </div>
          </div>

          {/* Alternative Languages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Alternative Languages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {detection.alternativeLanguages.map((lang, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {SUPPORTED_LANGUAGES.find(l => l.code === lang.code)?.flag} {lang.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {lang.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${lang.confidence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Text Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Words:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{detection.textAnalysis.totalWords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unique Words:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{detection.textAnalysis.uniqueWords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Word Length:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{detection.textAnalysis.averageWordLength.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reading Level:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{detection.textAnalysis.readingLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
                  <span className={`font-medium capitalize ${
                    detection.textAnalysis.complexity === 'low' ? 'text-green-600' :
                    detection.textAnalysis.complexity === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {detection.textAnalysis.complexity}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                AI Suggestions
              </h3>
              <ul className="space-y-2">
                {detection.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Translation Preview */}
          {detection.translation.available && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                Translation Preview
              </h3>
              <div className="mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Translated to: <strong>{detection.translation.targetLanguage}</strong>
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {detection.translation.translatedText}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(detection.translation.translatedText)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Translation
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Full Translation
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={downloadReport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              onClick={() => {
                setDetection(null);
                setUploadedFile(null);
                setTextInput('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Globe className="w-4 h-4 mr-2" />
              Analyze Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
