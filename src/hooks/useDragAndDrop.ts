'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUserActivityTracker } from './useUserActivityTracker';

export interface DragAndDropOptions {
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: () => void;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  rejectClassName?: string;
}

export interface DragAndDropState {
  isDragActive: boolean;
  isDragReject: boolean;
  dragCounter: number;
  files: File[];
  errors: string[];
}

export function useDragAndDrop(options: DragAndDropOptions = {}) {
  const {
    accept = { 'application/pdf': ['.pdf'] },
    maxSize = 50 * 1024 * 1024, // 50MB
    maxFiles = 1,
    onDrop,
    onDragEnter,
    onDragLeave,
    onDragOver,
    disabled = false
  } = options;

  const [state, setState] = useState<DragAndDropState>({
    isDragActive: false,
    isDragReject: false,
    dragCounter: 0,
    files: [],
    errors: []
  });

  const dragCounterRef = useRef(0);
  const { trackAction } = useUserActivityTracker();

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    const isAccepted = Object.entries(accept).some(([mime, extensions]) => {
      return mime === mimeType || extensions.includes(fileExtension);
    });

    if (!isAccepted) {
      const acceptedTypes = Object.values(accept).flat().join(', ');
      return `File type not supported. Accepted types: ${acceptedTypes}`;
    }

    return null;
  }, [accept, maxSize]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    dragCounterRef.current++;
    setState(prev => ({
      ...prev,
      isDragActive: true,
      dragCounter: dragCounterRef.current
    }));

    onDragEnter?.();
    trackAction('drag-drop', 'drag_enter', { fileCount: e.dataTransfer?.files.length || 0 });
  }, [disabled, onDragEnter, trackAction]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    dragCounterRef.current--;
    setState(prev => ({
      ...prev,
      isDragActive: dragCounterRef.current > 0,
      dragCounter: dragCounterRef.current
    }));

    if (dragCounterRef.current === 0) {
      onDragLeave?.();
      trackAction('drag-drop', 'drag_leave');
    }
  }, [disabled, onDragLeave, trackAction]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    onDragOver?.();
  }, [disabled, onDragOver]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    dragCounterRef.current = 0;
    setState(prev => ({
      ...prev,
      isDragActive: false,
      isDragReject: false,
      dragCounter: 0
    }));

    const files = Array.from(e.dataTransfer?.files || []);
    
    if (files.length === 0) {
      trackAction('drag-drop', 'drop_empty');
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file, index) => {
      if (index >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    setState(prev => ({
      ...prev,
      files: validFiles,
      errors
    }));

    if (validFiles.length > 0) {
      onDrop?.(validFiles);
      trackAction('drag-drop', 'files_dropped', {
        fileCount: validFiles.length,
        totalSize: validFiles.reduce((sum, file) => sum + file.size, 0),
        errors: errors.length
      });
    } else {
      trackAction('drag-drop', 'drop_rejected', { errors: errors.length });
    }
  }, [disabled, maxFiles, validateFile, onDrop, trackAction]);

  const reset = useCallback(() => {
    setState({
      isDragActive: false,
      isDragReject: false,
      dragCounter: 0,
      files: [],
      errors: []
    });
    dragCounterRef.current = 0;
  }, []);

  const getRootProps = useCallback(() => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    className: `${options.className || ''} ${
      state.isDragActive ? (options.activeClassName || 'drag-active') : ''
    } ${
      state.isDragReject ? (options.rejectClassName || 'drag-reject') : ''
    }`.trim()
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, options.className, options.activeClassName, options.rejectClassName, state.isDragActive, state.isDragReject]);

  return {
    ...state,
    getRootProps,
    reset,
    isDragActive: state.isDragActive,
    isDragReject: state.isDragReject,
    files: state.files,
    errors: state.errors
  };
}
