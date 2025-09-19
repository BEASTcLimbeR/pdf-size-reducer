@echo off
echo ========================================
echo   DocNestly Enhanced AI Backend
echo   Adobe AI Assistant Level Intelligence
echo ========================================
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ and try again
    pause
    exit /b 1
)

echo.
echo Checking if virtual environment exists...
if not exist "ai_backend\venv" (
    echo Creating virtual environment...
    cd ai_backend
    python -m venv venv
    cd ..
)

echo.
echo Activating virtual environment...
call ai_backend\venv\Scripts\activate.bat

echo.
echo Installing enhanced AI dependencies...
echo This may take several minutes on first run...
pip install --upgrade pip
pip install -r ai_backend\requirements_enhanced.txt

echo.
echo Downloading AI models...
echo This will download several GB of models...
python -c "
from transformers import pipeline, AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
import torch

print('Downloading BART summarization model...')
summarizer = pipeline('summarization', model='facebook/bart-large-cnn')

print('Downloading RoBERTa Q&A model...')
qa_model = pipeline('question-answering', model='deepset/roberta-base-squad2')

print('Downloading sentiment analysis model...')
sentiment = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment-latest')

print('Downloading NER model...')
ner = pipeline('ner', model='dbmdz/bert-large-cased-finetuned-conll03-english')

print('Downloading document embeddings...')
embeddings = SentenceTransformer('all-mpnet-base-v2')

print('Downloading text generation model...')
generator = pipeline('text-generation', model='microsoft/DialoGPT-medium')

print('✅ All AI models downloaded successfully!')
print('🚀 DocNestly now has Adobe AI Assistant-level intelligence!')
"

echo.
echo Starting Enhanced AI Backend Server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

cd ai_backend
python enhanced_ai_server.py

pause
