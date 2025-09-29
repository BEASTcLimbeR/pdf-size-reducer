import { SecurityUtils, DEFAULT_SECURITY_CONFIG } from './securityConfig';

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  fileInfo: FileInfo;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
  mimeType: string;
  isExecutable: boolean;
  isArchive: boolean;
  isImage: boolean;
  isDocument: boolean;
  isPDF: boolean;
}

export class EnhancedFileValidator {
  private config = DEFAULT_SECURITY_CONFIG.fileValidation;

  async validateFile(file: File): Promise<EnhancedValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let securityScore = 100;

    // Basic file info
    const fileInfo = this.extractFileInfo(file);

    // Size validation
    if (!SecurityUtils.validateFileSize(file, this.config.maxFileSize)) {
      errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`);
      securityScore -= 30;
    }

    // MIME type validation
    if (!SecurityUtils.validateFileType(file, this.config.allowedMimeTypes)) {
      errors.push(`File type '${file.type}' is not allowed`);
      securityScore -= 40;
    }

    // Extension validation
    if (!SecurityUtils.validateFileExtension(file.name, this.config.blockedExtensions)) {
      errors.push(`File extension '${fileInfo.extension}' is blocked for security reasons`);
      securityScore -= 50;
    }

    // Executable file detection
    if (fileInfo.isExecutable) {
      errors.push('Executable files are not allowed');
      securityScore -= 60;
    }

    // Archive file validation
    if (fileInfo.isArchive) {
      warnings.push('Archive files may contain compressed content that will be extracted');
      securityScore -= 10;
    }

    // Content inspection
    if (this.config.contentInspection) {
      const contentValidation = await this.validateFileContent(file);
      if (!contentValidation.isValid) {
        errors.push(...contentValidation.errors);
        securityScore -= contentValidation.securityPenalty;
      }
      warnings.push(...contentValidation.warnings);
    }

    // Malware scanning simulation
    if (this.config.scanForMalware) {
      const malwareCheck = await this.scanForMalware(file);
      if (!malwareCheck.isClean) {
        errors.push('File failed malware scan');
        securityScore -= 70;
      }
    }

    // Risk level determination
    const riskLevel = this.determineRiskLevel(securityScore, errors.length, warnings.length);

    // Generate recommendations
    if (securityScore < 80) {
      recommendations.push('Consider using a different file format or source');
    }
    if (fileInfo.size > 10 * 1024 * 1024) {
      recommendations.push('Large files may take longer to process');
    }
    if (fileInfo.isArchive) {
      recommendations.push('Extract archive contents before processing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityScore: Math.max(0, securityScore),
      riskLevel,
      recommendations,
      fileInfo
    };
  }

  private extractFileInfo(file: File): FileInfo {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    const pdfExtensions = ['.pdf'];

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension,
      mimeType: file.type,
      isExecutable: executableExtensions.includes(extension),
      isArchive: archiveExtensions.includes(extension),
      isImage: imageExtensions.includes(extension) || file.type.startsWith('image/'),
      isDocument: documentExtensions.includes(extension) || file.type.startsWith('application/'),
      isPDF: pdfExtensions.includes(extension) || file.type === 'application/pdf'
    };
  }

  private async validateFileContent(file: File): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    securityPenalty: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityPenalty = 0;

    try {
      // Read file content for inspection
      const content = await this.readFileContent(file);
      
      // Check for suspicious patterns
      if (SecurityUtils.isSuspiciousContent(content)) {
        errors.push('File contains suspicious content patterns');
        securityPenalty += 40;
      }

      // Check for embedded scripts
      if (content.includes('<script') || content.includes('javascript:')) {
        errors.push('File contains embedded scripts');
        securityPenalty += 50;
      }

      // Check for executable signatures
      if (this.hasExecutableSignature(content)) {
        errors.push('File appears to be executable despite extension');
        securityPenalty += 60;
      }

      // Check for encrypted content
      if (this.isEncryptedContent(content)) {
        warnings.push('File appears to be encrypted');
        securityPenalty += 20;
      }

    } catch (error) {
      warnings.push('Could not fully inspect file content');
      securityPenalty += 10;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityPenalty
    };
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private hasExecutableSignature(content: string): boolean {
    // Check for common executable file signatures
    const signatures = [
      'MZ', // DOS/Windows executable
      '\x7fELF', // ELF executable
      '\xfe\xed\xfa', // Mach-O executable
      'PK\x03\x04', // ZIP/executable archive
      '\x89PNG' // PNG with embedded executable
    ];
    
    return signatures.some(sig => content.startsWith(sig));
  }

  private isEncryptedContent(content: string): boolean {
    // Simple heuristic to detect encrypted content
    const entropy = this.calculateEntropy(content);
    return entropy > 7.5; // High entropy suggests encryption
  }

  private calculateEntropy(str: string): number {
    const freq: { [key: string]: number } = {};
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / str.length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  private async scanForMalware(file: File): Promise<{ isClean: boolean }> {
    // Simulate malware scanning
    // In a real implementation, this would integrate with a malware scanning service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate scan result (99.9% clean rate)
        const isClean = Math.random() > 0.001;
        resolve({ isClean });
      }, 1000);
    });
  }

  private determineRiskLevel(
    securityScore: number, 
    errorCount: number, 
    warningCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (errorCount > 0 || securityScore < 30) return 'critical';
    if (securityScore < 50 || warningCount > 3) return 'high';
    if (securityScore < 70 || warningCount > 1) return 'medium';
    return 'low';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config = DEFAULT_SECURITY_CONFIG.rateLimiting;

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    // Check if under limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.config.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): number {
    if (!this.requests.has(identifier)) {
      return Date.now() + this.config.windowMs;
    }
    
    const userRequests = this.requests.get(identifier)!;
    if (userRequests.length === 0) {
      return Date.now() + this.config.windowMs;
    }
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.config.windowMs;
  }
}
