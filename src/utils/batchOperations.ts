import { PDFDocument } from 'pdf-lib';

export interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: Uint8Array;
  error?: string;
}

export interface CompressionOptions {
  quality: 'low' | 'medium' | 'high';
  removeMetadata: boolean;
  removeAnnotations: boolean;
}

export interface WatermarkOptions {
  text: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
}

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Batch compress PDFs
export const batchCompressPDFs = async (
  files: BatchFile[],
  options: CompressionOptions,
  onProgress: (fileId: string, progress: number) => void,
  onComplete: (fileId: string, result: Uint8Array) => void,
  onError: (fileId: string, error: string) => void
) => {
  for (const file of files) {
    try {
      onProgress(file.id, 0);
      
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      onProgress(file.id, 30);
      
      // Apply compression based on quality setting
      const saveOptions = {
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50
      };
      
      // Adjust compression based on quality
      if (options.quality === 'low') {
        // Maximum compression
        saveOptions.objectsPerTick = 100;
      } else if (options.quality === 'high') {
        // Best quality
        saveOptions.objectsPerTick = 25;
      }
      
      onProgress(file.id, 60);
      
      // Remove metadata if requested
      if (options.removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
      }
      
      onProgress(file.id, 80);
      
      const compressedBytes = await pdfDoc.save(saveOptions);
      
      onProgress(file.id, 100);
      onComplete(file.id, compressedBytes);
      
    } catch (error) {
      onError(file.id, error instanceof Error ? error.message : 'Compression failed');
    }
  }
};

// Batch convert PDFs to JPG (simulated)
export const batchConvertToJPG = async (
  files: BatchFile[],
  onProgress: (fileId: string, progress: number) => void,
  onComplete: (fileId: string, result: Uint8Array) => void,
  onError: (fileId: string, error: string) => void
) => {
  for (const file of files) {
    try {
      onProgress(file.id, 0);
      
      // Simulate conversion process
      // In a real implementation, you would use a library like pdf2pic or pdf-lib with canvas
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      onProgress(file.id, 30);
      
      // Get page count
      const pageCount = pdfDoc.getPageCount();
      
      onProgress(file.id, 60);
      
      // Simulate processing each page
      for (let i = 0; i < pageCount; i++) {
        // In real implementation, convert each page to JPG
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(file.id, 60 + (40 * (i + 1) / pageCount));
      }
      
      // Create a placeholder result (in real implementation, this would be the JPG data)
      const mockResult = new Uint8Array(1024);
      
      onComplete(file.id, mockResult);
      
    } catch (error) {
      onError(file.id, error instanceof Error ? error.message : 'Conversion failed');
    }
  }
};

// Batch watermark PDFs
export const batchWatermarkPDFs = async (
  files: BatchFile[],
  options: WatermarkOptions,
  onProgress: (fileId: string, progress: number) => void,
  onComplete: (fileId: string, result: Uint8Array) => void,
  onError: (fileId: string, error: string) => void
) => {
  for (const file of files) {
    try {
      onProgress(file.id, 0);
      
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      onProgress(file.id, 30);
      
      // Get all pages
      const pages = pdfDoc.getPages();
      
      onProgress(file.id, 50);
      
      // Add watermark to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate watermark position
        let x, y;
        const fontSize = Math.min(width, height) * 0.1; // 10% of page size
        
        switch (options.position) {
          case 'top-left':
            x = 50;
            y = height - 50;
            break;
          case 'top-right':
            x = width - 200;
            y = height - 50;
            break;
          case 'center':
            x = width / 2 - 100;
            y = height / 2;
            break;
          case 'bottom-left':
            x = 50;
            y = 50;
            break;
          case 'bottom-right':
            x = width - 200;
            y = 50;
            break;
          default:
            x = width / 2 - 100;
            y = height / 2;
        }
        
        // Add watermark text
        page.drawText(options.text, {
          x,
          y,
          size: fontSize,
          opacity: options.opacity,
          color: { r: 0.5, g: 0.5, b: 0.5 } // Gray color
        });
        
        onProgress(file.id, 50 + (40 * (i + 1) / pages.length));
      }
      
      onProgress(file.id, 90);
      
      const watermarkedBytes = await pdfDoc.save();
      
      onProgress(file.id, 100);
      onComplete(file.id, watermarkedBytes);
      
    } catch (error) {
      onError(file.id, error instanceof Error ? error.message : 'Watermarking failed');
    }
  }
};

// Batch merge PDF sets
export const batchMergePDFSets = async (
  fileSets: BatchFile[][],
  onProgress: (setIndex: number, progress: number) => void,
  onComplete: (setIndex: number, result: Uint8Array) => void,
  onError: (setIndex: number, error: string) => void
) => {
  for (let setIndex = 0; setIndex < fileSets.length; setIndex++) {
    const fileSet = fileSets[setIndex];
    
    try {
      onProgress(setIndex, 0);
      
      const mergedPdf = await PDFDocument.create();
      
      onProgress(setIndex, 20);
      
      // Merge all PDFs in the set
      for (let i = 0; i < fileSet.length; i++) {
        const file = fileSet[i];
        const arrayBuffer = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        
        onProgress(setIndex, 20 + (60 * (i + 1) / fileSet.length));
      }
      
      onProgress(setIndex, 90);
      
      const mergedBytes = await mergedPdf.save();
      
      onProgress(setIndex, 100);
      onComplete(setIndex, mergedBytes);
      
    } catch (error) {
      onError(setIndex, error instanceof Error ? error.message : 'Merge failed');
    }
  }
};

// Create ZIP file for download (placeholder)
export const createZipFile = async (files: { name: string; data: Uint8Array }[]): Promise<Blob> => {
  // In a real implementation, you would use a library like JSZip
  // For now, we'll return a simple blob
  const combinedData = new Uint8Array(files.reduce((acc, file) => acc + file.data.length, 0));
  let offset = 0;
  
  for (const file of files) {
    combinedData.set(file.data, offset);
    offset += file.data.length;
  }
  
  return new Blob([combinedData], { type: 'application/zip' });
};

// Download multiple files
export const downloadFiles = (files: { name: string; data: Uint8Array }[]) => {
  files.forEach((file, index) => {
    const blob = new Blob([file.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

// Validate PDF file
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please select a PDF file' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'The selected file is empty' };
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB limit for batch processing
    return { isValid: false, error: 'File size must be less than 100MB' };
  }
  
  return { isValid: true };
};

// Get compression statistics
export const getCompressionStats = (originalSize: number, compressedSize: number) => {
  const reductionPercentage = ((originalSize - compressedSize) / originalSize) * 100;
  const compressionRatio = compressedSize / originalSize;
  
  return {
    originalSize,
    compressedSize,
    reductionPercentage: Math.round(reductionPercentage * 100) / 100,
    compressionRatio: Math.round(compressionRatio * 1000) / 1000
  };
};
