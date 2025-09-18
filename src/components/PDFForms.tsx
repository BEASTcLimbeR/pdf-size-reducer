'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Type,
  Square,
  Circle,
  ChevronDown,
  Calendar,
  PenTool,
  Settings
} from 'lucide-react';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFSignature } from 'pdf-lib';

interface PDFFormsProps {
  onReset?: () => void;
}

interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'date' | 'signature';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  required: boolean;
  options?: string[]; // For dropdown and radio
  defaultValue?: string;
}

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  formFields: FormField[];
}

export default function PDFForms({ onReset }: PDFFormsProps) {
  const [mode, setMode] = useState<'create' | 'edit' | 'fill'>('create');
  const [uploadedFile, setUploadedFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Form field types
  const fieldTypes = [
    { id: 'text', name: 'Text Field', icon: Type, description: 'Single line text input' },
    { id: 'checkbox', name: 'Checkbox', icon: Square, description: 'Yes/No selection' },
    { id: 'dropdown', name: 'Dropdown', icon: ChevronDown, description: 'Select from options' },
    { id: 'radio', name: 'Radio Button', icon: Circle, description: 'Single choice selection' },
    { id: 'date', name: 'Date Field', icon: Calendar, description: 'Date picker' },
    { id: 'signature', name: 'Signature', icon: PenTool, description: 'Digital signature' }
  ];

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        setUploadedFile({
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          formFields: []
        });
        
        if (mode === 'fill') {
          // Auto-detect form fields in existing PDF
          detectFormFields(file);
        }
      } else {
        setError('Please select a PDF file');
      }
    }
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  // Detect form fields in existing PDF
  const detectFormFields = async (file: File) => {
    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      
      const detectedFields: FormField[] = [];
      
      // Get all form fields
      const fields = form.getFields();
      
      fields.forEach((field, index) => {
        const fieldType = field.constructor.name;
        const fieldName = field.getName();
        
        let type: FormField['type'] = 'text';
        if (fieldType.includes('CheckBox')) type = 'checkbox';
        else if (fieldType.includes('Dropdown')) type = 'dropdown';
        else if (fieldType.includes('RadioGroup')) type = 'radio';
        else if (fieldType.includes('Signature')) type = 'signature';
        
        detectedFields.push({
          id: `field_${index}`,
          type,
          name: fieldName,
          x: 50 + (index * 20),
          y: 700 - (index * 30),
          width: 200,
          height: 20,
          label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          required: false,
          options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
        });
      });
      
      setFormFields(detectedFields);
      setIsProcessing(false);
    } catch (error) {
      setError('Failed to detect form fields');
      setIsProcessing(false);
    }
  };

  // Add new form field
  const addFormField = (type: FormField['type']) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: `field_${formFields.length + 1}`,
      x: 50 + (formFields.length * 20),
      y: 700 - (formFields.length * 30),
      width: 200,
      height: 20,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };
    
    setFormFields([...formFields, newField]);
    setSelectedField(newField);
    setShowFieldEditor(true);
  };

  // Update form field
  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  // Delete form field
  const deleteFormField = (fieldId: string) => {
    setFormFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
      setShowFieldEditor(false);
    }
  };

  // Create PDF with form fields
  const createPDFWithForms = async () => {
    try {
      setIsProcessing(true);
      
      let pdfDoc: PDFDocument;
      
      if (uploadedFile) {
        // Edit existing PDF
        const arrayBuffer = await uploadedFile.file.arrayBuffer();
        pdfDoc = await PDFDocument.load(arrayBuffer);
      } else {
        // Create new PDF
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        page.drawText('PDF Form', { x: 50, y: 750, size: 24 });
      }
      
      const form = pdfDoc.getForm();
      
      // Add form fields
      for (const field of formFields) {
        const page = pdfDoc.getPage(0);
        
        switch (field.type) {
          case 'text':
            const textField = form.createTextField(field.name);
            textField.setText(field.defaultValue || '');
            textField.addToPage(page, { x: field.x, y: field.y, width: field.width, height: field.height });
            break;
            
          case 'checkbox':
            const checkBox = form.createCheckBox(field.name);
            checkBox.addToPage(page, { x: field.x, y: field.y, width: field.height, height: field.height });
            break;
            
          case 'dropdown':
            const dropdown = form.createDropdown(field.name);
            if (field.options) {
              field.options.forEach(option => dropdown.addOption(option, option));
            }
            dropdown.addToPage(page, { x: field.x, y: field.y, width: field.width, height: field.height });
            break;
            
          case 'radio':
            const radioGroup = form.createRadioGroup(field.name);
            if (field.options) {
              field.options.forEach((option, index) => {
                radioGroup.addOptionToPage(option, page, { 
                  x: field.x + (index * 30), 
                  y: field.y, 
                  width: field.height, 
                  height: field.height 
                });
              });
            }
            break;
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      
      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
    } catch (error) {
      setError('Failed to create PDF form');
      setIsProcessing(false);
    }
  };

  // Fill form data
  const fillForm = async () => {
    if (!uploadedFile) return;
    
    try {
      setIsProcessing(true);
      const arrayBuffer = await uploadedFile.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      
      // Fill form fields with data
      Object.entries(formData).forEach(([fieldName, value]) => {
        const field = form.getField(fieldName);
        if (field) {
          if (field.constructor.name.includes('TextField')) {
            (field as PDFTextField).setText(value);
          } else if (field.constructor.name.includes('CheckBox')) {
            (field as PDFCheckBox).check();
          } else if (field.constructor.name.includes('Dropdown')) {
            (field as PDFDropdown).select(value);
          }
        }
      });
      
      const pdfBytes = await pdfDoc.save();
      
      // Download filled PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsProcessing(false);
    } catch (error) {
      setError('Failed to fill form');
      setIsProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
      {/* Mode Selection */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => setMode('create')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" />
            Create Forms
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              mode === 'edit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" />
            Edit Forms
          </button>
          <button
            onClick={() => setMode('fill')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              mode === 'fill'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" />
            Fill Forms
          </button>
        </div>
      </div>

      {/* File Upload */}
      {mode !== 'create' && (
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop PDF here' : 'Upload PDF with forms'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'edit' ? 'Upload PDF to edit form fields' : 'Upload PDF to fill out forms'}
            </p>
          </div>
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Form Fields */}
      {mode === 'create' || mode === 'edit' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {/* Field Types */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Form Fields
            </h3>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => (
                <button
                  key={fieldType.id}
                  onClick={() => addFormField(fieldType.id as FormField['type'])}
                  className="w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <fieldType.icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{fieldType.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{fieldType.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Preview */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Form Preview
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[400px] relative">
              {formFields.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No form fields added yet</p>
                  <p className="text-sm">Click on a field type to add it to your form</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formFields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedField?.id === field.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setSelectedField(field);
                        setShowFieldEditor(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{field.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFormField(field.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Fill Form Mode */
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fill Form Fields
          </h3>
          {formFields.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No form fields detected</p>
              <p className="text-sm">Upload a PDF with form fields to fill them out</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter text..."
                    />
                  )}
                  
                  {field.type === 'checkbox' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Check this box</span>
                    </label>
                  )}
                  
                  {field.type === 'dropdown' && field.options && (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select an option...</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'radio' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name={field.name}
                            value={option}
                            checked={formData[field.name] === option}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="mr-2"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field Editor Modal */}
      {showFieldEditor && selectedField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Field Properties
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateFormField(selectedField.id, { label: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => updateFormField(selectedField.id, { name: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={selectedField.required}
                  onChange={(e) => updateFormField(selectedField.id, { required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="required" className="text-sm text-gray-700 dark:text-gray-300">
                  Required field
                </label>
              </div>
              
              {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    value={selectedField.options?.join('\n') || ''}
                    onChange={(e) => updateFormField(selectedField.id, { 
                      options: e.target.value.split('\n').filter(opt => opt.trim()) 
                    })}
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFieldEditor(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFieldEditor(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
        {(mode === 'create' || mode === 'edit') && (
          <button
            onClick={createPDFWithForms}
            disabled={formFields.length === 0 || isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating PDF...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {mode === 'create' ? 'Create PDF Form' : 'Update PDF Form'}
              </>
            )}
          </button>
        )}
        
        {mode === 'fill' && (
          <button
            onClick={fillForm}
            disabled={formFields.length === 0 || isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Filling Form...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download Filled Form
              </>
            )}
          </button>
        )}

        <button
          onClick={onReset}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RotateCcw className="h-5 w-5 mr-2 inline" />
          Reset
        </button>
      </div>
    </div>
  );
}
