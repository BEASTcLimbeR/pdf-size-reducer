'use client';

import { useState, useEffect } from 'react';
import { Zap, Brain, TrendingUp, Clock, Target, Sparkles, CheckCircle, ArrowRight, FileText, Settings, BarChart3, Lightbulb, Star, Calendar, User } from 'lucide-react';

interface UserPattern {
  id: string;
  type: 'operation' | 'timing' | 'file_type' | 'workflow';
  description: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
  examples: string[];
}

interface PredictiveSuggestion {
  id: string;
  type: 'operation' | 'workflow' | 'optimization' | 'automation';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  estimatedTimeSaving: number; // in minutes
  category: string;
  action: {
    type: 'compress' | 'merge' | 'convert' | 'workflow' | 'batch';
    parameters?: any;
  };
  priority: 'high' | 'medium' | 'low';
}

interface WorkflowStep {
  id: string;
  operation: string;
  parameters: any;
  order: number;
}

interface PredictiveProcessingProps {
  onReset: () => void;
}

export default function PredictiveProcessing({ onReset }: PredictiveProcessingProps) {
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [suggestions, setSuggestions] = useState<PredictiveSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');

  // Simulate loading user patterns and generating suggestions
  useEffect(() => {
    loadUserPatterns();
    generatePredictiveSuggestions();
  }, [selectedTimeframe]);

  const loadUserPatterns = () => {
    // Simulate loading patterns from user behavior analysis
    const mockPatterns: UserPattern[] = [
      {
        id: 'pattern_1',
        type: 'operation',
        description: 'Frequently compresses PDFs on Monday mornings',
        frequency: 0.8,
        confidence: 0.92,
        lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        examples: ['Monday 9:15 AM - Compressed 3 documents', 'Monday 9:32 AM - Compressed 5 documents']
      },
      {
        id: 'pattern_2',
        type: 'workflow',
        description: 'Usually merges documents after compression',
        frequency: 0.75,
        confidence: 0.88,
        lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        examples: ['Compress → Merge workflow used 12 times', 'Average 3.5 documents per merge']
      },
      {
        id: 'pattern_3',
        type: 'timing',
        description: 'Most active between 9-11 AM and 2-4 PM',
        frequency: 0.85,
        confidence: 0.95,
        lastSeen: new Date(),
        examples: ['Peak usage: 9:30 AM (23 operations)', 'Peak usage: 2:45 PM (18 operations)']
      },
      {
        id: 'pattern_4',
        type: 'file_type',
        description: 'Prefers medium quality compression for reports',
        frequency: 0.9,
        confidence: 0.87,
        lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000),
        examples: ['Reports always compressed at 70% quality', '15 report files processed this way']
      }
    ];

    setUserPatterns(mockPatterns);
  };

  const generatePredictiveSuggestions = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockSuggestions: PredictiveSuggestion[] = [
        {
          id: 'suggestion_1',
          type: 'workflow',
          title: 'Automated Monday Morning Batch',
          description: 'Create an automated workflow for your Monday morning document processing routine',
          confidence: 0.92,
          reasoning: 'You consistently compress and merge documents every Monday morning around 9:15 AM',
          estimatedTimeSaving: 15,
          category: 'Automation',
          action: {
            type: 'workflow',
            parameters: {
              schedule: 'monday_9am',
              operations: ['compress', 'merge'],
              quality: 'medium'
            }
          },
          priority: 'high'
        },
        {
          id: 'suggestion_2',
          type: 'optimization',
          title: 'Smart Quality Presets',
          description: 'Set up intelligent quality presets based on document types',
          confidence: 0.87,
          reasoning: 'Your compression quality choices follow consistent patterns based on document content',
          estimatedTimeSaving: 8,
          category: 'Efficiency',
          action: {
            type: 'compress',
            parameters: {
              smart_presets: true,
              report_quality: 'medium',
              presentation_quality: 'high'
            }
          },
          priority: 'medium'
        },
        {
          id: 'suggestion_3',
          type: 'operation',
          title: 'Batch Process Similar Documents',
          description: 'Process documents with similar names together automatically',
          confidence: 0.79,
          reasoning: 'You often process documents with similar naming patterns in sequence',
          estimatedTimeSaving: 12,
          category: 'Batch Processing',
          action: {
            type: 'batch',
            parameters: {
              group_by_name: true,
              auto_merge: true
            }
          },
          priority: 'medium'
        },
        {
          id: 'suggestion_4',
          type: 'automation',
          title: 'Peak Hours Optimization',
          description: 'Pre-load tools and optimize performance during your peak usage hours',
          confidence: 0.95,
          reasoning: 'You have consistent peak usage patterns that could benefit from performance optimization',
          estimatedTimeSaving: 5,
          category: 'Performance',
          action: {
            type: 'workflow',
            parameters: {
              preload_times: ['9:00', '14:00'],
              optimize_memory: true
            }
          },
          priority: 'low'
        }
      ];

      setSuggestions(mockSuggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }));
      setIsAnalyzing(false);
    }, 1500);
  };

  const implementSuggestion = (suggestion: PredictiveSuggestion) => {
    // Simulate implementing the suggestion
    alert(`Implementing: ${suggestion.title}\n\nThis would set up the automated workflow based on your usage patterns. In a real implementation, this would configure the actual automation.`);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'operation': return <Zap className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'file_type': return <FileText className="h-4 w-4" />;
      case 'workflow': return <ArrowRight className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const totalTimeSavings = suggestions.reduce((sum, s) => sum + s.estimatedTimeSaving, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Brain className="h-8 w-8 mr-3 text-purple-600" />
              Predictive Processing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI learns your patterns and suggests operations before you think of them
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setSelectedTimeframe('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTimeframe === 'week'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedTimeframe('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTimeframe === 'month'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedTimeframe('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTimeframe === 'all'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                All Time
              </button>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={learningEnabled}
                onChange={(e) => setLearningEnabled(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Learning</span>
            </label>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-900 dark:text-purple-100">Patterns Learned</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{userPatterns.length}</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Lightbulb className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900 dark:text-green-100">Active Suggestions</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">{suggestions.length}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Time Savings</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalTimeSavings}min</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-900 dark:text-orange-100">Efficiency Gain</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">+{Math.round(totalTimeSavings * 1.2)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Predictive Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              AI Suggestions
            </h2>
            {isAnalyzing && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Brain className="h-4 w-4 mr-1 animate-pulse" />
                Analyzing patterns...
              </div>
            )}
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg mr-3">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{suggestion.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{suggestion.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Star className="h-4 w-4 mr-1" />
                      {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3">{suggestion.description}</p>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI Reasoning:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.reasoning}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <Clock className="h-4 w-4 mr-1" />
                    Saves ~{suggestion.estimatedTimeSaving} minutes
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => implementSuggestion(suggestion)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {suggestions.length === 0 && !isAnalyzing && (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Suggestions Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use DocNestly more to help AI learn your patterns and generate personalized suggestions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Patterns */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Learned Patterns
          </h2>

          <div className="space-y-4">
            {userPatterns.map((pattern) => (
              <div key={pattern.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded mr-3">
                      {getPatternIcon(pattern.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{pattern.description}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{pattern.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">{Math.round(pattern.confidence * 100)}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">confidence</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Frequency</span>
                    <span>{Math.round(pattern.frequency * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${pattern.frequency * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="mb-1">Last seen: {pattern.lastSeen.toLocaleDateString()}</div>
                  <div>Examples: {pattern.examples.length} recorded instances</div>
                </div>
              </div>
            ))}
          </div>

          {/* Learning Settings */}
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Learning Settings
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Track operation patterns</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Learn timing preferences</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Analyze file type patterns</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Generate workflow suggestions</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Reset all learned patterns
              </button>
            </div>
          </div>
        </div>
      </div>

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
