'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, FileText, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';
import { useUserActivityTracker } from '@/hooks/useUserActivityTracker';

export interface FileRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newFileName: string) => void;
  currentFileName: string;
  fileExtension: string;
  operationType?: string;
  fileSize?: number;
  className?: string;
}

export default function FileRenameModal({
  isOpen,
  onClose,
  onConfirm,
  currentFileName,
  fileExtension,
  operationType = 'processed',
  fileSize,
  className = ''
}: FileRenameModalProps) {
  const [newFileName, setNewFileName] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackAction } = useUserActivityTracker();

  // Generate smart default name based on operation type
  const generateSmartName = useCallback((originalName: string, operation: string) => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    switch (operation) {
      case 'compressed':
        return `${nameWithoutExt}_compressed`;
      case 'merged':
        return `${nameWithoutExt}_merged`;
      case 'converted':
        return `${nameWithoutExt}_converted`;
      case 'split':
        return `${nameWithoutExt}_split`;
      case 'rotated':
        return `${nameWithoutExt}_rotated`;
      case 'protected':
        return `${nameWithoutExt}_protected`;
      case 'unlocked':
        return `${nameWithoutExt}_unlocked`;
      case 'signed':
        return `${nameWithoutExt}_signed`;
      case 'watermarked':
        return `${nameWithoutExt}_watermarked`;
      case 'cropped':
        return `${nameWithoutExt}_cropped`;
      case 'repaired':
        return `${nameWithoutExt}_repaired`;
      case 'ocr':
        return `${nameWithoutExt}_ocr`;
      case 'csv-to-pdf':
        return `converted_${nameWithoutExt}`;
      case 'word-to-pdf':
        return `${nameWithoutExt}_converted`;
      case 'excel-to-pdf':
        return `${nameWithoutExt}_converted`;
      case 'image-to-pdf':
        return `${nameWithoutExt}_converted`;
      default:
        return `${nameWithoutExt}_${operation}`;
    }
  }, []);

  // Initialize with smart default name
  useEffect(() => {
    if (isOpen && currentFileName) {
      const smartName = generateSmartName(currentFileName, operationType);
      setNewFileName(smartName);
      setError(null);
    }
  }, [isOpen, currentFileName, operationType, generateSmartName]);

  // Validate filename
  const validateFileName = useCallback((fileName: string) => {
    if (!fileName.trim()) {
      return 'File name cannot be empty';
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      return 'File name contains invalid characters: < > : " / \\ | ? *';
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(fileName.toUpperCase())) {
      return 'This is a reserved file name and cannot be used';
    }

    // Check length (including extension)
    const fullName = `${fileName}${fileExtension}`;
    if (fullName.length > 255) {
      return 'File name is too long (max 255 characters)';
    }

    // Check for leading/trailing spaces or dots
    if (fileName !== fileName.trim()) {
      return 'File name cannot start or end with spaces';
    }

    if (fileName.startsWith('.') || fileName.endsWith('.')) {
      return 'File name cannot start or end with dots';
    }

    return null;
  }, [fileExtension]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setNewFileName(value);
    const validationError = validateFileName(value);
    setIsValid(!validationError);
    setError(validationError);
  }, [validateFileName]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (isValid && newFileName.trim()) {
      const fullFileName = `${newFileName.trim()}${fileExtension}`;
      trackAction('file-rename', 'file_renamed', {
        originalName: currentFileName,
        newName: fullFileName,
        operationType
      });
      onConfirm(fullFileName);
    }
  }, [isValid, newFileName, fileExtension, currentFileName, operationType, onConfirm, trackAction]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [isValid, handleConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rename File
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a name for your downloaded file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current file info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {currentFileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                </p>
              </div>
            </div>
          </div>

          {/* File name input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New file name
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  isValid 
                    ? 'border-gray-300 dark:border-gray-600' 
                    : 'border-red-300 dark:border-red-600'
                }`}
                placeholder="Enter new file name"
                autoFocus
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fileExtension}
              </span>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Success indicator */}
            {isValid && newFileName.trim() && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>File name is valid</span>
              </div>
            )}
          </div>

          {/* Smart suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                generateSmartName(currentFileName, operationType),
                `${currentFileName.replace(/\.[^/.]+$/, '')}_${new Date().getFullYear()}`,
                `${currentFileName.replace(/\.[^/.]+$/, '')}_v2`,
                `${currentFileName.replace(/\.[^/.]+$/, '')}_final`
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleInputChange(suggestion)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || !newFileName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
