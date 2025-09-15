# DocNestly

A comprehensive, modern web application built with Next.js that provides all PDF tools in one place. Similar to [iLovePDF](https://www.ilovepdf.com/) but with better features, this toolkit allows users to compress, merge, split, convert, edit, and secure PDF files directly in their browser. The application provides a clean, intuitive interface with drag-and-drop functionality and advanced processing options.

## Features

### 🚀 Complete PDF Toolkit
- **Compress PDF**: Reduce file size with 3 quality levels (50%, 70%, 90% size)
- **Merge PDF**: Combine multiple PDFs with drag-and-drop reordering
- **Split PDF**: Split into individual pages, ranges, or custom selections
- **Convert PDF**: Convert to/from Word, PowerPoint, Excel, JPG, HTML
- **Edit PDF**: Rotate, watermark, crop, add page numbers, edit content
- **PDF Security**: Protect, unlock, sign, redact, and compare PDFs
- **Optimize PDF**: Repair damaged files and OCR scanned documents

### 🎨 Advanced Features
- **Drag & Drop Upload**: Easy file upload with visual feedback
- **Browser-Based Processing**: All processing happens locally - no data leaves your device
- **Multiple Quality Settings**: Choose compression levels with visual previews
- **Advanced Options**: Remove metadata and annotations for better compression
- **Real-time Progress**: Visual progress indicators during processing
- **Instant Download**: Download processed files immediately
- **Mobile Responsive**: Works perfectly on all devices

### 🎨 User Experience
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode Support**: Automatic dark/light mode switching
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error messages and validation

### 🔒 Privacy & Security
- **100% Client-Side**: No files are uploaded to servers
- **No Data Storage**: Files are processed and immediately discarded
- **Secure Processing**: Uses industry-standard PDF libraries

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib
- **File Upload**: react-dropzone
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-size-reducer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload PDF**: Drag and drop a PDF file or click to browse
2. **Choose Settings**: Select compression quality and options
3. **Compress**: The file is automatically compressed
4. **Download**: Download your compressed PDF file

## Compression Options

### Quality Levels
- **Low Quality**: Maximum compression, smaller file size, lower quality
- **Medium Quality**: Balanced compression, good quality and file size (default)
- **High Quality**: Minimal compression, best quality, larger file size

### Advanced Options
- **Remove Metadata**: Strips author, title, and other metadata
- **Remove Annotations**: Removes comments, highlights, and annotations

## File Limitations

- **File Size**: Maximum 50MB per file
- **File Type**: PDF files only
- **Browser Support**: Modern browsers with JavaScript enabled

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── PDFUploader.tsx # File upload component
│   └── CompressionResults.tsx # Results display
└── utils/             # Utility functions
    └── pdfCompression.ts # PDF processing logic
```

### Key Components

#### PDFUploader
- Handles file drag-and-drop
- Validates file type and size
- Provides visual feedback

#### CompressionResults
- Manages compression process
- Displays progress and results
- Handles download functionality

#### pdfCompression Utility
- Core PDF processing logic
- Multiple compression strategies
- Error handling and validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ using Next.js and modern web technologies.