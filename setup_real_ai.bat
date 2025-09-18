@echo off
echo 🚀 DocNestly Real AI Setup Script
echo ================================

echo.
echo 📋 Step 1: Download Python 3.11
echo Please download and install Python 3.11 from:
echo https://www.python.org/downloads/windows/
echo.
echo ⚠️  IMPORTANT: Check "Add Python to PATH" during installation!
echo.
pause

echo.
echo 🔍 Step 2: Verify Python Installation
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python and add it to PATH.
    pause
    exit /b 1
)

echo ✅ Python found!
echo.

echo 📦 Step 3: Create AI Backend Environment
cd /d "%~dp0"
mkdir ai_backend 2>nul
cd ai_backend

echo Creating virtual environment...
python -m venv ai_env
call ai_env\Scripts\activate.bat

echo.
echo 🤖 Step 4: Install AI/ML Dependencies
echo This will download ~2GB of AI models and libraries...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo 📥 Step 5: Download AI Models
echo Downloading FREE Hugging Face models...
python -c "
print('🤖 Downloading AI models...')
from transformers import pipeline
from sentence_transformers import SentenceTransformer

print('📥 Downloading summarization model...')
summarizer = pipeline('summarization', model='facebook/bart-large-cnn')

print('📥 Downloading Q&A model...')
qa_model = pipeline('question-answering', model='distilbert-base-cased-distilled-squad')

print('📥 Downloading sentiment analysis...')
classifier = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment-latest')

print('📥 Downloading document embeddings...')
embeddings = SentenceTransformer('all-MiniLM-L6-v2')

print('✅ All models downloaded and cached!')
print('🎉 DocNestly now has REAL AI capabilities!')
"

echo.
echo 🚀 Step 6: Start AI Backend
echo Starting the AI server...
python start_ai_server.py

pause
