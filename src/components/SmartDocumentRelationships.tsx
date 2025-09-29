'use client';

import { useState, useRef, useEffect } from 'react';
import { Network, Upload, FileText, Link, Merge, GitBranch, Brain, Sparkles, Download, Eye, Trash2, Plus, ArrowRight, CheckCircle, AlertCircle, Clock, Copy } from 'lucide-react';
import { documentRelationshipAI, DocumentNode, DocumentRelationship } from '../utils/documentRelationshipAI';

interface SmartDocumentRelationshipsProps {
  onReset: () => void;
}

export default function SmartDocumentRelationships({ onReset }: SmartDocumentRelationshipsProps) {
  const [documents, setDocuments] = useState<DocumentNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isAIBackendAvailable, setIsAIBackendAvailable] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check AI backend availability on component mount
  useEffect(() => {
    const checkAIBackend = async () => {
      const available = documentRelationshipAI.isAIBackendAvailable();
      setIsAIBackendAvailable(available);
      console.log('🤖 AI Backend available for document relationships:', available);
    };
    checkAIBackend();
  }, []);

  // Real AI document analysis using backend service
  const analyzeDocument = async (file: File): Promise<DocumentNode> => {
    try {
      console.log('🔍 Analyzing document with real AI:', file.name);
      return await documentRelationshipAI.analyzeDocument(file);
    } catch (error) {
      console.error('❌ AI document analysis failed:', error);
      throw error;
    }
  };

  // Find relationships between documents using AI
  const findRelationships = async (newDoc: DocumentNode, existingDocs: DocumentNode[]): Promise<DocumentRelationship[]> => {
    try {
      console.log('🔗 Finding relationships using AI for:', newDoc.name);
      return await documentRelationshipAI.findRelationships(newDoc, existingDocs);
    } catch (error) {
      console.error('❌ Relationship analysis failed:', error);
      return [];
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('Please upload PDF files');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        setAnalysisProgress((i / pdfFiles.length) * 100);
        
        try {
          // Analyze document with real AI
          const newDoc = await analyzeDocument(file);
          
          // Find relationships with existing documents using AI
          const relationships = await findRelationships(newDoc, documents);
          newDoc.relationships = relationships;
          
          // Update existing documents with reverse relationships
          const updatedDocs = documents.map(doc => {
            const reverseRelationships = relationships
              .filter(rel => rel.targetId === doc.id)
              .map(rel => ({
                ...rel,
                targetId: newDoc.id,
                description: `Related to "${newDoc.name}": ${rel.description}`
              }));
            
            return {
              ...doc,
              relationships: [...doc.relationships, ...reverseRelationships]
            };
          });

          setDocuments([...updatedDocs, newDoc]);
          console.log(`✅ Successfully analyzed ${file.name} with AI`);
          
        } catch (error) {
          console.error(`❌ Failed to analyze ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      setAnalysisProgress(100);
      console.log('🎉 Document relationship analysis completed');
      
    } catch (error) {
      console.error('❌ File upload processing failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeAction = async (docId: string, targetId: string, action: string) => {
    // Simulate action execution
    alert(`Executing ${action} action between documents. In a real implementation, this would perform the actual operation.`);
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'similar_content': return <Link className="h-4 w-4" />;
      case 'shared_entities': return <GitBranch className="h-4 w-4" />;
      case 'complementary': return <Plus className="h-4 w-4" />;
      case 'duplicate': return <Copy className="h-4 w-4" />;
      case 'version': return <Clock className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'similar_content': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'shared_entities': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'complementary': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'duplicate': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'version': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'merge': return <Merge className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      case 'compare': return <Eye className="h-4 w-4" />;
      case 'archive': return <Trash2 className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Network className="h-8 w-8 mr-3 text-blue-600" />
              Smart Document Relationships
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isAIBackendAvailable 
                ? '🤖 Real AI automatically detects relationships between your documents and suggests smart connections'
                : '📊 Smart analysis detects relationships between your documents using advanced pattern recognition'
              }
            </p>
            {isAIBackendAvailable && (
              <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-1" />
                AI Backend Connected - Advanced Analysis Available
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'network'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Network View
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDFs
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900 dark:text-blue-100">AI Detection</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Automatically finds document relationships
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Link className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900 dark:text-green-100">Smart Connections</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Suggests logical document groupings
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Merge className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900 dark:text-purple-100">Merge Opportunities</span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Identifies documents that can be combined
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900 dark:text-orange-100">Duplicate Detection</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Finds potential duplicates and versions
            </p>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf"
        multiple
        className="hidden"
      />

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Brain className="h-6 w-6 text-blue-600 mr-3 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing Document Relationships...</h3>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isAIBackendAvailable 
              ? '🤖 Real AI is analyzing content, extracting entities, and finding relationships between your documents...'
              : '📊 Advanced pattern recognition is analyzing content and finding relationships between your documents...'
            }
          </p>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length > 0 && !isAnalyzing && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.reduce((sum, doc) => sum + doc.relationships.length, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Relationships Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {documents.filter(doc => doc.relationships.some(rel => rel.suggestedAction === 'merge')).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Merge Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {documents.filter(doc => doc.relationships.some(rel => rel.type === 'duplicate')).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Potential Duplicates</div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                    {doc.relationships.length} relationships
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Topics:</h4>
                  <div className="flex flex-wrap gap-1">
                    {doc.topics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {doc.relationships.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Relationships:</h4>
                    <div className="space-y-2">
                      {doc.relationships.slice(0, 3).map((rel, index) => {
                        const targetDoc = documents.find(d => d.id === rel.targetId);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center flex-1">
                              <div className={`p-1 rounded ${getRelationshipColor(rel.type)} mr-3`}>
                                {getRelationshipIcon(rel.type)}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {targetDoc?.name || 'Unknown Document'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {rel.description}
                                </div>
                                <div className="flex items-center mt-1">
                                  <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1 mr-2">
                                    <div 
                                      className="bg-blue-600 h-1 rounded-full"
                                      style={{ width: `${rel.strength * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {Math.round(rel.strength * 100)}% match
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => executeAction(doc.id, rel.targetId, rel.suggestedAction)}
                              className="ml-3 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title={`${rel.suggestedAction} documents`}
                            >
                              {getActionIcon(rel.suggestedAction)}
                            </button>
                          </div>
                        );
                      })}
                      {doc.relationships.length > 3 && (
                        <button
                          onClick={() => setSelectedDocument(doc.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all {doc.relationships.length} relationships
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {doc.relationships.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No relationships detected</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Prompt */}
      {documents.length === 0 && !isAnalyzing && (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Network className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Discover Document Relationships
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isAIBackendAvailable 
              ? 'Upload multiple PDF documents and let real AI automatically discover relationships, suggest merges, and identify potential duplicates using advanced natural language processing.'
              : 'Upload multiple PDF documents and let our smart system discover relationships, suggest merges, and identify potential duplicates using advanced pattern recognition.'
            }
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Multiple PDFs
          </button>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 flex justify-start">
        <button
          onClick={onReset}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Tools
        </button>
      </div>
    </div>
  );
}
