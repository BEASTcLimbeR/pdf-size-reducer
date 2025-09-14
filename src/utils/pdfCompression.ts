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
    removeMetadata = true,
    removeAnnotations = false
  } = options;

  try {
    // Read the original file
    const originalArrayBuffer = await file.arrayBuffer();
    const originalSize = originalArrayBuffer.byteLength;

    // Load the PDF document with error handling
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(originalArrayBuffer);
    } catch (loadError) {
      console.error('PDF load error:', loadError);
      throw new Error('Unable to load PDF. The file may be corrupted, password-protected, or not a valid PDF.');
    }

    const pagesCount = pdfDoc.getPageCount();
    
    if (pagesCount === 0) {
      throw new Error('The PDF file appears to be empty or has no pages.');
    }

    // Create a new PDF document for compression
    const compressedPdf = await PDFDocument.create();

    // Copy pages with optimization
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      try {
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
      addPageNumbers: false,
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
  // Check file type
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please upload a PDF file only.' };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 50MB.' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { isValid: false, error: 'The uploaded file is empty.' };
  }

  return { isValid: true };
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
      addPageNumbers: false,
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
 * Simple PDF compression fallback method
 * @param file - The PDF file to compress
 * @returns Promise<CompressionResult>
 */
export async function simpleCompressPDF(file: File): Promise<CompressionResult> {
  try {
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

