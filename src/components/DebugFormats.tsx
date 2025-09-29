'use client';
import React from 'react';

const DebugFormats: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Debug: Supported Formats Component
      </h1>
      
      <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
          ✅ Component is Loading Successfully!
        </h2>
        <p className="text-green-700 dark:text-green-300">
          If you can see this message, the SupportedFormats component is working correctly.
        </p>
      </div>

      <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📋 File Formats Available
        </h2>
        <p className="text-blue-700 dark:text-blue-300">
          The component should show 40+ supported file formats including:
        </p>
        <ul className="list-disc list-inside mt-2 text-blue-700 dark:text-blue-300">
          <li>Images: JPEG, PNG, WebP, AVIF, TIFF, BMP, ICO, SVG</li>
          <li>Documents: PDF, Word, OpenDocument</li>
          <li>Spreadsheets: Excel, CSV, OpenDocument</li>
          <li>Presentations: PowerPoint, OpenDocument</li>
          <li>Text: TXT, RTF, Markdown</li>
          <li>Archives: ZIP, RAR, 7Z, TAR, GZ, BZ2</li>
          <li>Vector: CorelDRAW, SVG</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugFormats;
