'use client';
import React, { useState, useMemo } from 'react';
import { FileText, Image, FileSpreadsheet, Presentation, Archive, Code, Palette, Search, Filter } from 'lucide-react';
import { FileTypeDetector, FileTypeInfo } from '@/utils/fileTypeDetector';

const SupportedFormats: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allFormats = useMemo(() => FileTypeDetector.getSupportedTypes(), []);
  
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(allFormats.map(format => format.category))];
    return cats;
  }, [allFormats]);

  const filteredFormats = useMemo(() => {
    return allFormats.filter(format => {
      const matchesSearch = format.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           format.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || format.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allFormats, searchTerm, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'document': return <FileText className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5" />;
      case 'presentation': return <Presentation className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      case 'text': return <Code className="w-5 h-5" />;
      case 'vector': return <Palette className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    allFormats.forEach(format => {
      stats[format.category] = (stats[format.category] || 0) + 1;
    });
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Supported File Formats
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your PDF Size Reducer supports <span className="font-semibold text-blue-600 dark:text-blue-400">{allFormats.length} file formats</span> across multiple categories
        </p>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats).map(([category, count]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center mb-2">
                {getCategoryIcon(category)}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category} formats</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search file formats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Filter className="w-5 h-5 text-gray-400 mt-1" />
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? 'All Formats' : `${category.charAt(0).toUpperCase() + category.slice(1)} (${stats[category] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFormats.map((format, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{format.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {format.type}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {format.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${FileTypeDetector.getCategoryColor(format.category)}`}>
                    {format.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Max {format.maxSize}MB
                  </span>
                </div>
                {format.suggestedTools.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested tools:</div>
                    <div className="flex flex-wrap gap-1">
                      {format.suggestedTools.slice(0, 3).map((tool, toolIndex) => (
                        <span
                          key={toolIndex}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                        >
                          {tool.replace('-', ' ')}
                        </span>
                      ))}
                      {format.suggestedTools.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{format.suggestedTools.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFormats.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No formats found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Need a format not listed?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We're constantly adding support for new file formats. If you need a specific format, let us know!
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total supported formats: <span className="font-semibold">{allFormats.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportedFormats;
