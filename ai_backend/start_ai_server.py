#!/usr/bin/env python3
"""
Startup script for DocNestly AI Backend
This script ensures all models are downloaded and ready before starting the server
"""

import sys
import subprocess
import os
from pathlib import Path

def install_requirements():
    """Install all required packages"""
    print("📦 Installing AI/ML dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    return True

def download_models():
    """Download and cache AI models"""
    print("🤖 Downloading AI models (this may take a few minutes)...")
    
    try:
        # Import after installation
        from transformers import pipeline
        from sentence_transformers import SentenceTransformer
        
        print("📥 Downloading summarization model...")
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        
        print("📥 Downloading Q&A model...")
        qa_model = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")
        
        print("📥 Downloading sentiment analysis model...")
        classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
        
        print("📥 Downloading document embeddings...")
        embeddings = SentenceTransformer('all-MiniLM-L6-v2')
        
        print("✅ All AI models downloaded and cached!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download models: {e}")
        return False

def start_server():
    """Start the AI backend server"""
    print("🚀 Starting DocNestly AI Backend...")
    try:
        import uvicorn
        from main import app
        
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000, 
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

def main():
    """Main startup sequence"""
    print("🎯 DocNestly AI Backend Setup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required. Please upgrade Python.")
        return
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    
    # Install dependencies
    if not install_requirements():
        print("❌ Setup failed. Please check error messages above.")
        return
    
    # Download models
    if not download_models():
        print("⚠️ Model download failed, but server will start with fallback analysis.")
    
    # Start server
    print("\n🚀 Starting AI server...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📖 API docs will be at: http://localhost:8000/docs")
    print("🔄 Make sure your Next.js app is running on http://localhost:3000")
    print("\n" + "=" * 50)
    
    start_server()

if __name__ == "__main__":
    main()
