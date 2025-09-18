// Real PDF text extraction using PDF.js in browser

let pdfjsLib: any = null;

// Dynamically import PDF.js only on client side
const loadPDFJS = async () => {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used in browser environment');
  }
  
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  
  return pdfjsLib;
};

export interface PDFContent {
  text: string;
  pages: number;
  wordCount: number;
  hasImages: boolean;
  isEncrypted: boolean;
}

export class PDFTextExtractor {
  static async extractTextFromPDF(file: File): Promise<PDFContent> {
    try {
      console.log('📄 Extracting real text from PDF...');
      
      // Load PDF.js only on client side
      const pdfjs = await loadPDFJS();
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`📊 PDF loaded: ${pdf.numPages} pages`);
      
      let fullText = '';
      let hasImages = false;
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n\n';
          
          // Check for images on this page
          try {
            const ops = await page.getOperatorList();
            const pdfjs = await loadPDFJS();
            if (ops.fnArray.includes(pdfjs.OPS.paintImageXObject)) {
              hasImages = true;
            }
          } catch (imageError) {
            // Skip image detection if it fails
          }
          
          console.log(`📝 Page ${pageNum}: ${pageText.split(' ').length} words extracted`);
          
        } catch (pageError) {
          console.error(`Error extracting page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      // Clean up text
      const cleanText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`✅ Text extraction complete: ${wordCount} words from ${pdf.numPages} pages`);
      
      return {
        text: cleanText,
        pages: pdf.numPages,
        wordCount,
        hasImages,
        isEncrypted: false // PDF.js can open it, so not encrypted
      };
      
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      
      // Check if it's an encryption error
      const isEncrypted = error?.message?.includes('password') || error?.message?.includes('encrypted');
      
      if (isEncrypted) {
        throw new Error('This PDF is password-protected. Please unlock it first or use a different PDF.');
      }
      
      // Fallback for corrupted or unsupported PDFs
      throw new Error('Unable to read this PDF. The file may be corrupted or in an unsupported format.');
    }
  }

  // Extract specific information from text
  static extractDates(text: string): string[] {
    const datePatterns = [
      // MM/DD/YYYY, MM-DD-YYYY
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
      // YYYY/MM/DD, YYYY-MM-DD
      /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g,
      // Month DD, YYYY
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      // DD Month YYYY
      /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
      // Mon DD, YYYY
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi
    ];

    const dates = new Set<string>();
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(date => dates.add(date.trim()));
      }
    });

    return Array.from(dates).slice(0, 10); // Limit to 10 dates
  }

  // Extract contact information
  static extractContacts(text: string): string[] {
    const contacts = new Set<string>();
    
    // Email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails) emails.forEach(email => contacts.add(email));
    
    // Phone numbers
    const phonePatterns = [
      /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, // (123) 456-7890
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,  // 123-456-7890
      /\+\d{1,3}\s?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g // International
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) matches.forEach(phone => contacts.add(phone.trim()));
    });
    
    // Names (capitalized words, likely names)
    const namePattern = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/g;
    const names = text.match(namePattern);
    if (names) names.slice(0, 5).forEach(name => contacts.add(name));
    
    return Array.from(contacts).slice(0, 8);
  }

  // Extract financial information
  static extractFinancial(text: string): string[] {
    const financial = new Set<string>();
    
    // Money amounts
    const moneyPatterns = [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // $1,234.56
      /\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?)/gi, // 1,234.56 USD
      /(?:total|amount|cost|price|fee):\s*\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/gi
    ];
    
    moneyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) matches.forEach(amount => financial.add(amount.trim()));
    });
    
    return Array.from(financial).slice(0, 5);
  }

  // Extract key topics from actual text content
  static extractTopics(text: string, documentType: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      if (!this.isStopWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Get top words and convert to topics
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
    
    // Generate meaningful topics from frequent words
    const topics = topWords.map(word => this.wordToTopic(word, documentType));
    
    return [...new Set(topics)].slice(0, 5);
  }

  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
      'shall', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    return stopWords.has(word);
  }

  private static wordToTopic(word: string, documentType: string): string {
    // Convert frequent words to meaningful topics
    const topicMappings: { [key: string]: string } = {
      'project': 'Project Management',
      'business': 'Business Strategy',
      'financial': 'Financial Analysis',
      'market': 'Market Research',
      'customer': 'Customer Relations',
      'product': 'Product Development',
      'service': 'Service Delivery',
      'management': 'Management Framework',
      'strategy': 'Strategic Planning',
      'analysis': 'Data Analysis',
      'report': 'Reporting Structure',
      'performance': 'Performance Metrics',
      'quality': 'Quality Assurance',
      'process': 'Process Optimization',
      'system': 'System Architecture',
      'development': 'Development Process',
      'implementation': 'Implementation Strategy',
      'planning': 'Strategic Planning',
      'operations': 'Operational Excellence',
      'technology': 'Technology Integration'
    };

    return topicMappings[word] || (word.charAt(0).toUpperCase() + word.slice(1) + ' Analysis');
  }
}
