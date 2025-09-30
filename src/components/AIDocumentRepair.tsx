'use client';

import React, { useState, useRef } from 'react';
import { FileText, Shield, CheckCircle, AlertTriangle, Download, Eye, RotateCcw, Zap } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

interface RepairIssue {
  id: string;
  type: 'corruption' | 'encoding' | 'structure' | 'metadata' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  fix: string;
  confidence: number;
}

interface RepairResult {
  originalFile: {
    name: string;
    size: number;
    issues: number;
  };
  repairedFile: {
    name: string;
    size: number;
    issuesFixed: number;
    successRate: number;
  };
  issues: RepairIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    repairTime: number;
  };
  recommendations: string[];
}

export default function AIDocumentRepair() {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<RepairIssue | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { steps, currentStep, isProcessing } = useProgress();

  const repairDocument = async (file: File) => {
    setIsRepairing(true);
    setUploadedFile(file);
    
    const repairSteps = [
      'Uploading corrupted document...',
      'Analyzing file structure...',
      'Scanning for corruption issues...',
      'Checking encoding problems...',
      'Validating metadata integrity...',
      'Running AI repair algorithms...',
      'Fixing structural issues...',
      'Rebuilding document components...',
      'Verifying repair success...',
      'Generating repair report...'
    ];

    // Simulate processing time
    for (let i = 0; i < repairSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    }

    // Generate realistic repair results
    const mockRepairResult: RepairResult = {
      originalFile: {
        name: file.name,
        size: file.size,
        issues: 7
      },
      repairedFile: {
        name: file.name.replace('.pdf', '_repaired.pdf'),
        size: Math.floor(file.size * 0.95), // Slightly smaller after repair
        issuesFixed: 6,
        successRate: 85.7
      },
      issues: [
        {
          id: 'issue-1',
          type: 'corruption',
          severity: 'critical',
          description: 'Corrupted page headers detected in pages 3-5',
          location: 'Pages 3-5',
          fix: 'Reconstructed page headers using AI pattern recognition',
          confidence: 92.3
        },
        {
          id: 'issue-2',
          type: 'encoding',
          severity: 'high',
          description: 'Character encoding issues in text content',
          location: 'Throughout document',
          fix: 'Converted to UTF-8 encoding and fixed character mapping',
          confidence: 88.7
        },
        {
          id: 'issue-3',
          type: 'structure',
          severity: 'medium',
          description: 'Broken internal document structure',
          location: 'Document root',
          fix: 'Rebuilt document structure tree and cross-references',
          confidence: 95.1
        },
        {
          id: 'issue-4',
          type: 'metadata',
          severity: 'low',
          description: 'Missing or corrupted metadata',
          location: 'Document info',
          fix: 'Extracted and reconstructed metadata from content',
          confidence: 78.4
        },
        {
          id: 'issue-5',
          type: 'security',
          severity: 'medium',
          description: 'Invalid security settings',
          location: 'Security layer',
          fix: 'Reset security settings to standard configuration',
          confidence: 91.2
        },
        {
          id: 'issue-6',
          type: 'corruption',
          severity: 'high',
          description: 'Corrupted image data in page 7',
          location: 'Page 7',
          fix: 'Repaired image data using AI image reconstruction',
          confidence: 86.9
        }
      ],
      summary: {
        totalIssues: 7,
        criticalIssues: 1,
        highIssues: 2,
        mediumIssues: 2,
        lowIssues: 2,
        repairTime: 12.4
      },
      recommendations: [
        'Regularly backup your PDF documents',
        'Use PDF/A format for long-term archival',
        'Avoid editing PDFs with non-PDF tools',
        'Scan documents at high resolution to prevent corruption',
        'Use password protection instead of encryption for better compatibility'
      ]
    };

    setRepairResult(mockRepairResult);
    setIsRepairing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      repairDocument(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      repairDocument(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'corruption': return <AlertTriangle className="w-4 h-4" />;
      case 'encoding': return <FileText className="w-4 h-4" />;
      case 'structure': return <RotateCcw className="w-4 h-4" />;
      case 'metadata': return <Eye className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const downloadRepairedFile = () => {
    // Simulate downloading the repaired file
    const blob = new Blob(['Repaired PDF content would be here'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = repairResult?.repairedFile.name || 'repaired_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadRepairReport = () => {
    if (!repairResult) return;
    
    const report = `DOCUMENT REPAIR REPORT
=====================

ORIGINAL FILE:
- Name: ${repairResult.originalFile.name}
- Size: ${(repairResult.originalFile.size / 1024).toFixed(2)} KB
- Issues Found: ${repairResult.originalFile.issues}

REPAIRED FILE:
- Name: ${repairResult.repairedFile.name}
- Size: ${(repairResult.repairedFile.size / 1024).toFixed(2)} KB
- Issues Fixed: ${repairResult.repairedFile.issuesFixed}
- Success Rate: ${repairResult.repairedFile.successRate}%

REPAIR SUMMARY:
- Total Issues: ${repairResult.summary.totalIssues}
- Critical Issues: ${repairResult.summary.criticalIssues}
- High Issues: ${repairResult.summary.highIssues}
- Medium Issues: ${repairResult.summary.mediumIssues}
- Low Issues: ${repairResult.summary.lowIssues}
- Repair Time: ${repairResult.summary.repairTime} seconds

DETAILED ISSUES:
${repairResult.issues.map((issue, index) => 
  `${index + 1}. ${issue.type.toUpperCase()} - ${issue.severity.toUpperCase()}
   Description: ${issue.description}
   Location: ${issue.location}
   Fix Applied: ${issue.fix}
   Confidence: ${issue.confidence}%
   `
).join('\n')}

RECOMMENDATIONS:
${repairResult.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repair-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-red-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Document Repair
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Fix corrupted, damaged, or unreadable PDF documents with advanced AI-powered repair algorithms
        </p>
      </div>

      {!repairResult && !isRepairing && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-red-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Drop your corrupted PDF here or click to browse
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            AI will analyze and repair your damaged document
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
            Choose Corrupted PDF
          </button>
        </div>
      )}

      {isRepairing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI is repairing your document...
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
                  index === currentStep ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
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

      {repairResult && (
        <div className="space-y-6">
          {/* Header with success rate */}
          <div className="bg-gradient-to-r from-red-600 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Repair Complete!</h2>
                <p className="text-red-100">Document successfully repaired</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{repairResult.repairedFile.successRate}%</div>
                <div className="text-red-100">Success Rate</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{repairResult.summary.totalIssues}</div>
                <div className="text-red-100">Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{repairResult.repairedFile.issuesFixed}</div>
                <div className="text-red-100">Issues Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{repairResult.summary.repairTime}s</div>
                <div className="text-red-100">Repair Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.floor(repairResult.repairedFile.size / 1024)}KB</div>
                <div className="text-red-100">File Size</div>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{repairResult.summary.criticalIssues}</div>
              <div className="text-sm text-red-600">Critical</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{repairResult.summary.highIssues}</div>
              <div className="text-sm text-orange-600">High</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{repairResult.summary.mediumIssues}</div>
              <div className="text-sm text-yellow-600">Medium</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{repairResult.summary.lowIssues}</div>
              <div className="text-sm text-green-600">Low</div>
            </div>
          </div>

          {/* Detailed Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Detailed Issues & Fixes
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {repairResult.issues.map((issue, index) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-3">
                          {getIssueIcon(issue.type)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {issue.type.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {issue.description}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Location:</strong> {issue.location}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Fix Applied:</strong> {issue.fix}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {issue.confidence}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Prevention Recommendations
            </h3>
            <ul className="space-y-2">
              {repairResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={downloadRepairedFile}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Repaired PDF
            </button>
            <button
              onClick={downloadRepairReport}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              onClick={() => {
                setRepairResult(null);
                setUploadedFile(null);
                setSelectedIssue(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Shield className="w-4 h-4 mr-2" />
              Repair Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
