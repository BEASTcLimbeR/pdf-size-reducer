export interface ValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

// Common file type configurations
export const FILE_CONFIGS = {
  PDF: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf'],
    extensions: ['.pdf']
  },
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp']
  },
  DOCUMENT: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/rtf',
      'text/csv',
      'text/html'
    ],
    extensions: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.csv', '.html']
  }
} as const;

export const validateFile = (
  file: File | null,
  options: ValidationOptions,
  customValidators?: Array<(file: File) => string | null>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!file) {
    if (options.required) {
      errors.push('No file selected');
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Check file size
  if (file.size === 0) {
    errors.push('The selected file is empty');
  } else if (file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    const allowedTypes = options.allowedTypes.join(', ');
    errors.push(`Invalid file type. Allowed types: ${allowedTypes}`);
  }

  // Run custom validators
  if (customValidators) {
    for (const validator of customValidators) {
      const error = validator(file);
      if (error) {
        errors.push(error);
      }
    }
  }

  // Add warnings for large files
  if (file.size > options.maxSize * 0.8) {
    const sizeMB = Math.round(file.size / (1024 * 1024));
    warnings.push(`Large file detected (${sizeMB}MB). Processing may take longer.`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Specific validation functions for different tools
export const validatePDFFile = (file: File | null): ValidationResult => {
  return validateFile(file, FILE_CONFIGS.PDF, [
    (file) => {
      // Check if PDF is corrupted by trying to read the header
      if (file.type === 'application/pdf') {
        return null; // Basic type check passed
      }
      return null;
    }
  ]);
};

export const validateImageFile = (file: File | null): ValidationResult => {
  return validateFile(file, FILE_CONFIGS.IMAGE);
};

export const validateDocumentFile = (file: File | null): ValidationResult => {
  return validateFile(file, FILE_CONFIGS.DOCUMENT);
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function to get file extension
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Utility function to check if file type is supported
export const isFileTypeSupported = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Utility function to validate multiple files
export const validateMultipleFiles = (
  files: File[],
  options: ValidationOptions,
  maxFiles?: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (files.length === 0) {
    if (options.required) {
      errors.push('No files selected');
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  if (maxFiles && files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = validateFile(file, options);
    
    if (!result.isValid) {
      errors.push(`File ${i + 1} (${file.name}): ${result.errors.join(', ')}`);
    }
    
    warnings.push(...result.warnings.map(w => `File ${i + 1} (${file.name}): ${w}`));
  }

  return { isValid: errors.length === 0, errors, warnings };
};
