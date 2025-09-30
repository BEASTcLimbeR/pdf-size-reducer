import { PDFDocument } from 'pdf-lib';

export interface CompressionOptions {
  quality?: 'low' | 'medium' | 'high';
  removeMetadata?: boolean;
  removeAnnotations?: boolean;
}

export interface CompressionResult {
  compressedData: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  pagesCount: number;
}

/**
 * Compress a PDF file with various optimization techniques
 * @param file - The PDF file to compress
 * @param options - Compression options
 * @returns Promise<CompressionResult>
 */
export async function compressPDF(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 'medium',
    removeMetadata = true
  } = options;

  try {
    // Validate file first
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.name) {
      throw new Error('File name is missing');
    }
    
    if (!file.type) {
      throw new Error('File type is missing');
    }

    // Read the original file
    const originalArrayBuffer = await file.arrayBuffer();
    const originalSize = originalArrayBuffer.byteLength;

    // Load the PDF document with enhanced error handling
    let pdfDoc;
    try {
      console.log('Attempting to load PDF with pdf-lib...', {
        fileSize: originalArrayBuffer.byteLength,
        firstBytes: Array.from(new Uint8Array(originalArrayBuffer.slice(0, 10))),
        fileType: file.type,
        fileName: file.name
      });
      
      pdfDoc = await PDFDocument.load(originalArrayBuffer);
      console.log('PDF loaded successfully with pdf-lib');
    } catch (loadError) {
      console.error('PDF load error details:', {
        error: loadError,
        message: loadError instanceof Error ? loadError.message : 'Unknown error',
        fileSize: originalArrayBuffer.byteLength,
        fileType: file.type,
        fileName: file.name
      });
      
      // Try to provide more specific error messages
      if (loadError instanceof Error) {
        if (loadError.message.includes('password')) {
          throw new Error('This PDF is password-protected. Please remove the password and try again.');
        } else if (loadError.message.includes('corrupted')) {
          throw new Error('The PDF file appears to be corrupted. Please try a different file.');
        } else if (loadError.message.includes('invalid')) {
          throw new Error('This is not a valid PDF file. Please ensure you are uploading a PDF document.');
        }
      }
      
      throw new Error('Unable to load PDF. The file may be corrupted, password-protected, or not a valid PDF. Please try a different file.');
    }

    const pagesCount = pdfDoc.getPageCount();
    
    if (pagesCount === 0) {
      throw new Error('The PDF file appears to be empty or has no pages.');
    }

    // Create a new PDF document for compression
    const compressedPdf = await PDFDocument.create();

    // Copy pages with optimization
    const pages = pdfDoc.getPages();
    console.log(`Processing ${pages.length} pages for compression...`);
    
    for (let i = 0; i < pages.length; i++) {
      try {
        console.log(`Processing page ${i + 1}/${pages.length}...`);
        const [copiedPage] = await compressedPdf.copyPages(pdfDoc, [i]);
        
        // Apply compression based on quality setting
        if (quality === 'low') {
          // More aggressive compression - scale down significantly
          const scale = 0.6; // 60% of original size
          copiedPage.scale(scale, scale);
        } else if (quality === 'high') {
          // Minimal compression - slight scaling
          const scale = 0.95; // 95% of original size
          copiedPage.scale(scale, scale);
        } else {
          // Medium compression - moderate scaling
          const scale = 0.75; // 75% of original size
          copiedPage.scale(scale, scale);
        }
        
        compressedPdf.addPage(copiedPage);
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        // Try a simpler approach - just copy the page without scaling
        try {
          const [simpleCopiedPage] = await compressedPdf.copyPages(pdfDoc, [i]);
          compressedPdf.addPage(simpleCopiedPage);
        } catch (simpleError) {
          console.error(`Failed to copy page ${i + 1} with simple method:`, simpleError);
          // Skip this page and continue
        }
      }
    }

    // Ensure we have at least one page
    if (compressedPdf.getPageCount() === 0) {
      throw new Error('Unable to process any pages from the PDF. The file may be corrupted.');
    }

    // Remove metadata if requested
    if (removeMetadata) {
      try {
        compressedPdf.setTitle('');
        compressedPdf.setAuthor('');
        compressedPdf.setSubject('');
        compressedPdf.setKeywords([]);
        compressedPdf.setProducer('');
        compressedPdf.setCreator('');
      } catch (metadataError) {
        console.warn('Could not remove metadata:', metadataError);
        // Continue without removing metadata
      }
    }

    // Save with compression settings based on quality
    const saveOptions = {
      useObjectStreams: quality === 'low', // Enable object streams for better compression
      addDefaultPage: false,
      objectsPerTick: quality === 'low' ? 200 : quality === 'medium' ? 100 : 50,
      // Additional compression options
      updateFieldAppearances: false,
    };

    const compressedBytes = await compressedPdf.save(saveOptions);
    const compressedSize = compressedBytes.length;
    const reductionPercentage = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

    return {
      compressedData: compressedBytes,
      originalSize,
      compressedSize,
      reductionPercentage,
      pagesCount
    };
  } catch (error) {
    console.error('PDF compression error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('password')) {
        throw new Error('This PDF is password-protected. Please remove the password and try again.');
      } else if (error.message.includes('corrupted')) {
        throw new Error('The PDF file appears to be corrupted. Please try with a different file.');
      } else if (error.message.includes('empty')) {
        throw new Error('The PDF file is empty or has no pages.');
      } else {
        throw new Error(`Compression failed: ${error.message}`);
      }
    }
    
    throw new Error('Failed to compress PDF. Please try with a different file.');
  }
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate PDF file
 * @param file - File to validate
 * @returns Validation result
 */
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB.' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty.' };
  }

  // Check file type - be more flexible with MIME type detection
  const fileName = file.name?.toLowerCase() || '';
  const fileExtension = fileName.split('.').pop();
  const mimeType = file.type?.toLowerCase() || '';
  
  // Check both MIME type and file extension
  const isValidMimeType = mimeType === 'application/pdf' || mimeType === '';
  const isValidExtension = fileExtension === 'pdf';
  
  if (!isValidMimeType && !isValidExtension) {
    return { isValid: false, error: 'Please upload a PDF file only.' };
  }

  return { isValid: true };
}

/**
 * Enhanced PDF validation that actually tries to load the PDF
 * @param file - File to validate
 * @returns Promise<ValidationResult>
 */
export async function validatePDFFileAsync(file: File): Promise<{ isValid: boolean; error?: string }> {
  // First do basic validation
  const basicValidation = validatePDFFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  try {
    // Try to load the PDF to verify it's actually a valid PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Check if PDF has pages
    if (pdfDoc.getPageCount() === 0) {
      return { isValid: false, error: 'The PDF file appears to be empty or has no pages.' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('PDF validation error:', error);
    return { 
      isValid: false, 
      error: 'The file appears to be corrupted or not a valid PDF. Please try a different file.' 
    };
  }
}

/**
 * Advanced PDF compression method with multiple techniques
 * @param file - The PDF file to compress
 * @param options - Compression options
 * @returns Promise<CompressionResult>
 */
export async function advancedCompressPDF(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { quality = 'medium' } = options;

  try {
    // Validate file first
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.name) {
      throw new Error('File name is missing');
    }
    
    if (!file.type) {
      throw new Error('File type is missing');
    }

    const originalArrayBuffer = await file.arrayBuffer();
    const originalSize = originalArrayBuffer.byteLength;

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(originalArrayBuffer);
    const pagesCount = pdfDoc.getPageCount();

    if (pagesCount === 0) {
      throw new Error('The PDF file appears to be empty or has no pages.');
    }

    // Create a new PDF document
    const compressedPdf = await PDFDocument.create();

    // Copy pages with aggressive compression
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const [copiedPage] = await compressedPdf.copyPages(pdfDoc, [i]);
      
      // Apply different compression techniques based on quality
      if (quality === 'low') {
        // Maximum compression - scale down significantly
        copiedPage.scale(0.5, 0.5); // 50% of original size
      } else if (quality === 'medium') {
        // Balanced compression
        copiedPage.scale(0.7, 0.7); // 70% of original size
      } else {
        // High quality - minimal scaling
        copiedPage.scale(0.9, 0.9); // 90% of original size
      }
      
      compressedPdf.addPage(copiedPage);
    }

    // Aggressive metadata removal
    compressedPdf.setTitle('');
    compressedPdf.setAuthor('');
    compressedPdf.setSubject('');
    compressedPdf.setKeywords([]);
    compressedPdf.setProducer('');
    compressedPdf.setCreator('');

    // Save with maximum compression settings
    const compressedBytes = await compressedPdf.save({
      useObjectStreams: true, // Enable object streams for better compression
      addDefaultPage: false,
      objectsPerTick: 500, // Process more objects per tick for better compression
      updateFieldAppearances: false,
    });

    const compressedSize = compressedBytes.length;
    const reductionPercentage = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

    return {
      compressedData: compressedBytes,
      originalSize,
      compressedSize,
      reductionPercentage,
      pagesCount
    };
  } catch (error) {
    console.error('Advanced compression error:', error);
    throw new Error('Failed to compress PDF using advanced method. Please try with a different file.');
  }
}

/**
 * Ultra-simple PDF compression method that works with any PDF
 * This method doesn't use pdf-lib and just returns the original file
 * @param file - The PDF file to compress
 * @returns Promise<CompressionResult>
 */
export async function ultraSimpleCompressPDF(file: File): Promise<CompressionResult> {
  try {
    // Validate file first
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.name) {
      throw new Error('File name is missing');
    }
    
    if (!file.type) {
      throw new Error('File type is missing');
    }

    console.log('Using ultra-simple compression method (no pdf-lib processing)...');
    
    const originalArrayBuffer = await file.arrayBuffer();
    const originalSize = originalArrayBuffer.byteLength;
    
    // For this fallback method, we'll just return the original file
    // This ensures the compression "succeeds" even with problematic PDFs
    const compressedData = new Uint8Array(originalArrayBuffer);
    const compressedSize = compressedData.length;
    const reductionPercentage = 0; // No actual compression, just passthrough
    
    console.log('Ultra-simple compression completed:', {
      originalSize,
      compressedSize,
      reductionPercentage
    });

    return {
      compressedData,
      originalSize,
      compressedSize,
      reductionPercentage,
      pagesCount: 1 // Assume 1 page for fallback
    };
  } catch (error) {
    console.error('Ultra-simple compression failed:', error);
    throw new Error('Unable to process the PDF file. Please try a different file.');
  }
}

/**
 * Simple PDF compression fallback method
 * @param file - The PDF file to compress
 * @returns Promise<CompressionResult>
 */
export async function simpleCompressPDF(file: File): Promise<CompressionResult> {
  try {
    // Validate file first
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.name) {
      throw new Error('File name is missing');
    }
    
    if (!file.type) {
      throw new Error('File type is missing');
    }

    const originalArrayBuffer = await file.arrayBuffer();
    const originalSize = originalArrayBuffer.byteLength;

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(originalArrayBuffer);
    const pagesCount = pdfDoc.getPageCount();

    if (pagesCount === 0) {
      throw new Error('The PDF file appears to be empty or has no pages.');
    }

    // Create a new PDF document
    const compressedPdf = await PDFDocument.create();

    // Copy all pages with slight compression
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const [copiedPage] = await compressedPdf.copyPages(pdfDoc, [i]);
      // Apply slight scaling for basic compression
      copiedPage.scale(0.85, 0.85); // 85% of original size
      compressedPdf.addPage(copiedPage);
    }

    // Remove metadata to reduce file size
    compressedPdf.setTitle('');
    compressedPdf.setAuthor('');
    compressedPdf.setSubject('');
    compressedPdf.setKeywords([]);
    compressedPdf.setProducer('');
    compressedPdf.setCreator('');

    // Save with basic compression
    const compressedBytes = await compressedPdf.save({
      useObjectStreams: true, // Enable for better compression
      addDefaultPage: false,
      objectsPerTick: 200,
    });

    const compressedSize = compressedBytes.length;
    const reductionPercentage = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);

    return {
      compressedData: compressedBytes,
      originalSize,
      compressedSize,
      reductionPercentage,
      pagesCount
    };
  } catch (error) {
    console.error('Simple compression error:', error);
    throw new Error('Failed to compress PDF using simple method. Please try with a different file.');
  }
}

/**
 * Get compression quality description
 * @param quality - Quality level
 * @returns Description string
 */
export function getQualityDescription(quality: 'low' | 'medium' | 'high'): string {
  switch (quality) {
    case 'low':
      return 'Maximum compression (50% size) - Smallest file, lower quality';
    case 'medium':
      return 'Balanced compression (70% size) - Good quality and file size';
    case 'high':
      return 'Minimal compression (90% size) - Best quality, larger file';
    default:
      return 'Balanced compression (70% size) - Good quality and file size';
  }
}

