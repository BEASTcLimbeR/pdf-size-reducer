# Progress Indicators & Feedback System

This document explains how to implement comprehensive progress indicators and feedback features across PDF tools.

## Components Overview

### 1. ProgressIndicator Component
A reusable component that displays real-time progress with:
- Step-by-step processing visualization
- Estimated time remaining
- Cancel functionality
- Progress percentage
- Animated status indicators

### 2. SuccessAnimation Component
Celebrates completed operations with:
- Animated success icons
- Confetti effects
- Statistics display
- Action buttons
- Smooth transitions

### 3. useProgress Hook
A custom hook that manages progress state:
- Step management
- Error handling
- Cancellation support
- Progress tracking

## Implementation Guide

### Step 1: Import Required Components

```typescript
import ProgressIndicator from './ProgressIndicator';
import SuccessAnimation from './SuccessAnimation';
import { useProgress } from '@/hooks/useProgress';
```

### Step 2: Define Progress Steps

```typescript
const {
  steps,
  isProcessing,
  error,
  startProcessing,
  completeStep,
  setStepError,
  cancelProcessing,
  resetProgress
} = useProgress({
  steps: [
    { id: 'validate', label: 'Validating files', estimatedTime: 2 },
    { id: 'process', label: 'Processing data', estimatedTime: 5 },
    { id: 'create', label: 'Creating output', estimatedTime: 3 },
    { id: 'finalize', label: 'Finalizing', estimatedTime: 2 }
  ],
  onComplete: () => {
    // Handle completion
  },
  onError: (err) => {
    console.error('Error:', err);
  },
  onCancel: async () => {
    resetProgress();
  }
});
```

### Step 3: Update Processing Function

```typescript
const handleProcess = useCallback(async () => {
  startProcessing();

  try {
    // Step 1: Validate
    await validateFiles();
    completeStep('validate');

    // Step 2: Process
    await processData();
    completeStep('process');

    // Step 3: Create
    const result = await createOutput();
    completeStep('create');

    // Step 4: Finalize
    setResult(result);
    completeStep('finalize');
  } catch (err) {
    setStepError('validate', 'Processing failed: ' + err.message);
  }
}, [startProcessing, completeStep, setStepError]);
```

### Step 4: Add Progress UI

```typescript
return (
  <div>
    {/* Progress Indicator */}
    {isProcessing && (
      <ProgressIndicator
        steps={steps}
        currentStep={steps.findIndex(step => step.status === 'active')}
        isProcessing={isProcessing}
        onCancel={cancelProcessing}
        showTimeEstimate={true}
        showCancelButton={true}
        className="mb-6"
      />
    )}

    {/* Error Message */}
    {error && (
      <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
        <span className="text-red-700 dark:text-red-300">{error}</span>
      </div>
    )}

    {/* Success Animation */}
    {result && (
      <SuccessAnimation
        title="Operation Complete!"
        message="Your files have been processed successfully"
        stats={[
          {
            label: 'Files Processed',
            value: result.fileCount.toString(),
            icon: <FileText className="h-5 w-5 text-blue-600" />
          },
          {
            label: 'Output Size',
            value: formatFileSize(result.size),
            icon: <Download className="h-5 w-5 text-green-600" />
          }
        ]}
        onAction={handleDownload}
        actionLabel="Download Result"
        actionIcon={<Download className="h-5 w-5" />}
        showConfetti={true}
      />
    )}
  </div>
);
```

## Features

### Real-time Progress
- Visual step-by-step progress
- Animated status indicators
- Progress percentage bar
- Current step highlighting

### Estimated Time
- Time remaining calculation
- Per-step time estimates
- Dynamic time updates
- Visual time indicators

### Cancel Operations
- Cancel button during processing
- Graceful cancellation handling
- Progress reset on cancel
- User confirmation

### Success Animations
- Animated success icons
- Confetti effects
- Statistics display
- Smooth transitions
- Action buttons

## Customization

### Progress Steps
```typescript
const steps = [
  { 
    id: 'unique-id', 
    label: 'Step Description', 
    estimatedTime: 5 // seconds
  }
];
```

### Success Animation Stats
```typescript
const stats = [
  {
    label: 'Stat Label',
    value: 'Stat Value',
    icon: <IconComponent className="h-5 w-5 text-color" />
  }
];
```

### Styling
Both components accept a `className` prop for custom styling:

```typescript
<ProgressIndicator className="custom-progress-styles" />
<SuccessAnimation className="custom-success-styles" />
```

## Error Handling

The system provides comprehensive error handling:

1. **Step-level errors**: Use `setStepError(stepId, message)`
2. **Global errors**: Automatically handled by the hook
3. **Cancellation errors**: Gracefully handled with reset
4. **Validation errors**: Shown before processing starts

## Best Practices

1. **Realistic time estimates**: Base estimates on actual processing times
2. **Clear step labels**: Use descriptive, user-friendly labels
3. **Error messages**: Provide helpful, actionable error messages
4. **Progress feedback**: Update progress frequently for long operations
5. **Cancel handling**: Always provide a way to cancel long operations
6. **Success celebration**: Make completed operations feel rewarding

## Example Integration

See `src/components/CSVToPDF.tsx` for a complete implementation example that demonstrates:
- Progress step definition
- Processing function updates
- UI integration
- Error handling
- Success animation

This system can be easily integrated into any PDF tool component to provide a consistent, professional user experience.
