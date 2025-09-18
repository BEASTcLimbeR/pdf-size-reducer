// REAL PDF Text Extraction - Actually reads PDF content for accurate responses

export interface RealPDFContent {
  text: string;
  pages: number;
  wordCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
  extractedEntities: {
    dates: string[];
    emails: string[];
    phones: string[];
    names: string[];
    amounts: string[];
    addresses: string[];
  };
}

export class RealPDFExtractor {
  private static pdfjsLib: any = null;

  // Initialize PDF.js only when needed
  private static async initializePDFJS() {
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction only works in browser');
    }

    if (!this.pdfjsLib) {
      this.pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
    }

    return this.pdfjsLib;
  }

  // Extract REAL content from PDF
  static async extractRealContent(file: File): Promise<RealPDFContent> {
    try {
      console.log('📄 Starting REAL PDF content extraction...');
      
      const pdfjs = await this.initializePDFJS();
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('📖 Loading PDF document...');
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`📊 PDF loaded successfully: ${pdf.numPages} pages`);
      
      let fullText = '';
      const pageTexts: string[] = [];
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`📝 Extracting page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => {
              // Handle text positioning for better readability
              return item.str;
            })
            .filter((text: string) => text.trim().length > 0)
            .join(' ');
          
          pageTexts.push(pageText);
          fullText += pageText + '\n\n';
          
          console.log(`✅ Page ${pageNum}: ${pageText.split(' ').length} words extracted`);
          
        } catch (pageError) {
          console.error(`❌ Error extracting page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      // Clean up the extracted text
      const cleanedText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Count actual words
      const words = cleanedText.split(/\s+/).filter(word => 
        word.length > 0 && /[a-zA-Z0-9]/.test(word)
      );
      const wordCount = words.length;

      // Extract metadata
      const metadata = pdf.metadata ? {
        title: pdf.metadata.get('dc:title') || pdf.metadata.get('Title') || '',
        author: pdf.metadata.get('dc:creator') || pdf.metadata.get('Author') || '',
        creationDate: pdf.metadata.get('dc:date') || pdf.metadata.get('CreationDate') || ''
      } : {};

      // Extract real entities from actual text
      const extractedEntities = this.extractRealEntities(cleanedText);

      console.log(`✅ REAL extraction complete: ${wordCount} words from ${pdf.numPages} pages`);
      console.log(`📊 Found ${extractedEntities.dates.length} dates, ${extractedEntities.emails.length} emails, ${extractedEntities.amounts.length} amounts`);

      return {
        text: cleanedText,
        pages: pdf.numPages,
        wordCount,
        metadata,
        extractedEntities
      };

    } catch (error) {
      console.error('❌ Real PDF extraction failed:', error);
      throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Extract REAL entities from actual PDF text
  private static extractRealEntities(text: string): {
    dates: string[];
    emails: string[];
    phones: string[];
    names: string[];
    amounts: string[];
    addresses: string[];
  } {
    const entities = {
      dates: [] as string[],
      emails: [] as string[],
      phones: [] as string[],
      names: [] as string[],
      amounts: [] as string[],
      addresses: [] as string[]
    };

    // Extract dates (multiple formats)
    const datePatterns = [
      /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g,
      /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
      /\bQ[1-4]\s+\d{4}\b/gi,
      /\b(?:FY|fiscal year)\s*\d{4}\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.dates.push(...matches);
    });

    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern) || [];
    entities.emails.push(...emails);

    // Extract phone numbers
    const phonePatterns = [
      /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
    ];

    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.phones.push(...matches);
    });

    // Extract names (proper nouns that look like names)
    const namePattern = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g;
    const names = text.match(namePattern) || [];
    // Filter out common non-names
    const filteredNames = names.filter(name => 
      !name.includes('United States') && 
      !name.includes('New York') && 
      !name.includes('Los Angeles') &&
      !name.toLowerCase().includes('company') &&
      !name.toLowerCase().includes('corporation')
    );
    entities.names.push(...filteredNames);

    // Extract monetary amounts
    const amountPatterns = [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?|EUR|euros?)/gi,
      /(?:total|amount|cost|price|budget|revenue|profit|loss):\s*\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi
    ];

    amountPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.amounts.push(...matches);
    });

    // Extract addresses
    const addressPattern = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl),?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/g;
    const addresses = text.match(addressPattern) || [];
    entities.addresses.push(...addresses);

    // Remove duplicates and limit results
    entities.dates = [...new Set(entities.dates)].slice(0, 10);
    entities.emails = [...new Set(entities.emails)].slice(0, 5);
    entities.phones = [...new Set(entities.phones)].slice(0, 5);
    entities.names = [...new Set(entities.names)].slice(0, 8);
    entities.amounts = [...new Set(entities.amounts)].slice(0, 8);
    entities.addresses = [...new Set(entities.addresses)].slice(0, 3);

    return entities;
  }

  // Generate intelligent summary from REAL content
  static generateRealSummary(text: string, documentType: string): string {
    // Extract first meaningful paragraph
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
    const firstParagraph = paragraphs[0] || text.substring(0, 300);

    // Extract key sentences
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const meaningfulSentences = sentences
      .filter(s => s.trim().length > 20 && s.trim().length < 200)
      .slice(0, 3);

    if (meaningfulSentences.length > 0) {
      const summary = meaningfulSentences.join(' ').trim();
      return summary.length > 400 ? summary.substring(0, 400) + '...' : summary;
    }

    return firstParagraph.length > 300 ? firstParagraph.substring(0, 300) + '...' : firstParagraph;
  }

  // Extract real topics from actual content
  static extractRealTopics(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !this.isStopWord(word));

    // Count word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top words and convert to meaningful topics
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => this.wordToMeaningfulTopic(word, text));

    return [...new Set(topWords)].slice(0, 5);
  }

  private static wordToMeaningfulTopic(word: string, context: string): string {
    const contextLower = context.toLowerCase();
    
    // Context-aware topic generation
    if (word === 'financial' || word === 'budget' || word === 'revenue') {
      if (contextLower.includes('quarterly') || contextLower.includes('annual')) {
        return 'Financial Performance Analysis';
      } else if (contextLower.includes('planning') || contextLower.includes('forecast')) {
        return 'Financial Planning & Forecasting';
      }
      return 'Financial Management';
    }
    
    if (word === 'project' || word === 'management') {
      if (contextLower.includes('timeline') || contextLower.includes('schedule')) {
        return 'Project Timeline Management';
      } else if (contextLower.includes('resource') || contextLower.includes('allocation')) {
        return 'Resource Management';
      }
      return 'Project Management';
    }
    
    if (word === 'market' || word === 'customer') {
      if (contextLower.includes('analysis') || contextLower.includes('research')) {
        return 'Market Research & Analysis';
      } else if (contextLower.includes('strategy') || contextLower.includes('positioning')) {
        return 'Market Strategy';
      }
      return 'Market Intelligence';
    }

    // Default meaningful topic generation
    const topicMappings: { [key: string]: string } = {
      'business': 'Business Strategy & Operations',
      'strategy': 'Strategic Planning & Development', 
      'analysis': 'Data Analysis & Insights',
      'performance': 'Performance Metrics & KPIs',
      'operations': 'Operational Excellence',
      'development': 'Development & Implementation',
      'quality': 'Quality Assurance & Standards',
      'technology': 'Technology Integration',
      'service': 'Service Delivery & Management',
      'customer': 'Customer Relations & Experience',
      'compliance': 'Compliance & Regulatory Affairs',
      'security': 'Security & Risk Management',
      'training': 'Training & Development',
      'research': 'Research & Innovation'
    };

    return topicMappings[word] || `${word.charAt(0).toUpperCase() + word.slice(1)} Analysis`;
  }

  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 
      'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 
      'see', 'two', 'way', 'who', 'did', 'she', 'use', 'your', 'each', 'word', 'which', 'their', 
      'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 
      'many', 'some', 'these', 'then', 'them', 'than', 'been', 'have', 'were', 'said', 'what', 
      'from', 'they', 'this', 'that', 'with', 'into', 'more', 'very', 'when', 'come', 'made', 
      'also', 'like', 'over', 'such', 'take', 'only', 'think', 'work', 'life', 'even', 'back',
      'document', 'page', 'section', 'information', 'content', 'data', 'text', 'file'
    ]);
    return stopWords.has(word);
  }

  // Answer questions based on REAL PDF content
  static answerQuestionFromContent(question: string, content: RealPDFContent): string {
    const lowerQuestion = question.toLowerCase();
    const text = content.text;
    const entities = content.extractedEntities;

    console.log('🤖 Answering question based on REAL PDF content...');

    // Date-related questions
    if (lowerQuestion.includes('date') || lowerQuestion.includes('when') || lowerQuestion.includes('time')) {
      if (entities.dates.length > 0) {
        return `📅 **Dates Found in Document** (Real Content)

**Actual Dates Mentioned:**
${entities.dates.map(date => `• ${date}`).join('\n')}

**Context Analysis:** These dates appear in the actual document content and likely represent important deadlines, milestones, or reference periods.

**Document Analysis:** Found ${entities.dates.length} specific date references across ${content.pages} pages of content.`;
      } else {
        return `📅 **Date Analysis** (Real Content)

**No Specific Dates Found:** After analyzing the complete ${content.wordCount.toLocaleString()}-word document, no explicit dates were identified in the text content.

**Alternative Temporal References:** The document may contain relative time references or general timeframes that don't follow standard date formats.`;
      }
    }

    // Contact information questions
    if (lowerQuestion.includes('contact') || lowerQuestion.includes('email') || lowerQuestion.includes('phone')) {
      const allContacts = [...entities.emails, ...entities.phones, ...entities.names.slice(0, 3)];
      
      if (allContacts.length > 0) {
        return `📞 **Contact Information Found** (Real Content)

**Actual Contact Details:**
${allContacts.map(contact => `• ${contact}`).join('\n')}

**Contact Analysis:** These contact details were extracted from the actual document text and represent real communication information mentioned in the content.

**Document Context:** Found across ${content.pages} pages with ${content.wordCount.toLocaleString()} words of analyzed content.`;
      } else {
        return `📞 **Contact Analysis** (Real Content)

**No Contact Information Found:** After analyzing the complete document text (${content.wordCount.toLocaleString()} words), no email addresses, phone numbers, or explicit contact details were identified.

**Content Focus:** The document appears to focus on other aspects rather than contact information.`;
      }
    }

    // Financial/money questions
    if (lowerQuestion.includes('money') || lowerQuestion.includes('cost') || lowerQuestion.includes('amount') || lowerQuestion.includes('financial')) {
      if (entities.amounts.length > 0) {
        return `💰 **Financial Information Found** (Real Content)

**Actual Monetary Amounts:**
${entities.amounts.map(amount => `• ${amount}`).join('\n')}

**Financial Analysis:** These amounts were extracted from the actual document content and represent real financial figures mentioned in the text.

**Context:** Found in ${content.pages} pages of financial content with ${content.wordCount.toLocaleString()} words analyzed.`;
      } else {
        return `💰 **Financial Analysis** (Real Content)

**No Specific Amounts Found:** After analyzing ${content.wordCount.toLocaleString()} words of content, no explicit monetary amounts or financial figures were identified.

**Document Nature:** This document may focus on non-financial aspects or use general financial terminology without specific amounts.`;
      }
    }

    // Summary/description questions
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('describe') || lowerQuestion.includes('about')) {
      const realSummary = this.generateRealSummary(text, 'Document');
      
      return `📄 **Real Content Summary**

**Based on Actual Document Text:**
${realSummary}

**Document Statistics:**
• Pages: ${content.pages}
• Word Count: ${content.wordCount.toLocaleString()} words
• Entities Found: ${Object.values(entities).flat().length} total

**Content Analysis:** This summary is generated from the actual extracted text content, not filename patterns or assumptions.`;
    }

    // Key points questions
    if (lowerQuestion.includes('key points') || lowerQuestion.includes('main points') || lowerQuestion.includes('important')) {
      const realTopics = this.extractRealTopics(text);
      const keyPhrases = this.extractKeyPhrases(text);
      
      return `🎯 **Key Points from Real Content**

**Main Topics Identified:**
${realTopics.map((topic, i) => `${i + 1}. **${topic}**: Identified through content analysis`).join('\n')}

**Key Phrases from Document:**
${keyPhrases.map(phrase => `• "${phrase}"`).join('\n')}

**Content Intelligence:** These points were extracted from ${content.wordCount.toLocaleString()} words of actual document text, not generated assumptions.`;
    }

    // General content search
    const searchKeywords = lowerQuestion.split(' ').filter(word => 
      word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'find', 'tell', 'show'].includes(word)
    );

    if (searchKeywords.length > 0) {
      const relevantSentences = this.findRelevantSentences(text, searchKeywords);
      
      return `🔍 **Content Search Results** (Real PDF Analysis)

**Search Query:** "${question}"

**Relevant Content Found:**
${relevantSentences.map(sentence => `• ${sentence}`).join('\n')}

**Search Statistics:**
• Searched through: ${content.wordCount.toLocaleString()} words
• Pages analyzed: ${content.pages}
• Keywords matched: ${searchKeywords.join(', ')}

**Real Content Analysis:** Results extracted from actual PDF text content using advanced pattern matching.`;
    }

    // Default intelligent response based on real content
    const contentSample = text.substring(0, 500);
    const realTopics = this.extractRealTopics(text);
    
    return `🤖 **Intelligent Analysis** (Real Content)

**Your Question:** "${question}"

**Document Content Analysis:**
Based on the actual ${content.wordCount.toLocaleString()}-word document content, I can provide the following insights:

**Real Content Sample:**
"${contentSample}${contentSample.length >= 500 ? '...' : ''}"

**Identified Topics:** ${realTopics.join(', ')}

**Content Statistics:**
• Total pages: ${content.pages}
• Word count: ${content.wordCount.toLocaleString()}
• Entities found: ${Object.values(entities).flat().length}

**Note:** This analysis is based on actual extracted PDF content, providing accurate insights about your specific document.`;
  }

  // Extract key phrases from real content
  private static extractKeyPhrases(text: string): string[] {
    // Find phrases that appear multiple times or are emphasized
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const phrases: string[] = [];
    
    // Look for repeated important phrases
    const words = text.toLowerCase().split(/\s+/);
    const importantWords = ['important', 'critical', 'key', 'main', 'primary', 'essential', 'significant'];
    
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      if (importantWords.some(word => sentenceLower.includes(word))) {
        const cleanSentence = sentence.trim().replace(/[\.!?]+$/, '');
        if (cleanSentence.length > 20 && cleanSentence.length < 150) {
          phrases.push(cleanSentence);
        }
      }
    });

    return phrases.slice(0, 5);
  }

  // Find sentences relevant to search keywords
  private static findRelevantSentences(text: string, keywords: string[]): string[] {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    const relevantSentences: string[] = [];

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const matchCount = keywords.filter(keyword => 
        sentenceLower.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > 0) {
        const cleanSentence = sentence.trim().replace(/[\.!?]+$/, '');
        if (cleanSentence.length > 20 && cleanSentence.length < 200) {
          relevantSentences.push(cleanSentence);
        }
      }
    });

    // Sort by relevance (number of keyword matches)
    return relevantSentences
      .sort((a, b) => {
        const aMatches = keywords.filter(k => a.toLowerCase().includes(k.toLowerCase())).length;
        const bMatches = keywords.filter(k => b.toLowerCase().includes(k.toLowerCase())).length;
        return bMatches - aMatches;
      })
      .slice(0, 5);
  }
}

export const realPDFExtractor = RealPDFExtractor;
