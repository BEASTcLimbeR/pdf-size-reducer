'use client';

import { useState } from 'react';

export default function DropdownTest() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Dropdown
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-white border-2 border-red-500 rounded shadow-lg z-50">
          <div className="p-4">
            <p>This is a test dropdown</p>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-gray-200 px-2 py-1 rounded mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
