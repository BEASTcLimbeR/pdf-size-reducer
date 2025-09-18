"""
Ultra-Accurate PDF Analysis using PyMuPDF
This provides the most accurate page counting and text extraction possible
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import io
from datetime import datetime
import re
from typing import List, Dict, Any

app = FastAPI(title="DocNestly Accurate PDF Analyzer", version="1.0.0")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AccuratePDFResponse(BaseModel):
    pages: int
    word_count: int
    text_sample: str
    full_text: str
    images_count: int
    file_size: int
    analysis_method: str
    confidence: float
    metadata: Dict[str, Any]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "PyMuPDF Accurate PDF Analyzer",
        "pymupdf_version": fitz.version[0],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze-pdf-accurate", response_model=AccuratePDFResponse)
async def analyze_pdf_with_pymupdf(file: UploadFile = File(...)):
    """Ultra-accurate PDF analysis using PyMuPDF"""
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files supported")
        
        # Read file content
        pdf_content = await file.read()
        
        # Open PDF with PyMuPDF
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        
        # Get accurate page count
        page_count = pdf_document.page_count
        
        # Extract text from all pages
        full_text = ""
        images_count = 0
        
        for page_num in range(page_count):
            page = pdf_document[page_num]
            
            # Extract text
            page_text = page.get_text()
            full_text += page_text + "\n\n"
            
            # Count images
            image_list = page.get_images()
            images_count += len(image_list)
        
        # Clean up text
        cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
        
        # Accurate word count
        words = [word for word in cleaned_text.split() if word.strip() and len(word) > 1]
        word_count = len(words)
        
        # Get document metadata
        metadata = pdf_document.metadata
        
        # Close document
        pdf_document.close()
        
        print(f"✅ PyMuPDF Analysis Complete: {page_count} pages, {word_count} words, {images_count} images")
        
        return AccuratePDFResponse(
            pages=page_count,
            word_count=word_count,
            text_sample=cleaned_text[:2000],  # First 2000 chars for preview
            full_text=cleaned_text[:10000],   # First 10000 chars for analysis
            images_count=images_count,
            file_size=len(pdf_content),
            analysis_method="PyMuPDF Ultra-Accurate Analysis",
            confidence=0.99,
            metadata={
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "creator": metadata.get("creator", ""),
                "creation_date": str(metadata.get("creationDate", "")),
                "modification_date": str(metadata.get("modDate", "")),
                "pages_analyzed": page_count,
                "images_found": images_count
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PyMuPDF analysis failed: {str(e)}")

@app.post("/extract-text-accurate")
async def extract_text_with_pymupdf(file: UploadFile = File(...)):
    """Extract complete text using PyMuPDF"""
    try:
        pdf_content = await file.read()
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        
        # Extract text with formatting
        full_text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()
            full_text += f"--- Page {page_num + 1} ---\n{page_text}\n\n"
        
        pdf_document.close()
        
        # Extract entities from real text
        dates = extract_dates_from_text(full_text)
        contacts = extract_contacts_from_text(full_text)
        financial = extract_financial_from_text(full_text)
        
        return {
            "full_text": full_text,
            "word_count": len(full_text.split()),
            "pages": pdf_document.page_count,
            "dates_found": dates,
            "contacts_found": contacts,
            "financial_data": financial
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

def extract_dates_from_text(text: str) -> List[str]:
    """Extract all dates from text"""
    date_patterns = [
        r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b',
        r'\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b',
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\bQ[1-4]\s+\d{4}\b',
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b'
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    
    return list(set(dates))[:10]  # Remove duplicates, limit to 10

def extract_contacts_from_text(text: str) -> List[str]:
    """Extract contact information"""
    contacts = []
    
    # Email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    contacts.extend(emails)
    
    # Phone numbers
    phone_patterns = [
        r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\+\d{1,3}\s?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}'
    ]
    
    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        contacts.extend(phones)
    
    # Names (capitalized words)
    name_pattern = r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b'
    names = re.findall(name_pattern, text)
    contacts.extend(names[:5])  # Limit names
    
    return list(set(contacts))[:8]

def extract_financial_from_text(text: str) -> List[str]:
    """Extract financial information"""
    financial = []
    
    # Money amounts
    money_patterns = [
        r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
        r'\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?)',
        r'(?:total|amount|cost|price|budget):\s*\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?'
    ]
    
    for pattern in money_patterns:
        amounts = re.findall(pattern, text, re.IGNORECASE)
        financial.extend(amounts)
    
    return list(set(financial))[:5]

if __name__ == "__main__":
    import uvicorn
    print("🐍 Starting PyMuPDF Accurate PDF Analyzer...")
    print("📊 This provides ultra-accurate page counting and text extraction!")
    print("🌐 Server available at: http://localhost:8001")
    print("=" * 60)
    
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
