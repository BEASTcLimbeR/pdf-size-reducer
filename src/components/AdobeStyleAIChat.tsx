'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Send, Upload, FileText, Brain, Sparkles, Download, Search, 
  BookOpen, Zap, User, Bot, Loader2, Trash2, Copy, ThumbsUp, ThumbsDown, 
  Wifi, WifiOff, ChevronDown, ChevronUp, Star, Lightbulb, Target, 
  Clock, Users, Building, Calendar, DollarSign, AlertCircle, CheckCircle,
  ArrowRight, ArrowLeft, RefreshCw, Settings, HelpCircle, Maximize2, Minimize2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: string[];
    confidence?: number;
    suggestions?: string[];
    action_items?: string[];
    document_section?: string;
  };
}

interface DocumentContext {
  file: File;
  content: string;
  pages: number;
  documentId: string;
  analysis: {
    document_type: string;
    key_topics: string[];
    entities: any;
    summary: string;
    word_count: number;
    reading_time: number;
    complexity: string;
    sentiment: string;
    confidence: number;
    visual_elements: any[];
    structure_analysis: any;
    action_items: string[];
    key_insights: string[];
  };
}

interface AdobeStyleAIChatProps {
  onReset: () => void;
}

export default function AdobeStyleAIChat({ onReset }: AdobeStyleAIChatProps) {
  const [uploadedDoc, setUploadedDoc] = useState<DocumentContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Adobe-style suggested questions
  const ADOBE_SUGGESTIONS = [
    {
      icon: BookOpen,
      text: "What is this document about?",
      category: "Overview",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      icon: Target,
      text: "What are the key action items?",
      category: "Actions",
      color: "bg-green-50 text-green-700 border-green-200"
    },
    {
      icon: Users,
      text: "Who are the key people mentioned?",
      category: "People",
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      icon: Calendar,
      text: "What are the important dates?",
      category: "Timeline",
      color: "bg-orange-50 text-orange-700 border-orange-200"
    },
    {
      icon: DollarSign,
      text: "What are the financial details?",
      category: "Finance",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      icon: AlertCircle,
      text: "What are the main risks or concerns?",
      category: "Risks",
      color: "bg-red-50 text-red-700 border-red-200"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced document analysis
  const analyzeDocument = async (file: File): Promise<DocumentContext> => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate analysis progress
      const progressSteps = [
        { step: "Uploading document...", progress: 20 },
        { step: "Extracting text content...", progress: 40 },
        { step: "Analyzing document structure...", progress: 60 },
        { step: "Identifying key topics...", progress: 80 },
        { step: "Generating insights...", progress: 100 }
      ];

      for (const { step, progress } of progressSteps) {
        setAnalysisProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mock enhanced analysis (replace with real API call)
      const analysis = {
        document_type: "Business Report",
        key_topics: ["Strategic Planning", "Market Analysis", "Financial Performance", "Risk Assessment"],
        entities: {
          persons: ["John Smith", "Sarah Johnson", "Michael Chen"],
          organizations: ["Acme Corp", "Tech Solutions Inc", "Global Partners"],
          locations: ["New York", "San Francisco", "London"],
          dates: ["2024-01-15", "Q2 2024", "December 2024"],
          money: ["$2.5M", "$500K", "$1.2M"]
        },
        summary: "This comprehensive business report analyzes our Q4 performance, highlighting significant growth in market share and revenue. The document outlines strategic initiatives for 2024, including expansion into new markets and technology investments. Key findings include a 25% increase in customer acquisition and improved operational efficiency.",
        word_count: 2847,
        reading_time: 14,
        complexity: "medium",
        sentiment: "positive",
        confidence: 0.92,
        visual_elements: [
          { type: "chart", page: 2, description: "Revenue growth chart" },
          { type: "table", page: 3, description: "Financial metrics table" }
        ],
        structure_analysis: {
          has_headings: true,
          has_lists: true,
          has_tables: true,
          paragraph_count: 24,
          sentence_count: 156
        },
        action_items: [
          "Review Q4 financial performance",
          "Prepare Q1 2024 budget proposal",
          "Schedule team meeting for strategic planning",
          "Update risk assessment documentation"
        ],
        key_insights: [
          "Strong Q4 performance with 25% growth",
          "Market expansion opportunities identified",
          "Technology investments showing positive ROI",
          "Customer satisfaction scores improved"
        ]
      };

      const documentContext: DocumentContext = {
        file,
        content: "Mock document content...",
        pages: 12,
        documentId: `doc_${Date.now()}`,
        analysis
      };

      setUploadedDoc(documentContext);
      setIsAnalyzing(false);
      
      // Add welcome message
      addMessage({
        type: 'ai',
        content: `🎉 **Document Analysis Complete!**

I've successfully analyzed your document and found some interesting insights. Here's what I discovered:

**Document Type:** ${analysis.document_type}
**Key Topics:** ${analysis.key_topics.slice(0, 3).join(', ')}
**Reading Time:** ${analysis.reading_time} minutes
**Confidence:** ${Math.round(analysis.confidence * 100)}%

I can help you explore the content, answer questions, or extract specific information. What would you like to know?`,
        metadata: {
          suggestions: ADOBE_SUGGESTIONS.slice(0, 3).map(s => s.text),
          confidence: analysis.confidence
        }
      });

      return documentContext;
    } catch (error) {
      setIsAnalyzing(false);
      throw error;
    }
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      addMessage({
        type: 'system',
        content: 'Please upload a PDF file for analysis.'
      });
      return;
    }

    try {
      await analyzeDocument(file);
    } catch (error) {
      addMessage({
        type: 'system',
        content: 'Sorry, there was an error analyzing your document. Please try again.'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);
    setIsTyping(true);

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage
    });

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response based on message content
    const aiResponse = generateAIResponse(userMessage, uploadedDoc?.analysis);
    
    setIsTyping(false);
    addMessage({
      type: 'ai',
      content: aiResponse.content,
      metadata: aiResponse.metadata
    });

    setIsProcessing(false);
  };

  const generateAIResponse = (message: string, analysis?: any) => {
    const messageLower = message.toLowerCase();
    
    if (!analysis) {
      return {
        content: "Please upload a document first so I can help you analyze it.",
        metadata: { confidence: 0.5 }
      };
    }

    // Overview questions
    if (messageLower.includes('what') && messageLower.includes('about')) {
      return {
        content: `📄 **Document Overview**

**Type:** ${analysis.document_type}
**Word Count:** ${analysis.word_count.toLocaleString()} words
**Reading Time:** ${analysis.reading_time} minutes
**Complexity:** ${analysis.complexity.charAt(0).toUpperCase() + analysis.complexity.slice(1)}
**Sentiment:** ${analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}

**Summary:**
${analysis.summary}

**Key Topics:**
${analysis.key_topics.map((topic: string) => `• ${topic}`).join('\n')}

**Structure:**
• ${analysis.structure_analysis.paragraph_count} paragraphs
• ${analysis.structure_analysis.sentence_count} sentences
• ${analysis.structure_analysis.has_headings ? 'Has headings' : 'No headings'}
• ${analysis.structure_analysis.has_tables ? 'Contains tables' : 'No tables'}`,
        metadata: {
          confidence: 0.95,
          suggestions: ["What are the main conclusions?", "What are the key recommendations?", "What is the document's purpose?"]
        }
      };
    }

    // Action items
    if (messageLower.includes('action') || messageLower.includes('task') || messageLower.includes('todo')) {
      return {
        content: `✅ **Action Items Identified**

${analysis.action_items.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')}

**Recommendations:**
• Prioritize items with deadlines
• Consider breaking complex tasks into smaller steps
• Set up follow-up reminders for important actions`,
        metadata: {
          confidence: 0.9,
          action_items: analysis.action_items,
          suggestions: ["What are the deadlines?", "Who is responsible for these tasks?", "What are the priorities?"]
        }
      };
    }

    // People/entities
    if (messageLower.includes('who') || messageLower.includes('people') || messageLower.includes('names')) {
      const entities = analysis.entities;
      let entitiesText = '';
      
      if (entities.persons?.length > 0) {
        entitiesText += `**People Mentioned:**
${entities.persons.map((person: string) => `• ${person}`).join('\n')}\n\n`;
      }
      
      if (entities.organizations?.length > 0) {
        entitiesText += `**Organizations:**
${entities.organizations.map((org: string) => `• ${org}`).join('\n')}\n\n`;
      }
      
      if (entities.locations?.length > 0) {
        entitiesText += `**Locations:**
${entities.locations.map((loc: string) => `• ${loc}`).join('\n')}\n\n`;
      }

      return {
        content: `👥 **Key People & Entities**

${entitiesText || 'No specific people or entities identified in the document.'}`,
        metadata: {
          confidence: 0.85,
          suggestions: ["What are their roles?", "How are they connected?", "What are their contact details?"]
        }
      };
    }

    // Dates
    if (messageLower.includes('date') || messageLower.includes('when') || messageLower.includes('time')) {
      const dates = analysis.entities.dates || [];
      return {
        content: `📅 **Important Dates**

${dates.length > 0 ? dates.map((date: string) => `• ${date}`).join('\n') : 'No specific dates mentioned in the document.'}

**Context:** These dates likely represent important deadlines, milestones, or reference periods.`,
        metadata: {
          confidence: 0.8,
          suggestions: ["What are these dates for?", "Are there any deadlines?", "What happened on these dates?"]
        }
      };
    }

    // Financial information
    if (messageLower.includes('financial') || messageLower.includes('money') || messageLower.includes('cost') || messageLower.includes('budget')) {
      const money = analysis.entities.money || [];
      return {
        content: `💰 **Financial Information**

${money.length > 0 ? money.map((amount: string) => `• ${amount}`).join('\n') : 'No specific financial figures mentioned in the document.'}

**Note:** These figures appear in the document content and may represent budgets, costs, revenues, or other financial metrics.`,
        metadata: {
          confidence: 0.85,
          suggestions: ["What do these amounts represent?", "Are there any budget breakdowns?", "What are the financial trends?"]
        }
      };
    }

    // Default response
    return {
      content: `🤖 **AI Assistant Response**

I understand you're asking about "${message}". Based on the document analysis, I can help you with:

• **Document Overview** - Get a comprehensive understanding
• **Key Topics** - Explore main themes and subjects  
• **Action Items** - Identify tasks and follow-ups
• **People & Entities** - Find names, organizations, locations
• **Financial Data** - Extract monetary information
• **Timeline** - Identify important dates and deadlines

What specific aspect would you like to explore?`,
      metadata: {
        confidence: 0.7,
        suggestions: ADOBE_SUGGESTIONS.slice(0, 4).map(s => s.text)
      }
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setSelectedSuggestion(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Adobe-style Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Document Assistant
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Adobe-style intelligent document analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                New Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className={`lg:col-span-2 ${isExpanded ? 'lg:col-span-3' : ''}`}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI Assistant Ready
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !uploadedDoc && (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Upload a Document to Get Started
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Upload a PDF document and I'll analyze it with Adobe-level intelligence
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                    >
                      <Upload className="h-5 w-5 inline mr-2" />
                      Choose PDF File
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Analyzing Document
                    </h3>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${analysisProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {analysisProgress}% complete
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : message.type === 'system'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && (
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {message.type === 'user' && (
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div dangerouslySetInnerHTML={{ 
                              __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\n/g, '<br/>')
                            }} />
                          </div>
                          {message.metadata?.suggestions && (
                            <div className="mt-3 space-y-1">
                              {message.metadata.suggestions.slice(0, 3).map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full mr-2 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your document..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:text-white"
                      rows={1}
                      disabled={isProcessing || !uploadedDoc}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isProcessing || !inputMessage.trim() || !uploadedDoc}
                      className="absolute right-2 top-2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Document Analysis & Suggestions */}
          {!isExpanded && (
            <div className="space-y-6">
              {/* Document Analysis Card */}
              {uploadedDoc && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Document Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</span>
                        <span className="text-sm text-gray-900 dark:text-white">{uploadedDoc.analysis.document_type}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pages</span>
                        <span className="text-sm text-gray-900 dark:text-white">{uploadedDoc.pages}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Words</span>
                        <span className="text-sm text-gray-900 dark:text-white">{uploadedDoc.analysis.word_count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reading Time</span>
                        <span className="text-sm text-gray-900 dark:text-white">{uploadedDoc.analysis.reading_time} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Complexity</span>
                        <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
                          uploadedDoc.analysis.complexity === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : uploadedDoc.analysis.complexity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {uploadedDoc.analysis.complexity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Suggestions */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Smart Suggestions
                </h3>
                
                <div className="space-y-3">
                  {ADOBE_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${suggestion.color} ${
                        selectedSuggestion === suggestion.text ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <suggestion.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium">{suggestion.text}</div>
                          <div className="text-xs opacity-75">{suggestion.category}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              {uploadedDoc && uploadedDoc.analysis.key_insights.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    Key Insights
                  </h3>
                  
                  <div className="space-y-2">
                    {uploadedDoc.analysis.key_insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
