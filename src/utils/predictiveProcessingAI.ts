'use client';

export interface UserAction {
  toolId: string;
  action: string; // e.g., 'file_uploaded', 'conversion_started', 'document_merged'
  timestamp: string;
  metadata?: Record<string, any>; // Additional context like file type, size, options
}

export interface PredictivePattern {
  id: string;
  type: 'operation' | 'workflow' | 'timing' | 'file_type';
  description: string;
  frequency: number; // 0-1
  confidence: number; // 0-1
  lastSeen: string;
  examples: string[];
  suggestedAction?: SuggestedAction;
}

export interface SuggestedAction {
  id: string;
  toolId: string;
  name: string;
  description: string;
  confidence: number;
  reasoning: string;
  estimatedSavings?: string; // e.g., "30 seconds per document"
  cta: string; // Call to action
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface UserInsights {
  totalActions: number;
  mostUsedTool: string;
  averageSessionLength: number;
  peakUsageHours: string[];
  commonWorkflows: string[];
  efficiencyScore: number;
}

class PredictiveProcessingAI {
  private baseUrl: string;
  private isOnline: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.checkBackendStatus();
  }

  private async checkBackendStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      // Silently handle backend unavailability
    }
  }

  async trackUserAction(action: UserAction): Promise<void> {
    try {
      if (!this.isOnline) {
        // Store in localStorage as fallback
        this.storeActionLocally(action);
        return;
      }

      const response = await fetch(`${this.baseUrl}/track-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Tracked action: ${action.toolId} - ${action.action}`);
    } catch (error) {
      console.error('❌ Failed to track user action:', error);
      // Fallback to localStorage
      this.storeActionLocally(action);
    }
  }

  private storeActionLocally(action: UserAction): void {
    try {
      const stored = localStorage.getItem('predictive_actions');
      const actions = stored ? JSON.parse(stored) : [];
      actions.push(action);
      
      // Keep only last 100 actions to prevent localStorage bloat
      if (actions.length > 100) {
        actions.splice(0, actions.length - 100);
      }
      
      localStorage.setItem('predictive_actions', JSON.stringify(actions));
      console.log(`📱 Stored action locally: ${action.toolId} - ${action.action}`);
    } catch (error) {
      console.error('Failed to store action locally:', error);
    }
  }

  async getPredictivePatterns(): Promise<PredictivePattern[]> {
    try {
      if (!this.isOnline) {
        return this.getLocalPatterns();
      }

      const response = await fetch(`${this.baseUrl}/patterns`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const patterns = await response.json();
      console.log(`📊 Fetched ${patterns.length} predictive patterns`);
      return patterns;
    } catch (error) {
      console.error('Failed to fetch predictive patterns:', error);
      return this.getLocalPatterns();
    }
  }

  async getSuggestedActions(): Promise<SuggestedAction[]> {
    try {
      if (!this.isOnline) {
        return this.getLocalSuggestions();
      }

      const response = await fetch(`${this.baseUrl}/suggestions`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const suggestions = await response.json();
      console.log(`💡 Fetched ${suggestions.length} suggested actions`);
      return suggestions;
    } catch (error) {
      console.error('Failed to fetch suggested actions:', error);
      return this.getLocalSuggestions();
    }
  }

  async getUserInsights(): Promise<UserInsights> {
    try {
      if (!this.isOnline) {
        return this.getLocalInsights();
      }

      const response = await fetch(`${this.baseUrl}/insights`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user insights:', error);
      return this.getLocalInsights();
    }
  }

  private getLocalPatterns(): PredictivePattern[] {
    try {
      const stored = localStorage.getItem('predictive_actions');
      const actions = stored ? JSON.parse(stored) : [];
      
      if (actions.length === 0) {
        return [];
      }

      // Simple pattern detection from local data
      const patterns: PredictivePattern[] = [];
      const toolCounts: Record<string, number> = {};
      const actionCounts: Record<string, number> = {};

      actions.forEach((action: UserAction) => {
        toolCounts[action.toolId] = (toolCounts[action.toolId] || 0) + 1;
        actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
      });

      // Most used tool pattern
      const mostUsedTool = Object.entries(toolCounts).reduce((a, b) => 
        toolCounts[a[0]] > toolCounts[b[0]] ? a : b
      );

      if (mostUsedTool[1] > 3) {
        patterns.push({
          id: 'local-pattern-1',
          type: 'operation',
          description: `You frequently use the ${mostUsedTool[0]} tool`,
          frequency: Math.min(mostUsedTool[1] / actions.length, 1),
          confidence: 0.8,
          lastSeen: new Date().toISOString(),
          examples: [`Used ${mostUsedTool[0]} ${mostUsedTool[1]} times`]
        });
      }

      return patterns;
    } catch (error) {
      console.error('Failed to generate local patterns:', error);
      return [];
    }
  }

  private getLocalSuggestions(): SuggestedAction[] {
    try {
      const stored = localStorage.getItem('predictive_actions');
      const actions = stored ? JSON.parse(stored) : [];
      
      if (actions.length === 0) {
        return [];
      }

      const suggestions: SuggestedAction[] = [];

      // Suggest based on recent actions
      const recentActions = actions.slice(-10);
      const toolCounts: Record<string, number> = {};

      recentActions.forEach((action: UserAction) => {
        toolCounts[action.toolId] = (toolCounts[action.toolId] || 0) + 1;
      });

      // If user uploads many files, suggest compression
      if (toolCounts['pdf-uploader'] > 2) {
        suggestions.push({
          id: 'local-suggest-1',
          toolId: 'compress',
          name: 'Compress Your PDFs',
          description: 'You\'ve uploaded several PDF files. Compressing them can save space and improve performance.',
          confidence: 0.8,
          reasoning: 'Multiple file uploads detected',
          estimatedSavings: 'Up to 70% file size reduction',
          cta: 'Go to Compress PDF',
          priority: 'high',
          category: 'Efficiency'
        });
      }

      // If user merges files, suggest batch processing
      if (toolCounts['merge-pdf'] > 1) {
        suggestions.push({
          id: 'local-suggest-2',
          toolId: 'batch-processing',
          name: 'Try Batch Processing',
          description: 'You frequently merge documents. Batch processing can automate this workflow.',
          confidence: 0.7,
          reasoning: 'Frequent merge operations detected',
          estimatedSavings: 'Save 5-10 minutes per batch',
          cta: 'Go to Batch Processing',
          priority: 'medium',
          category: 'Automation'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to generate local suggestions:', error);
      return [];
    }
  }

  private getLocalInsights(): UserInsights {
    try {
      const stored = localStorage.getItem('predictive_actions');
      const actions = stored ? JSON.parse(stored) : [];
      
      const toolCounts: Record<string, number> = {};
      const hours: number[] = [];

      actions.forEach((action: UserAction) => {
        toolCounts[action.toolId] = (toolCounts[action.toolId] || 0) + 1;
        const hour = new Date(action.timestamp).getHours();
        hours.push(hour);
      });

      const mostUsedTool = Object.entries(toolCounts).reduce((a, b) => 
        toolCounts[a[0]] > toolCounts[b[0]] ? a : b, ['none', 0]
      );

      // Calculate peak hours
      const hourCounts: Record<number, number> = {};
      hours.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      return {
        totalActions: actions.length,
        mostUsedTool: mostUsedTool[0],
        averageSessionLength: 15, // Mock data
        peakUsageHours: peakHours,
        commonWorkflows: ['upload → compress', 'upload → merge'],
        efficiencyScore: Math.min(actions.length * 10, 100)
      };
    } catch (error) {
      console.error('Failed to generate local insights:', error);
      return {
        totalActions: 0,
        mostUsedTool: 'none',
        averageSessionLength: 0,
        peakUsageHours: [],
        commonWorkflows: [],
        efficiencyScore: 0
      };
    }
  }

  async clearUserData(): Promise<void> {
    try {
      localStorage.removeItem('predictive_actions');
      console.log('🧹 Cleared local user data');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }
}

// Export a singleton instance
export const predictiveProcessingAI = new PredictiveProcessingAI(
  process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8000/predictive-processing'
);
