'use client';

import { useState, useCallback } from 'react';
import { useUserActivityTracker } from './useUserActivityTracker';

export interface DownloadOptions {
  fileName: string;
  fileData: Uint8Array | Blob;
  mimeType?: string;
  operationType?: string;
  showRenameModal?: boolean;
  fileSize?: number;
}

export interface FileDownloadState {
  isRenameModalOpen: boolean;
  pendingDownload: {
    fileName: string;
    fileData: Uint8Array | Blob;
    mimeType: string;
    operationType: string;
    fileSize?: number;
  } | null;
}

export function useFileDownload() {
  const [state, setState] = useState<FileDownloadState>({
    isRenameModalOpen: false,
    pendingDownload: null
  });
  
  const { trackAction } = useUserActivityTracker();

  // Download file with optional rename
  const downloadFile = useCallback((options: DownloadOptions) => {
    const {
      fileName,
      fileData,
      mimeType = 'application/octet-stream',
      operationType = 'download',
      showRenameModal = true,
      fileSize
    } = options;

    // If rename modal is disabled, download immediately
    if (!showRenameModal) {
      performDownload(fileName, fileData, mimeType, operationType);
      return;
    }

    // Show rename modal
    setState({
      isRenameModalOpen: true,
      pendingDownload: {
        fileName,
        fileData,
        mimeType,
        operationType,
        fileSize
      }
    });

    trackAction('file-download', 'rename_modal_opened', {
      originalFileName: fileName,
      operationType,
      fileSize
    });
  }, [trackAction]);

  // Perform actual download
  const performDownload = useCallback((
    fileName: string,
    fileData: Uint8Array | Blob,
    mimeType: string,
    operationType: string
  ) => {
    try {
      // Create blob
      const blob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: mimeType });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      // Track download
      trackAction('file-download', 'file_downloaded', {
        fileName,
        operationType,
        fileSize: blob.size,
        mimeType
      });

    } catch (error) {
      console.error('Download failed:', error);
      trackAction('file-download', 'download_failed', {
        fileName,
        operationType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [trackAction]);

  // Handle rename confirmation
  const handleRenameConfirm = useCallback((newFileName: string) => {
    if (state.pendingDownload) {
      const { fileData, mimeType, operationType } = state.pendingDownload;
      performDownload(newFileName, fileData, mimeType, operationType);
    }
    
    setState({
      isRenameModalOpen: false,
      pendingDownload: null
    });
  }, [state.pendingDownload, performDownload]);

  // Handle rename modal close
  const handleRenameClose = useCallback(() => {
    setState({
      isRenameModalOpen: false,
      pendingDownload: null
    });

    trackAction('file-download', 'rename_modal_cancelled', {
      originalFileName: state.pendingDownload?.fileName || 'unknown'
    });
  }, [state.pendingDownload, trackAction]);

  // Download without rename modal (for direct downloads)
  const downloadDirectly = useCallback((
    fileName: string,
    fileData: Uint8Array | Blob,
    mimeType: string = 'application/octet-stream',
    operationType: string = 'download'
  ) => {
    performDownload(fileName, fileData, mimeType, operationType);
  }, [performDownload]);

  // Get file extension from filename
  const getFileExtension = useCallback((fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }, []);

  // Get filename without extension
  const getFileNameWithoutExtension = useCallback((fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  }, []);

  return {
    ...state,
    downloadFile,
    downloadDirectly,
    handleRenameConfirm,
    handleRenameClose,
    getFileExtension,
    getFileNameWithoutExtension
  };
}
