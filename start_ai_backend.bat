@echo off
echo 🚀 Starting DocNestly AI Backend with REAL advanced AI intelligence!
echo.

cd ai_backend
call ai_env\Scripts\activate.bat

echo 🤖 Loading AI models...
echo This may take 2-3 minutes on first startup.
echo.

uvicorn main:app --host 0.0.0.0 --port 8000

pause
