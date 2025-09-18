@echo off
echo 🐍 Starting Ultra-Accurate PDF Analyzer with PyMuPDF
echo =====================================================

cd ai_backend
call ai_env\Scripts\activate.bat

echo 📦 Installing PyMuPDF for ultra-accurate analysis...
pip install PyMuPDF fastapi uvicorn python-multipart

echo.
echo 🚀 Starting PyMuPDF server for accurate page counting...
echo 📊 This will provide 99% accurate page counts and word counts!
echo 🌐 Server will run on: http://localhost:8001
echo.

python pymupdf_server.py

pause
