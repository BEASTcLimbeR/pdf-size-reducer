"""
Enhanced AI Backend for DocNestly - Adobe AI Assistant-like Intelligence
Advanced document understanding with conversational AI capabilities
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import PyPDF2
import io
import logging
from datetime import datetime
import json
import asyncio
import uuid
from pathlib import Path

# Enhanced ML/AI Imports
from transformers import pipeline, AutoTokenizer, AutoModel, AutoProcessor
from sentence_transformers import SentenceTransformer
import torch
import numpy as np
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import cv2
import pytesseract
from PIL import Image
import base64
import io

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker')

try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

# Initialize FastAPI app
app = FastAPI(title="DocNestly Enhanced AI Backend", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced AI Models with Adobe-like capabilities
class EnhancedAIModels:
    def __init__(self):
        self.summarizer = None
        self.qa_model = None
        self.classifier = None
        self.embeddings = None
        self.tokenizer = None
        self.ner_model = None
        self.sentiment_model = None
        self.text_generator = None
        self.document_classifier = None
        self.visual_analyzer = None
        self.loaded = False
        self.conversation_memory = {}
    
    async def load_models(self):
        """Load all enhanced AI models - Adobe-level intelligence"""
        if self.loaded:
            return
            
        print("🤖 Loading Enhanced AI models... This may take a few minutes on first run.")
        
        try:
            # Advanced document summarization (BART Large)
            print("Loading advanced summarization model...")
            self.summarizer = pipeline(
                "summarization", 
                model="facebook/bart-large-cnn",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Advanced question answering (RoBERTa)
            print("Loading advanced Q&A model...")
            self.qa_model = pipeline(
                "question-answering",
                model="deepset/roberta-base-squad2",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Advanced sentiment analysis
            print("Loading sentiment analysis...")
            self.sentiment_model = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Named Entity Recognition
            print("Loading NER model...")
            self.ner_model = pipeline(
                "ner",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Document embeddings for semantic search
            print("Loading document embeddings...")
            self.embeddings = SentenceTransformer('all-mpnet-base-v2')
            
            # Text generation for conversational AI
            print("Loading text generation model...")
            self.text_generator = pipeline(
                "text-generation",
                model="microsoft/DialoGPT-medium",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Document classification
            print("Loading document classifier...")
            self.document_classifier = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium",
                device=0 if torch.cuda.is_available() else -1
            )
            
            self.loaded = True
            print("✅ All Enhanced AI models loaded successfully!")
            print("🚀 DocNestly now has Adobe AI Assistant-level intelligence!")
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            raise e

# Global models instance
ai_models = EnhancedAIModels()

# Enhanced Pydantic models
class DocumentAnalysisResponse(BaseModel):
    document_type: str
    key_topics: List[str]
    entities: Dict[str, List[str]]
    summary: str
    word_count: int
    reading_time: int
    complexity: str
    sentiment: str
    confidence: float
    visual_elements: List[Dict[str, Any]]
    structure_analysis: Dict[str, Any]
    action_items: List[str]
    key_insights: List[str]

class ChatMessage(BaseModel):
    id: str
    type: str  # 'user' | 'ai' | 'system'
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    suggestions: List[str]
    confidence: float
    sources: List[str]
    action_items: List[str]

class ConversationContext(BaseModel):
    document_id: str
    messages: List[ChatMessage]
    document_analysis: DocumentAnalysisResponse
    user_preferences: Dict[str, Any]

# Enhanced document analysis functions
def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text from PDF with enhanced error handling"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

def extract_visual_elements(pdf_file: bytes) -> List[Dict[str, Any]]:
    """Extract visual elements from PDF (images, tables, charts)"""
    visual_elements = []
    try:
        # This would require additional PDF processing libraries
        # For now, return placeholder structure
        visual_elements = [
            {
                "type": "image",
                "page": 1,
                "description": "Chart or diagram detected",
                "confidence": 0.85
            }
        ]
    except Exception as e:
        print(f"Visual extraction failed: {e}")
    
    return visual_elements

def analyze_document_structure(text: str) -> Dict[str, Any]:
    """Analyze document structure and organization"""
    structure = {
        "has_headings": bool(re.search(r'^#+\s', text, re.MULTILINE)),
        "has_lists": bool(re.search(r'^\s*[-*•]\s', text, re.MULTILINE)),
        "has_tables": bool(re.search(r'\|.*\|', text)),
        "has_numbers": bool(re.search(r'\d+', text)),
        "paragraph_count": len(text.split('\n\n')),
        "sentence_count": len(nltk.sent_tokenize(text)),
        "avg_sentence_length": np.mean([len(s.split()) for s in nltk.sent_tokenize(text)])
    }
    return structure

def extract_action_items(text: str) -> List[str]:
    """Extract action items and tasks from document"""
    action_patterns = [
        r'(?:action|task|todo|follow.?up|next.?step)s?[:\s]+([^.!?]+)',
        r'(?:please|must|should|need to)\s+([^.!?]+)',
        r'(?:deadline|due|by)\s+([^.!?]+)',
        r'(?:meeting|call|email)\s+([^.!?]+)'
    ]
    
    action_items = []
    for pattern in action_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        action_items.extend([match.strip() for match in matches])
    
    return list(set(action_items))[:10]  # Limit to 10 unique items

def generate_key_insights(text: str, analysis: DocumentAnalysisResponse) -> List[str]:
    """Generate key insights and recommendations"""
    insights = []
    
    # Word count insights
    if analysis.word_count > 5000:
        insights.append("This is a comprehensive document that may require multiple review sessions")
    elif analysis.word_count < 500:
        insights.append("This is a concise document that can be reviewed quickly")
    
    # Complexity insights
    if analysis.complexity == "high":
        insights.append("High complexity detected - consider breaking into smaller sections")
    elif analysis.complexity == "low":
        insights.append("Low complexity - suitable for quick scanning")
    
    # Sentiment insights
    if analysis.sentiment == "positive":
        insights.append("Positive tone detected - good for stakeholder communication")
    elif analysis.sentiment == "negative":
        insights.append("Negative tone detected - may require careful handling")
    
    # Structure insights
    if analysis.structure_analysis.get("has_headings"):
        insights.append("Well-structured document with clear headings")
    if analysis.structure_analysis.get("has_tables"):
        insights.append("Contains tabular data - consider data visualization")
    
    return insights

def analyze_document_content(text: str, filename: str) -> DocumentAnalysisResponse:
    """Enhanced document analysis with Adobe-level intelligence"""
    try:
        # Basic text analysis
        words = text.split()
        word_count = len(words)
        reading_time = max(1, word_count // 200)
        
        # Enhanced document type classification
        doc_type = classify_document_type_enhanced(text, filename)
        
        # Extract key topics using advanced TF-IDF
        key_topics = extract_key_topics_enhanced(text)
        
        # Extract entities using NER
        entities = extract_entities_enhanced(text)
        
        # Generate summary using BART
        summary = ""
        if ai_models.loaded and ai_models.summarizer and len(text) > 100:
            try:
                max_length = 1024
                text_for_summary = text[:max_length] if len(text) > max_length else text
                summary_result = ai_models.summarizer(text_for_summary, max_length=200, min_length=50, do_sample=False)
                summary = summary_result[0]['summary_text']
            except Exception as e:
                print(f"Summarization failed: {e}")
                summary = generate_fallback_summary(text, doc_type, key_topics)
        else:
            summary = generate_fallback_summary(text, doc_type, key_topics)
        
        # Analyze sentiment
        sentiment = "neutral"
        if ai_models.loaded and ai_models.sentiment_model:
            try:
                sentiment_result = ai_models.sentiment_model(text[:512])
                sentiment = sentiment_result[0]['label'].lower()
            except Exception as e:
                print(f"Sentiment analysis failed: {e}")
        
        # Determine complexity
        complexity = determine_complexity_enhanced(text, word_count)
        
        # Extract visual elements (placeholder)
        visual_elements = []
        
        # Analyze document structure
        structure_analysis = analyze_document_structure(text)
        
        # Extract action items
        action_items = extract_action_items(text)
        
        # Generate key insights
        key_insights = []
        
        return DocumentAnalysisResponse(
            document_type=doc_type,
            key_topics=key_topics,
            entities=entities,
            summary=summary,
            word_count=word_count,
            reading_time=reading_time,
            complexity=complexity,
            sentiment=sentiment,
            confidence=0.95,
            visual_elements=visual_elements,
            structure_analysis=structure_analysis,
            action_items=action_items,
            key_insights=key_insights
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

def classify_document_type_enhanced(text: str, filename: str) -> str:
    """Enhanced document type classification"""
    text_lower = text.lower()
    filename_lower = filename.lower()
    
    # Enhanced classification patterns
    patterns = {
        "contract": ["agreement", "contract", "terms", "conditions", "party", "signature"],
        "report": ["report", "analysis", "findings", "conclusion", "recommendation", "executive summary"],
        "proposal": ["proposal", "proposed", "recommend", "suggest", "proposition"],
        "invoice": ["invoice", "bill", "payment", "amount", "total", "due date"],
        "manual": ["manual", "instructions", "how to", "step", "procedure", "guide"],
        "presentation": ["slide", "presentation", "agenda", "meeting", "overview"],
        "email": ["dear", "sincerely", "regards", "subject", "message"],
        "legal": ["legal", "law", "court", "judgment", "statute", "regulation"],
        "financial": ["financial", "revenue", "profit", "loss", "budget", "expense"],
        "technical": ["technical", "specification", "api", "code", "system", "architecture"]
    }
    
    scores = {}
    for doc_type, keywords in patterns.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        scores[doc_type] = score
    
    # Check filename patterns
    if any(ext in filename_lower for ext in ['.pdf', '.doc', '.docx']):
        if 'contract' in filename_lower or 'agreement' in filename_lower:
            return "contract"
        elif 'report' in filename_lower:
            return "report"
        elif 'invoice' in filename_lower or 'bill' in filename_lower:
            return "invoice"
    
    return max(scores, key=scores.get) if scores else "document"

def extract_key_topics_enhanced(text: str) -> List[str]:
    """Enhanced key topic extraction using TF-IDF and NER"""
    try:
        # Use NLTK for better text processing
        sentences = nltk.sent_tokenize(text)
        
        # Remove stopwords and tokenize
        stop_words = set(nltk.corpus.stopwords.words('english'))
        words = nltk.word_tokenize(text.lower())
        words = [word for word in words if word.isalpha() and word not in stop_words]
        
        # Use TF-IDF for topic extraction
        vectorizer = TfidfVectorizer(max_features=20, ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(sentences)
        feature_names = vectorizer.get_feature_names_out()
        
        # Get top topics
        scores = tfidf_matrix.sum(axis=0).A1
        topic_scores = list(zip(feature_names, scores))
        topic_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [topic for topic, score in topic_scores[:10] if score > 0.1]
        
    except Exception as e:
        print(f"Topic extraction failed: {e}")
        return ["document", "content", "information"]

def extract_entities_enhanced(text: str) -> Dict[str, List[str]]:
    """Enhanced entity extraction using NER"""
    entities = {
        "persons": [],
        "organizations": [],
        "locations": [],
        "dates": [],
        "money": [],
        "misc": []
    }
    
    if ai_models.loaded and ai_models.ner_model:
        try:
            # Process text in chunks to avoid token limits
            chunk_size = 512
            chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            
            for chunk in chunks:
                ner_results = ai_models.ner_model(chunk)
                
                for entity in ner_results:
                    entity_text = entity['word']
                    entity_label = entity['entity']
                    confidence = entity['score']
                    
                    if confidence > 0.8:  # High confidence threshold
                        if entity_label.startswith('B-PER') or entity_label.startswith('I-PER'):
                            entities["persons"].append(entity_text)
                        elif entity_label.startswith('B-ORG') or entity_label.startswith('I-ORG'):
                            entities["organizations"].append(entity_text)
                        elif entity_label.startswith('B-LOC') or entity_label.startswith('I-LOC'):
                            entities["locations"].append(entity_text)
                        elif entity_label.startswith('B-MISC') or entity_label.startswith('I-MISC'):
                            entities["misc"].append(entity_text)
            
            # Remove duplicates and clean up
            for key in entities:
                entities[key] = list(set(entities[key]))[:10]  # Limit to 10 per category
                
        except Exception as e:
            print(f"NER extraction failed: {e}")
    
    # Fallback to regex patterns
    if not any(entities.values()):
        entities = extract_entities_fallback(text)
    
    return entities

def extract_entities_fallback(text: str) -> Dict[str, List[str]]:
    """Fallback entity extraction using regex patterns"""
    entities = {
        "persons": [],
        "organizations": [],
        "locations": [],
        "dates": [],
        "money": [],
        "misc": []
    }
    
    # Date patterns
    date_patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{4}\b'
    ]
    
    for pattern in date_patterns:
        dates = re.findall(pattern, text, re.IGNORECASE)
        entities["dates"].extend(dates)
    
    # Money patterns
    money_patterns = [
        r'\$\d+(?:,\d{3})*(?:\.\d{2})?',
        r'\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)\b'
    ]
    
    for pattern in money_patterns:
        money = re.findall(pattern, text, re.IGNORECASE)
        entities["money"].extend(money)
    
    # Email patterns
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    entities["misc"].extend(emails)
    
    # Phone patterns
    phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'
    phones = re.findall(phone_pattern, text)
    entities["misc"].extend(phones)
    
    return entities

def determine_complexity_enhanced(text: str, word_count: int) -> str:
    """Enhanced complexity determination"""
    try:
        sentences = nltk.sent_tokenize(text)
        words = nltk.word_tokenize(text.lower())
        
        # Calculate various complexity metrics
        avg_sentence_length = len(words) / len(sentences) if sentences else 0
        avg_syllables = sum(count_syllables(word) for word in words) / len(words) if words else 0
        
        # Flesch Reading Ease Score
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables)
        
        # Determine complexity based on multiple factors
        if flesch_score < 30 or avg_sentence_length > 25 or word_count > 10000:
            return "high"
        elif flesch_score > 70 or avg_sentence_length < 10 or word_count < 1000:
            return "low"
        else:
            return "medium"
            
    except Exception as e:
        print(f"Complexity analysis failed: {e}")
        return "medium"

def count_syllables(word: str) -> int:
    """Count syllables in a word"""
    word = word.lower()
    vowels = "aeiouy"
    syllable_count = 0
    prev_was_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_was_vowel:
            syllable_count += 1
        prev_was_vowel = is_vowel
    
    if word.endswith('e'):
        syllable_count -= 1
    
    return max(1, syllable_count)

def generate_fallback_summary(text: str, doc_type: str, key_topics: List[str]) -> str:
    """Generate fallback summary when AI models fail"""
    sentences = nltk.sent_tokenize(text)
    
    if len(sentences) <= 3:
        return text
    
    # Simple extractive summarization
    word_freq = {}
    for word in nltk.word_tokenize(text.lower()):
        if word.isalpha() and word not in nltk.corpus.stopwords.words('english'):
            word_freq[word] = word_freq.get(word, 0) + 1
    
    sentence_scores = {}
    for sentence in sentences:
        words = nltk.word_tokenize(sentence.lower())
        score = sum(word_freq.get(word, 0) for word in words if word.isalpha())
        sentence_scores[sentence] = score
    
    # Get top 3 sentences
    top_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    summary = " ".join([sentence for sentence, score in top_sentences])
    
    return summary

# Enhanced API endpoints
@app.on_event("startup")
async def startup():
    """Initialize AI models on startup"""
    await ai_models.load_models()

@app.get("/")
async def root():
    return {"message": "DocNestly Enhanced AI Backend - Adobe AI Assistant Level Intelligence"}

@app.post("/analyze-document", response_model=DocumentAnalysisResponse)
async def analyze_document(file: UploadFile = File(...)):
    """Enhanced document analysis endpoint"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text
        text = extract_text_from_pdf(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text content found in PDF")
        
        # Analyze document
        analysis = analyze_document_content(text, file.filename)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_document(
    message: str,
    document_analysis: DocumentAnalysisResponse,
    conversation_id: Optional[str] = None
):
    """Enhanced chat endpoint with Adobe-like intelligence"""
    try:
        if not ai_models.loaded:
            raise HTTPException(status_code=503, detail="AI models not loaded")
        
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Store conversation context
        if conversation_id not in ai_models.conversation_memory:
            ai_models.conversation_memory[conversation_id] = {
                "messages": [],
                "document_analysis": document_analysis,
                "context": ""
            }
        
        # Generate AI response
        response = await generate_ai_response(message, document_analysis, conversation_id)
        
        # Store messages
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            type="user",
            content=message,
            timestamp=datetime.now()
        )
        
        ai_message = ChatMessage(
            id=str(uuid.uuid4()),
            type="ai",
            content=response["content"],
            timestamp=datetime.now(),
            metadata=response.get("metadata", {})
        )
        
        ai_models.conversation_memory[conversation_id]["messages"].extend([user_message, ai_message])
        
        # Generate suggestions
        suggestions = generate_smart_suggestions(message, document_analysis)
        
        return ChatResponse(
            message=ai_message,
            suggestions=suggestions,
            confidence=response.get("confidence", 0.8),
            sources=response.get("sources", []),
            action_items=response.get("action_items", [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_ai_response(message: str, document_analysis: DocumentAnalysisResponse, conversation_id: str) -> Dict[str, Any]:
    """Generate intelligent AI response with Adobe-like capabilities"""
    try:
        # Use question answering model for specific questions
        if ai_models.qa_model and len(message) > 10:
            qa_result = ai_models.qa_model(
                question=message,
                context=document_analysis.summary[:1000]  # Use summary as context
            )
            
            if qa_result['score'] > 0.3:  # Confidence threshold
                return {
                    "content": f"Based on the document analysis, {qa_result['answer']}",
                    "confidence": qa_result['score'],
                    "sources": ["document_analysis"],
                    "action_items": []
                }
        
        # Generate contextual response based on document type and content
        response_content = generate_contextual_response(message, document_analysis)
        
        return {
            "content": response_content,
            "confidence": 0.85,
            "sources": ["document_analysis", "ai_models"],
            "action_items": document_analysis.action_items[:3]
        }
        
    except Exception as e:
        print(f"AI response generation failed: {e}")
        return {
            "content": "I understand you're asking about the document. Let me help you analyze it further.",
            "confidence": 0.5,
            "sources": [],
            "action_items": []
        }

def generate_contextual_response(message: str, analysis: DocumentAnalysisResponse) -> str:
    """Generate contextual response based on document analysis"""
    message_lower = message.lower()
    
    # Document overview
    if any(word in message_lower for word in ["what", "overview", "about", "summary"]):
        return f"""📄 **Document Overview**

**Type:** {analysis.document_type.title()}
**Word Count:** {analysis.word_count:,} words
**Reading Time:** {analysis.reading_time} minutes
**Complexity:** {analysis.complexity.title()}
**Sentiment:** {analysis.sentiment.title()}

**Key Topics:**
{chr(10).join(f"• {topic}" for topic in analysis.key_topics[:5])}

**Summary:**
{analysis.summary}

**Key Insights:**
{chr(10).join(f"• {insight}" for insight in analysis.key_insights[:3])}"""

    # Key topics
    elif any(word in message_lower for word in ["topics", "themes", "subjects"]):
        return f"""🎯 **Key Topics Identified**

{chr(10).join(f"• {topic}" for topic in analysis.key_topics)}

**Document Structure:**
• Paragraphs: {analysis.structure_analysis.get('paragraph_count', 'N/A')}
• Sentences: {analysis.structure_analysis.get('sentence_count', 'N/A')}
• Has Headings: {'Yes' if analysis.structure_analysis.get('has_headings') else 'No'}
• Has Tables: {'Yes' if analysis.structure_analysis.get('has_tables') else 'No'}"""

    # Entities
    elif any(word in message_lower for word in ["people", "names", "entities", "who"]):
        entities_text = ""
        for category, items in analysis.entities.items():
            if items:
                entities_text += f"\n**{category.title()}:**
{chr(10).join(f"• {item}" for item in items[:5])}\n"
        
        return f"""👥 **Entities Found**

{entities_text if entities_text else "No specific entities identified in the document."}"""

    # Action items
    elif any(word in message_lower for word in ["action", "task", "todo", "next", "follow"]):
        if analysis.action_items:
            return f"""✅ **Action Items Identified**

{chr(10).join(f"• {item}" for item in analysis.action_items)}

**Recommendations:**
• Prioritize items with deadlines
• Consider breaking complex tasks into smaller steps
• Set up follow-up reminders for important actions"""
        else:
            return "No specific action items were identified in this document. The content appears to be informational rather than task-oriented."

    # Default response
    else:
        return f"""🤖 **AI Assistant Response**

I've analyzed your document and can help you with:

• **Overview & Summary** - Get a quick understanding of the content
• **Key Topics** - Explore main themes and subjects
• **Entities** - Find people, organizations, dates, and locations
• **Action Items** - Identify tasks and follow-ups
• **Structure Analysis** - Understand document organization

What would you like to know more about?"""

def generate_smart_suggestions(message: str, analysis: DocumentAnalysisResponse) -> List[str]:
    """Generate smart suggestions based on context"""
    suggestions = []
    message_lower = message.lower()
    
    # Context-aware suggestions
    if "what" in message_lower:
        suggestions.extend([
            "What are the main conclusions?",
            "What are the key recommendations?",
            "What is the document's purpose?"
        ])
    
    if "how" in message_lower:
        suggestions.extend([
            "How is this structured?",
            "How can I implement this?",
            "How does this relate to my work?"
        ])
    
    if analysis.document_type == "contract":
        suggestions.extend([
            "What are the key terms?",
            "What are the obligations?",
            "What are the termination clauses?"
        ])
    
    if analysis.document_type == "report":
        suggestions.extend([
            "What are the main findings?",
            "What are the recommendations?",
            "What data supports the conclusions?"
        ])
    
    # Always include general suggestions
    suggestions.extend([
        "Summarize the key points",
        "Find all dates mentioned",
        "Extract contact information"
    ])
    
    return list(set(suggestions))[:5]  # Return unique suggestions, max 5

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
