// Enhanced Document Summarizer - QuillBot-style summarization for multiple file formats
import { PDFTextExtractor } from './pdfTextExtractor';

export interface SummarizationOptions {
  summaryLength: 'short' | 'medium' | 'long';
  focusMode: 'key_points' | 'balanced' | 'comprehensive';
  includeBullets: boolean;
  includeNumbers: boolean;
  highlightImportant: boolean;
}

export interface DocumentSummary {
  originalText: string;
  summary: string;
  keyPoints: string[];
  wordCount: {
    original: number;
    summary: number;
    reduction: number;
  };
  readingTime: {
    original: number;
    summary: number;
  };
  confidence: number;
  processingTime: number;
}

export interface FileAnalysis {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'txt';
  content: string;
  pages: number;
  wordCount: number;
  extractedData: any;
}

class EnhancedSummarizer {
  private static instance: EnhancedSummarizer;

  private constructor() {}

  static getInstance(): EnhancedSummarizer {
    if (!EnhancedSummarizer.instance) {
      EnhancedSummarizer.instance = new EnhancedSummarizer();
    }
    return EnhancedSummarizer.instance;
  }

  /**
   * Analyze and extract content from various file formats
   */
  async analyzeFile(file: File): Promise<FileAnalysis> {
    const fileName = file.name.toLowerCase();
    let fileType: FileAnalysis['fileType'];
    let content = '';
    let pages = 1;
    let extractedData: any = {};

    try {
      if (fileName.endsWith('.pdf')) {
        fileType = 'pdf';
        try {
          const pdfData = await PDFTextExtractor.extractTextFromPDF(file);
          content = pdfData.text;
          pages = pdfData.pages;
          extractedData = {
            topics: PDFTextExtractor.extractTopics(pdfData.text, 'PDF'),
            dates: PDFTextExtractor.extractDates(pdfData.text),
            contacts: PDFTextExtractor.extractContacts(pdfData.text),
            financial: PDFTextExtractor.extractFinancial(pdfData.text),
            entities: [
              ...PDFTextExtractor.extractDates(pdfData.text),
              ...PDFTextExtractor.extractContacts(pdfData.text),
              ...PDFTextExtractor.extractFinancial(pdfData.text)
            ]
          };
        } catch (pdfError) {
          console.error('PDF extraction failed:', pdfError);
          // Fallback for PDF extraction
          content = `PDF content from ${file.name} - Error extracting text: ${pdfError}`;
          pages = Math.ceil(file.size / 50000);
          extractedData = { 
            type: 'pdf', 
            size: file.size, 
            error: pdfError,
            topics: [],
            dates: [],
            contacts: [],
            financial: [],
            entities: []
          };
        }
      } else if (fileName.endsWith('.docx')) {
        fileType = 'docx';
        try {
          const docxData = await this.extractFromDocx(file);
          content = docxData.text;
          pages = docxData.pages;
          extractedData = docxData;
        } catch (docxError) {
          console.error('DOCX extraction failed:', docxError);
          content = `DOCX content from ${file.name} - Error extracting text: ${docxError}`;
          pages = Math.ceil(file.size / 50000);
          extractedData = { type: 'docx', size: file.size, error: docxError };
        }
      } else if (fileName.endsWith('.xlsx')) {
        fileType = 'xlsx';
        try {
          const xlsxData = await this.extractFromXlsx(file);
          content = xlsxData.text;
          pages = xlsxData.sheets;
          extractedData = xlsxData;
        } catch (xlsxError) {
          console.error('XLSX extraction failed:', xlsxError);
          content = `Excel data from ${file.name} - Error extracting text: ${xlsxError}`;
          pages = Math.ceil(file.size / 100000);
          extractedData = { type: 'xlsx', size: file.size, error: xlsxError };
        }
      } else if (fileName.endsWith('.txt')) {
        fileType = 'txt';
        try {
          content = await this.extractFromTxt(file);
          pages = Math.ceil(content.length / 2000);
          extractedData = { rawText: content };
        } catch (txtError) {
          console.error('TXT extraction failed:', txtError);
          content = `Text content from ${file.name} - Error reading file: ${txtError}`;
          pages = 1;
          extractedData = { type: 'txt', size: file.size, error: txtError };
        }
      } else {
        throw new Error('Unsupported file format');
      }

      return {
        fileName: file.name,
        fileType,
        content,
        pages,
        wordCount: this.countWords(content),
        extractedData
      };
    } catch (error) {
      console.error('File analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate QuillBot-style summary with multiple options
   */
  async generateSummary(
    fileAnalysis: FileAnalysis, 
    options: SummarizationOptions = {
      summaryLength: 'medium',
      focusMode: 'balanced',
      includeBullets: true,
      includeNumbers: true,
      highlightImportant: true
    }
  ): Promise<DocumentSummary> {
    const startTime = Date.now();
    
    try {
      const { content, wordCount } = fileAnalysis;
      
      // Step 1: Extract key sentences using advanced algorithms
      const keySentences = this.extractKeySentences(content, options);
      
      // Step 2: Generate summary based on length preference
      const summary = this.generateSummaryText(keySentences, content, options);
      
      // Step 3: Extract key points
      const keyPoints = this.extractKeyPoints(content, options);
      
      // Step 4: Calculate metrics
      const summaryWordCount = this.countWords(summary);
      const reduction = ((wordCount - summaryWordCount) / wordCount) * 100;
      
      const processingTime = Date.now() - startTime;
      
      return {
        originalText: content,
        summary,
        keyPoints,
        wordCount: {
          original: wordCount,
          summary: summaryWordCount,
          reduction: Math.round(reduction)
        },
        readingTime: {
          original: Math.ceil(wordCount / 200),
          summary: Math.ceil(summaryWordCount / 200)
        },
        confidence: this.calculateConfidence(content, summary, keyPoints),
        processingTime
      };
      
    } catch (error) {
      console.error('Summarization failed:', error);
      throw error;
    }
  }

  /**
   * Extract key sentences using TF-IDF and position-based scoring
   */
  private extractKeySentences(content: string, options: SummarizationOptions): string[] {
    const sentences = this.splitIntoSentences(content);
    if (sentences.length <= 3) return sentences;

    // Calculate sentence scores
    const sentenceScores = sentences.map((sentence, index) => {
      const positionScore = this.calculatePositionScore(index, sentences.length);
      const lengthScore = this.calculateLengthScore(sentence);
      const keywordScore = this.calculateKeywordScore(sentence, content);
      const structureScore = this.calculateStructureScore(sentence);
      
      return {
        sentence,
        score: positionScore + lengthScore + keywordScore + structureScore
      };
    });

    // Sort by score and select top sentences
    const sortedSentences = sentenceScores.sort((a, b) => b.score - a.score);
    
    const targetCount = this.getTargetSentenceCount(sentences.length, options.summaryLength);
    return sortedSentences.slice(0, targetCount).map(s => s.sentence);
  }

  /**
   * Generate summary text with formatting
   */
  private generateSummaryText(keySentences: string[], originalContent: string, options: SummarizationOptions): string {
    let summary = keySentences.join(' ');
    
    // Apply focus mode adjustments
    if (options.focusMode === 'key_points') {
      summary = this.enhanceForKeyPoints(summary, originalContent);
    } else if (options.focusMode === 'comprehensive') {
      summary = this.enhanceForComprehensive(summary, originalContent);
    }
    
    // Add formatting
    if (options.includeBullets) {
      summary = this.addBulletPoints(summary);
    }
    
    if (options.highlightImportant) {
      summary = this.highlightImportantTerms(summary);
    }
    
    return summary;
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string, options: SummarizationOptions): string[] {
    const sentences = this.splitIntoSentences(content);
    const keyPoints: string[] = [];
    
    // Extract sentences that contain important indicators
    const importantPatterns = [
      /(?:important|key|main|primary|essential|critical)/i,
      /(?:conclusion|summary|overview|introduction)/i,
      /(?:therefore|thus|hence|consequently)/i,
      /(?:first|second|third|finally|lastly)/i,
      /(?:note|notice|remember|consider)/i
    ];
    
    sentences.forEach(sentence => {
      if (importantPatterns.some(pattern => pattern.test(sentence))) {
        keyPoints.push(sentence.trim());
      }
    });
    
    // If no key points found, use top sentences
    if (keyPoints.length === 0) {
      const topSentences = this.extractKeySentences(content, options);
      keyPoints.push(...topSentences.slice(0, 5));
    }
    
    return keyPoints.slice(0, 8); // Limit to 8 key points
  }

  /**
   * Calculate position-based score (beginning and end sentences are more important)
   */
  private calculatePositionScore(index: number, totalSentences: number): number {
    const position = index / totalSentences;
    if (position < 0.1 || position > 0.9) return 0.3; // Beginning or end
    if (position < 0.2 || position > 0.8) return 0.2; // Near beginning or end
    return 0.1; // Middle
  }

  /**
   * Calculate length-based score (medium length sentences are preferred)
   */
  private calculateLengthScore(sentence: string): number {
    const wordCount = sentence.split(' ').length;
    if (wordCount >= 10 && wordCount <= 25) return 0.3;
    if (wordCount >= 5 && wordCount <= 35) return 0.2;
    return 0.1;
  }

  /**
   * Calculate keyword-based score
   */
  private calculateKeywordScore(sentence: string, fullContent: string): number {
    const words = sentence.toLowerCase().split(' ');
    const contentWords = fullContent.toLowerCase().split(' ');
    
    // Count word frequency in full content
    const wordFreq: { [key: string]: number } = {};
    contentWords.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Calculate score based on word frequency
    let score = 0;
    words.forEach(word => {
      if (word.length > 3 && wordFreq[word]) {
        score += Math.min(wordFreq[word] / 10, 0.1);
      }
    });
    
    return Math.min(score, 0.4);
  }

  /**
   * Calculate structure-based score
   */
  private calculateStructureScore(sentence: string): number {
    let score = 0;
    
    // Sentences with numbers are often important
    if (/\d+/.test(sentence)) score += 0.1;
    
    // Sentences with specific patterns
    if (/(?:is|are|was|were|will be|can be|should be)/i.test(sentence)) score += 0.1;
    
    // Sentences with lists or enumerations
    if (/(?:first|second|third|1\.|2\.|3\.|•|▪|▫)/i.test(sentence)) score += 0.1;
    
    return Math.min(score, 0.2);
  }

  /**
   * Get target sentence count based on summary length
   */
  private getTargetSentenceCount(totalSentences: number, summaryLength: string): number {
    const ratios = {
      short: 0.2,
      medium: 0.4,
      long: 0.6
    };
    
    const target = Math.ceil(totalSentences * ratios[summaryLength as keyof typeof ratios]);
    return Math.max(2, Math.min(target, totalSentences));
  }

  /**
   * Enhance summary for key points focus
   */
  private enhanceForKeyPoints(summary: string, originalContent: string): string {
    // Extract more specific key information
    const keyTerms = this.extractKeyTerms(originalContent);
    return `**Key Points Summary:**\n\n${summary}\n\n**Important Terms:** ${keyTerms.join(', ')}`;
  }

  /**
   * Enhance summary for comprehensive focus
   */
  private enhanceForComprehensive(summary: string, originalContent: string): string {
    const topics = this.extractTopics(originalContent);
    return `**Comprehensive Summary:**\n\n${summary}\n\n**Main Topics Covered:** ${topics.join(', ')}`;
  }

  /**
   * Add bullet points to summary
   */
  private addBulletPoints(summary: string): string {
    const sentences = this.splitIntoSentences(summary);
    return sentences.map(sentence => `• ${sentence.trim()}`).join('\n');
  }

  /**
   * Highlight important terms
   */
  private highlightImportantTerms(summary: string): string {
    const importantWords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant'];
    let highlighted = summary;
    
    importantWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `**${word}**`);
    });
    
    return highlighted;
  }

  /**
   * Extract key terms from content
   */
  private extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (word.length > 4 && !this.isStopWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract topics from content
   */
  private extractTopics(content: string): string[] {
    // Simple topic extraction based on capitalized words and common patterns
    const sentences = this.splitIntoSentences(content);
    const topics: string[] = [];
    
    sentences.forEach(sentence => {
      const capitalizedWords = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
      if (capitalizedWords) {
        topics.push(...capitalizedWords.slice(0, 2));
      }
    });
    
    return [...new Set(topics)].slice(0, 5);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(originalText: string, summary: string, keyPoints: string[]): number {
    const originalWords = this.countWords(originalText);
    const summaryWords = this.countWords(summary);
    
    // Base confidence on summary quality
    let confidence = 0.7;
    
    // Increase confidence if summary is appropriate length
    const ratio = summaryWords / originalWords;
    if (ratio >= 0.1 && ratio <= 0.5) confidence += 0.2;
    
    // Increase confidence if key points are extracted
    if (keyPoints.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Extract content from DOCX files using mammoth.js
   */
  private async extractFromDocx(file: File): Promise<{ text: string; pages: number; [key: string]: any }> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        text: result.value,
        pages: Math.ceil(result.value.length / 2000), // Estimate pages
        extractedData: { 
          type: 'docx', 
          size: file.size,
          messages: result.messages || []
        }
      };
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      return {
        text: `DOCX content from ${file.name} - Error extracting text: ${error}`,
        pages: Math.ceil(file.size / 50000),
        extractedData: { type: 'docx', size: file.size, error: error }
      };
    }
  }

  /**
   * Extract content from XLSX files using xlsx library
   */
  private async extractFromXlsx(file: File): Promise<{ text: string; sheets: number; [key: string]: any }> {
    try {
      // XLSX library removed due to security vulnerability
      // Return basic file info instead
      return {
        text: `Excel file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        sheets: 1,
        message: 'Excel processing temporarily unavailable due to security update'
      };
    } catch (error) {
      console.error('XLSX extraction failed:', error);
      return {
        text: `Excel data from ${file.name} - Error extracting text: ${error}`,
        sheets: Math.ceil(file.size / 100000),
        extractedData: { type: 'xlsx', size: file.size, error: error }
      };
    }
  }

  /**
   * Extract content from TXT files
   */
  private async extractFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export const enhancedSummarizer = EnhancedSummarizer.getInstance();
