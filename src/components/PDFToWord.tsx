'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, RotateCcw, FileText } from 'lucide-react';
import FileRenameModal from './FileRenameModal';
import { useFileDownload } from '@/hooks/useFileDownload';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, ExternalHyperlink } from 'docx';
import Tesseract from 'tesseract.js';

// Configure Tesseract for text extraction with enhanced accuracy
const tesseractConfig = {
  workerPath: '/tesseract-worker.min.js',
  corePath: '/tesseract-core/tesseract-core.wasm.js',
  langPath: '/tessdata/',
  logger: (m: any) => {
    if (m.status === 'loading tesseract core') {
      console.log('Loading Tesseract core for PDF to Word...');
    } else if (m.status === 'recognizing text') {
      console.log('Extracting text from PDF page...');
    }
  }
};

// Professional-grade OCR options (inspired by Solid Documents technology)
const ocrOptions = {
  ...tesseractConfig,
  tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
  tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'@#$%^&*+-=<>/\\|`~_ \n\t',
  preserve_interword_spaces: '1',
  textord_min_linesize: '2.5',
  textord_tabfind_show_vlines: '0',
  textord_old_baselines: '0',
  textord_debug_tabfind: '0',
  textord_heavy_nr: '1',
  textord_old_oc: '0',
  textord_old_xheight: '0',
  textord_min_xheight: '10',
  // Professional accuracy settings
  tessedit_do_invert: '0'
};

// Multi-language support (like professional converters)
const supportedLanguages = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish'
};

interface ConversionResult {
  success: boolean;
  convertedFile: Uint8Array | null;
  originalSize: number;
  convertedSize: number;
  pagesProcessed: number;
  error?: string;
}

export default function PDFToWord({ onReset }: { onReset: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionFormat, setConversionFormat] = useState<'docx' | 'doc'>('docx');
  const [conversionMode, setConversionMode] = useState<'auto' | 'no-ocr' | 'ocr-premium'>('auto');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // File download with rename functionality
  const {
    isRenameModalOpen,
    pendingDownload,
    downloadFile,
    handleRenameConfirm,
    handleRenameClose,
    getFileExtension,
    getFileNameWithoutExtension
  } = useFileDownload();

   // Extract images from PDF page with high quality
   const extractImagesFromPage = async (pdfArrayBuffer: ArrayBuffer, pageIndex: number): Promise<string[]> => {
     try {
       const pdfjsLib = await import('pdfjs-dist');
       pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
       
       const bufferCopy = pdfArrayBuffer.slice();
       const pdf = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
       const page = await pdf.getPage(pageIndex + 1);
       
       // Use higher scale for better image quality
       const viewport = page.getViewport({ scale: 3.0 });
       const canvas = document.createElement('canvas');
       const context = canvas.getContext('2d');
       
       if (!context) return [];
       
       canvas.height = viewport.height;
       canvas.width = viewport.width;
       
       // Enable high-quality rendering
       context.imageSmoothingEnabled = true;
       context.imageSmoothingQuality = 'high';
       
       const renderContext = {
         canvasContext: context,
         viewport: viewport,
         canvas: canvas
       };
       
       await page.render(renderContext).promise;
       
       // Convert to maximum quality PNG
       const imageDataUrl = canvas.toDataURL('image/png', 1.0);
       return [imageDataUrl];
     } catch (error) {
       console.error('Error extracting images from page:', error);
       return [];
     }
   };

  // Convert PDF page to image for OCR with enhanced quality
  const convertPDFPageToImage = async (pdfArrayBuffer: ArrayBuffer, pageIndex: number): Promise<string | null> => {
    try {
      // Dynamically import PDF.js to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      // Create a copy of the ArrayBuffer to avoid detached buffer issues
      const bufferCopy = pdfArrayBuffer.slice();
      
      // Load PDF with PDF.js (not pdf-lib)
      const pdf = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
      const page = await pdf.getPage(pageIndex + 1);
      
      // Use higher scale for better OCR accuracy
      const viewport = page.getViewport({ scale: 3.0 }); // Increased from 2.0 to 3.0
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      // Set canvas size with higher resolution
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };
      
      await page.render(renderContext).promise;
      
      // Convert to high-quality PNG
      return canvas.toDataURL('image/png', 1.0); // Maximum quality
    } catch (error) {
      console.error('Error converting PDF page to image:', error);
      return null;
    }
  };

   // Extract text with precise formatting from PDF page
   const extractTextWithFormatting = async (pdfArrayBuffer: ArrayBuffer, pageIndex: number, totalPages: number): Promise<any> => {
     try {
       const pdfjsLib = await import('pdfjs-dist');
       pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
       
       const bufferCopy = pdfArrayBuffer.slice();
       const pdf = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
       const page = await pdf.getPage(pageIndex + 1);
       
       const textContent = await page.getTextContent();
       const viewport = page.getViewport({ scale: 1.0 });
       
       console.log(`Page ${pageIndex + 1} text items found: ${textContent.items.length}`);
       
       // Create a more sophisticated text extraction
       const textBlocks: any[] = [];
       const lineThreshold = 3; // More precise line detection
       
       // Sort items by Y position (top to bottom) then X position (left to right)
       const sortedItems = textContent.items.sort((a: any, b: any) => {
         const aY = a.transform[5];
         const bY = b.transform[5];
         if (Math.abs(aY - bY) < lineThreshold) {
           return a.transform[4] - b.transform[4]; // Same line, sort by X
         }
         return bY - aY; // Different lines, sort by Y (top to bottom)
       });
       
       // Group items into lines with better detection
       let currentLine: any[] = [];
       let lastY = 0;
       
       sortedItems.forEach((item: any, index: number) => {
         const currentY = item.transform[5];
         const currentX = item.transform[4];
         const text = item.str;
         
         // Skip empty or whitespace-only items
         if (!text || text.trim().length === 0) {
           return;
         }
         
         // More sophisticated line detection
         if (Math.abs(currentY - lastY) > lineThreshold && currentLine.length > 0) {
           // Process the current line
           textBlocks.push({
             type: 'line',
             items: [...currentLine],
             y: lastY,
             lineHeight: Math.max(...currentLine.map(i => i.height || 0)),
             avgFontSize: currentLine.reduce((sum, i) => sum + (i.fontSize || 0), 0) / currentLine.length
           });
           currentLine = [];
         }
         
         // Calculate precise formatting
         const fontSize = Math.abs(item.transform[0]);
         const fontName = item.fontName || '';
         
         // More accurate style detection
         const isBold = fontName.toLowerCase().includes('bold') || 
                       fontName.toLowerCase().includes('black') ||
                       fontName.toLowerCase().includes('heavy') ||
                       fontName.toLowerCase().includes('demibold') ||
                       fontName.toLowerCase().includes('semibold');
         const isItalic = fontName.toLowerCase().includes('italic') || 
                         fontName.toLowerCase().includes('oblique');
         
         // Detect text alignment more precisely
         const pageWidth = viewport.width;
         const isCentered = currentX > pageWidth * 0.25 && currentX < pageWidth * 0.75;
         const isRightAligned = currentX > pageWidth * 0.85;
         const isLeftAligned = currentX < pageWidth * 0.15;
         
         // Detect if this might be a headline based on font size and position
         const isLargeText = fontSize > 12;
         const isTopOfPage = currentY > viewport.height * 0.9;
         
         currentLine.push({
           text: text,
           fontSize: fontSize,
           bold: isBold,
           italic: isItalic,
           x: currentX,
           y: currentY,
           isCentered: isCentered,
           isRightAligned: isRightAligned,
           isLeftAligned: isLeftAligned,
           fontName: fontName,
           width: item.width || 0,
           height: item.height || 0,
           isLargeText: isLargeText,
           isTopOfPage: isTopOfPage,
           originalIndex: index
         });
         
         lastY = currentY;
       });
       
       // Add the last line
       if (currentLine.length > 0) {
         textBlocks.push({
           type: 'line',
           items: [...currentLine],
           y: lastY,
           lineHeight: Math.max(...currentLine.map(i => i.height || 0)),
           avgFontSize: currentLine.reduce((sum, i) => sum + (i.fontSize || 0), 0) / currentLine.length
         });
       }
       
       console.log(`Page ${pageIndex + 1} text blocks created: ${textBlocks.length}`);
       return textBlocks;
     } catch (error) {
       console.error('Error extracting formatted text:', error);
       return [];
     }
   };

  // Validate PDF file
  const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Please select a PDF file' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size must be less than 50MB' };
    }
    
    return { isValid: true };
  };

  // Convert PDF to Word (simulated - in production you'd use a library like pdf2pic + mammoth)
  const convertPDFToWord = useCallback(async (file: File): Promise<ConversionResult> => {
    const originalSize = file.size;

    try {
      setConversionProgress(10);
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      setConversionProgress(20);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      setConversionProgress(30);

       // Extract text and images separately to maintain proper layout
       let allFormattedText: any[] = [];
       let allImages: string[] = [];
       const pages = pdfDoc.getPages();
       
       console.log(`Starting proper text/image separation from ${pages.length} pages...`);
       
       for (let i = 0; i < pages.length; i++) {
         const progress = Math.round((30 + (i / pages.length) * 40) * 10) / 10;
         setConversionProgress(progress);
         
         console.log(`Processing page ${i + 1}...`);
         
         // Always try direct text extraction first (this gives us editable text)
         let pageFormattedText = await extractTextWithFormatting(arrayBuffer, i, pages.length);
         
         // If we got good text extraction, use it
         if (pageFormattedText && pageFormattedText.length > 0) {
           console.log(`Direct text extraction successful for page ${i + 1}: ${pageFormattedText.length} lines`);
           allFormattedText = allFormattedText.concat(pageFormattedText);
         } else {
           // Only use OCR as fallback if direct extraction completely fails
           console.log(`Direct extraction failed for page ${i + 1}, trying OCR...`);
           const pageImage = await convertPDFPageToImage(arrayBuffer, i);
           
           if (pageImage) {
             try {
               const ocrResult = await Tesseract.recognize(pageImage, selectedLanguage, {
                 ...ocrOptions,
                 logger: (m) => {
                   if (m.status === 'recognizing text') {
                     const progress = 30 + (i / pages.length) * 40;
                     setConversionProgress(Math.min(progress + (m.progress * 0.1), 70));
                   }
                 }
               });
               
               const ocrText = ocrResult.data.text.trim();
               if (ocrText) {
                 const lines = ocrText.split('\n').filter(line => line.trim());
                 pageFormattedText = lines.map(line => ({
                   type: 'line',
                   items: [{
                     text: line.trim(),
                     fontSize: 12,
                     bold: false,
                     italic: false,
                     isCentered: false,
                     isRightAligned: false,
                     isLargeText: false,
                     isTopOfPage: false
                   }],
                   y: 0,
                   lineHeight: 12,
                   avgFontSize: 12
                 }));
                 allFormattedText = allFormattedText.concat(pageFormattedText);
                 console.log(`OCR fallback successful for page ${i + 1}: ${pageFormattedText.length} lines`);
               }
             } catch (ocrError) {
               console.warn(`OCR fallback failed for page ${i + 1}:`, ocrError);
             }
           }
         }
         
         // Always extract images from each page
         console.log(`Extracting images from page ${i + 1}...`);
         const pageImages = await extractImagesFromPage(arrayBuffer, i);
         if (pageImages && pageImages.length > 0) {
           allImages = allImages.concat(pageImages);
           console.log(`Page ${i + 1} images extracted: ${pageImages.length} images`);
         }
       }

      setConversionProgress(75);

      setConversionProgress(90);

       // Create a Word document that properly separates text and images
       const doc = new Document({
         sections: [{
           properties: {},
           children: [
             // Add all text first (this ensures text is editable)
             ...allFormattedText.map((textBlock, blockIndex) => {
               if (textBlock.type !== 'line' || !textBlock.items || textBlock.items.length === 0) {
                 return new Paragraph({ children: [new TextRun({ text: " " })] });
               }
               
               const items = textBlock.items;
               const lineText = items.map((item: any) => item.text).join(' ').trim();
               
               if (!lineText) {
                 return new Paragraph({ children: [new TextRun({ text: " " })] });
               }
               
               // Keep original formatting exactly as it is
               const textRuns = items.map((item: any, itemIndex: number) => {
                 return new TextRun({
                   text: item.text + (itemIndex < items.length - 1 ? ' ' : ''),
                   size: Math.max(item.fontSize * 2, 12), // Scale up but keep proportions
                   bold: item.bold,
                   italics: item.italic,
                 });
               });
               
               // Keep original alignment
               let alignment: any = undefined;
               if (items.some((item: any) => item.isCentered)) alignment = 'center';
               else if (items.some((item: any) => item.isRightAligned)) alignment = 'right';
               
               return new Paragraph({
                 children: textRuns,
                 alignment: alignment,
                 spacing: { after: 100 },
               });
             }),
             
             // Add all images found in the PDF
             ...allImages.map((imageDataUrl, imageIndex) => {
               try {
                 const base64Data = imageDataUrl.split(',')[1];
                 const imageBuffer = Buffer.from(base64Data, 'base64');
                 
                 return new Paragraph({
                   children: [
                     new ImageRun({
                       data: imageBuffer,
                       type: 'png',
                       transformation: {
                         width: 600,
                         height: 800,
                       },
                     }),
                   ],
                   alignment: 'center',
                   spacing: { after: 200 },
                 });
               } catch (error) {
                 console.error('Error adding image to document:', error);
                 return new Paragraph({ children: [new TextRun({ text: "[Image]" })] });
               }
             }),
           ],
         }],
       });

      console.log('Creating Word document...');
      
      // Generate the Word document
      const docBuffer = await Packer.toBuffer(doc);
      const convertedSize = docBuffer.length;
      console.log('Word document size:', convertedSize);

      setConversionProgress(100);

      console.log('Final conversion result:', {
        success: true,
        convertedFileLength: docBuffer.length,
        originalSize,
        convertedSize,
        pagesProcessed: pageCount
      });

      return {
        success: true,
        convertedFile: docBuffer,
        originalSize,
        convertedSize,
        pagesProcessed: pageCount
      };

    } catch (error) {
      console.error('PDF to Word conversion failed:', error);
      return {
        success: false,
        convertedFile: null,
        originalSize,
        convertedSize: 0,
        pagesProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setConversionResult(null);
    setIsConverting(true);
    setConversionProgress(0);

    try {
      const result = await convertPDFToWord(file);
      console.log('Setting conversion result:', result);
      setConversionResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [convertPDFToWord]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Download converted file with rename functionality
  const downloadConvertedFile = useCallback(() => {
    if (conversionResult?.convertedFile) {
      const originalFileName = uploadedFile?.name || 'document';
      // Use DOCX extension for actual Word documents
      const fileExtension = '.docx';
      const fileNameWithoutExt = getFileNameWithoutExtension(originalFileName);
      const defaultFileName = `${fileNameWithoutExt}_converted${fileExtension}`;

      downloadFile({
        fileName: defaultFileName,
        fileData: conversionResult.convertedFile,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        operationType: 'pdf-to-word',
        showRenameModal: true,
        fileSize: conversionResult.convertedFile.length
      });
    }
  }, [conversionResult, uploadedFile, downloadFile, getFileNameWithoutExtension]);

  // Reset function
  const reset = useCallback(() => {
    setUploadedFile(null);
    setConversionResult(null);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header - only show when no file uploaded */}
        {!uploadedFile && !conversionResult && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        )}

         {/* Conversion Mode Selection */}
         {!uploadedFile && (
           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
               Conversion Mode:
             </label>
             <div className="space-y-3">
               <div className="flex items-center">
                 <input
                   type="radio"
                   value="auto"
                   checked={conversionMode === 'auto'}
                   onChange={(e) => setConversionMode(e.target.value as any)}
                   className="mr-3"
                 />
                 <div>
                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Detection</span>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Automatically detect and convert PDFs with selectable text or scanned pages</p>
                 </div>
               </div>
               <div className="flex items-center">
                 <input
                   type="radio"
                   value="no-ocr"
                   checked={conversionMode === 'no-ocr'}
                   onChange={(e) => setConversionMode(e.target.value as any)}
                   className="mr-3"
                 />
                 <div>
                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">No OCR</span>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Convert PDFs with selectable text into editable Word files (faster)</p>
                 </div>
               </div>
               <div className="flex items-center">
                 <input
                   type="radio"
                   value="ocr-premium"
                   checked={conversionMode === 'ocr-premium'}
                   onChange={(e) => setConversionMode(e.target.value as any)}
                   className="mr-3"
                 />
                 <div>
                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OCR Premium</span>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Convert scanned PDFs with non-selectable text into editable Word files</p>
                 </div>
               </div>
             </div>
             
             {/* Language Selection for OCR */}
             {(conversionMode === 'ocr-premium' || conversionMode === 'auto') && (
               <div className="mt-4">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Language:
                 </label>
                 <select
                   value={selectedLanguage}
                   onChange={(e) => setSelectedLanguage(e.target.value)}
                   className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                 >
                   {Object.entries(supportedLanguages).map(([code, name]) => (
                     <option key={code} value={code}>{name}</option>
                   ))}
                 </select>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Select the language of your PDF for better OCR accuracy
                 </p>
               </div>
             )}
           </div>
         )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your PDF here
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose PDF File
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Maximum file size: 50MB
            </p>
          </div>
        )}

        {/* Processing State */}
        {isConverting && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Converting PDF to Word...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Extracting text and formatting
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(conversionProgress * 10) / 10}% complete
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Conversion Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {conversionResult && (
          <div className="space-y-6">
            {conversionResult.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your PDF has been successfully converted to a Word document (DOCX format)
                </p>

                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Original Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Converted Size:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {(conversionResult.convertedSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({conversionResult.convertedSize} bytes)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Pages Processed:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {conversionResult.pagesProcessed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={downloadConvertedFile}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Word Document
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Convert Another PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Conversion Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {conversionResult.error || 'Unable to convert the PDF to Word format'}
                </p>
                <button
                  onClick={reset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Another File
                </button>
              </div>
            )}
          </div>
        )}

        {/* File Rename Modal */}
        {pendingDownload && (
          <FileRenameModal
            isOpen={isRenameModalOpen}
            onClose={handleRenameClose}
            onConfirm={handleRenameConfirm}
            currentFileName={pendingDownload.fileName}
            fileExtension={getFileExtension(pendingDownload.fileName)}
            operationType={pendingDownload.operationType}
            fileSize={pendingDownload.fileSize}
          />
        )}

      </div>
    </div>
  );
}
