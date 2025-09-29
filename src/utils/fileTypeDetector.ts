// Smart File Type Detection and Suggestions
export interface FileTypeInfo {
  type: string;
  category: 'document' | 'image' | 'spreadsheet' | 'presentation' | 'text' | 'archive' | 'other';
  icon: string;
  color: string;
  description: string;
  supported: boolean;
  suggestedTools: string[];
  maxSize: number; // in MB
}

export const FILE_TYPES: Record<string, FileTypeInfo> = {
  // PDF Documents
  'application/pdf': {
    type: 'PDF Document',
    category: 'document',
    icon: '📄',
    color: 'text-red-600',
    description: 'Portable Document Format',
    supported: true,
    suggestedTools: ['compress', 'merge', 'split', 'convert', 'edit', 'protect'],
    maxSize: 100
  },

  // Microsoft Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    type: 'Word Document',
    category: 'document',
    icon: '📝',
    color: 'text-blue-600',
    description: 'Microsoft Word Document (.docx)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },
  'application/msword': {
    type: 'Word Document',
    category: 'document',
    icon: '📝',
    color: 'text-blue-600',
    description: 'Microsoft Word Document (.doc)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },

  // Microsoft Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    type: 'Excel Spreadsheet',
    category: 'spreadsheet',
    icon: '📊',
    color: 'text-green-600',
    description: 'Microsoft Excel Spreadsheet (.xlsx)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },
  'application/vnd.ms-excel': {
    type: 'Excel Spreadsheet',
    category: 'spreadsheet',
    icon: '📊',
    color: 'text-green-600',
    description: 'Microsoft Excel Spreadsheet (.xls)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },

  // Microsoft PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    type: 'PowerPoint Presentation',
    category: 'presentation',
    icon: '📽️',
    color: 'text-orange-600',
    description: 'Microsoft PowerPoint Presentation (.pptx)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },
  'application/vnd.ms-powerpoint': {
    type: 'PowerPoint Presentation',
    category: 'presentation',
    icon: '📽️',
    color: 'text-orange-600',
    description: 'Microsoft PowerPoint Presentation (.ppt)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 50
  },

  // Images
  'image/jpeg': {
    type: 'JPEG Image',
    category: 'image',
    icon: '🖼️',
    color: 'text-purple-600',
    description: 'JPEG Image (.jpg, .jpeg)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'compress'],
    maxSize: 25
  },
  'image/png': {
    type: 'PNG Image',
    category: 'image',
    icon: '🖼️',
    color: 'text-purple-600',
    description: 'PNG Image (.png)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'compress'],
    maxSize: 25
  },
  'image/gif': {
    type: 'GIF Image',
    category: 'image',
    icon: '🖼️',
    color: 'text-purple-600',
    description: 'GIF Image (.gif)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge'],
    maxSize: 25
  },
  'image/webp': {
    type: 'WebP Image',
    category: 'image',
    icon: '🖼️',
    color: 'text-purple-600',
    description: 'WebP Image (.webp)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge'],
    maxSize: 25
  },

  // Text Files
  'text/plain': {
    type: 'Text File',
    category: 'text',
    icon: '📄',
    color: 'text-gray-600',
    description: 'Plain Text File (.txt)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 10
  },
  'text/rtf': {
    type: 'Rich Text File',
    category: 'text',
    icon: '📄',
    color: 'text-gray-600',
    description: 'Rich Text Format (.rtf)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge', 'edit'],
    maxSize: 10
  },

  // HTML
  'text/html': {
    type: 'HTML Document',
    category: 'document',
    icon: '🌐',
    color: 'text-indigo-600',
    description: 'HTML Document (.html)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge'],
    maxSize: 10
  },

  // CSV
  'text/csv': {
    type: 'CSV File',
    category: 'spreadsheet',
    icon: '📊',
    color: 'text-green-600',
    description: 'Comma Separated Values (.csv)',
    supported: true,
    suggestedTools: ['convert-to-pdf', 'merge'],
    maxSize: 10
  },

  // Archives
  'application/zip': {
    type: 'ZIP Archive',
    category: 'archive',
    icon: '📦',
    color: 'text-yellow-600',
    description: 'ZIP Archive (.zip)',
    supported: false,
    suggestedTools: ['extract-first'],
    maxSize: 100
  },
  'application/x-rar-compressed': {
    type: 'RAR Archive',
    category: 'archive',
    icon: '📦',
    color: 'text-yellow-600',
    description: 'RAR Archive (.rar)',
    supported: false,
    suggestedTools: ['extract-first'],
    maxSize: 100
  }
};

export class FileTypeDetector {
  /**
   * Detect file type information from a file
   */
  static detectFileType(file: File): FileTypeInfo {
    const mimeType = file.type;
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    // Check MIME type first
    if (FILE_TYPES[mimeType]) {
      return FILE_TYPES[mimeType];
    }

    // Fallback to extension-based detection
    const extensionMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.rtf': 'text/rtf',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };

    const detectedMimeType = extensionMap[extension];
    if (detectedMimeType && FILE_TYPES[detectedMimeType]) {
      return FILE_TYPES[detectedMimeType];
    }

    // Unknown file type
    return {
      type: 'Unknown File',
      category: 'other',
      icon: '❓',
      color: 'text-gray-500',
      description: `Unknown file type (${extension})`,
      supported: false,
      suggestedTools: [],
      maxSize: 10
    };
  }

  /**
   * Get suggested tools for a file type
   */
  static getSuggestedTools(file: File): string[] {
    const fileType = this.detectFileType(file);
    return fileType.suggestedTools;
  }

  /**
   * Check if file is supported
   */
  static isSupported(file: File): boolean {
    const fileType = this.detectFileType(file);
    return fileType.supported;
  }

  /**
   * Get maximum allowed size for file type
   */
  static getMaxSize(file: File): number {
    const fileType = this.detectFileType(file);
    return fileType.maxSize;
  }

  /**
   * Validate file against its type requirements
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const fileType = this.detectFileType(file);
    
    if (!fileType.supported) {
      return {
        valid: false,
        error: `${fileType.type} files are not supported. Please upload a supported file type.`
      };
    }

    if (file.size > fileType.maxSize * 1024 * 1024) {
      return {
        valid: false,
        error: `File size must be less than ${fileType.maxSize}MB for ${fileType.type} files.`
      };
    }

    return { valid: true };
  }

  /**
   * Get file category color
   */
  static getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'document': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'image': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      'spreadsheet': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'presentation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'text': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'archive': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    };
    return colorMap[category] || colorMap['other'];
  }

  /**
   * Get all supported file types
   */
  static getSupportedTypes(): FileTypeInfo[] {
    return Object.values(FILE_TYPES).filter(type => type.supported);
  }

  /**
   * Get file types by category
   */
  static getTypesByCategory(category: string): FileTypeInfo[] {
    return Object.values(FILE_TYPES).filter(type => type.category === category && type.supported);
  }
}
