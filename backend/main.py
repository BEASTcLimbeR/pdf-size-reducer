from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime
import random
import json
import os
from collections import defaultdict, Counter
import statistics

app = FastAPI(
    title="Predictive Processing AI Backend",
    description="AI service for tracking user behavior and generating predictive suggestions.",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class UserAction(BaseModel):
    toolId: str
    action: str
    timestamp: str
    metadata: Dict[str, Any] = {}

class PredictivePattern(BaseModel):
    id: str
    type: str  # 'operation' | 'workflow' | 'timing' | 'file_type'
    description: str
    frequency: float  # 0-1
    confidence: float  # 0-1
    lastSeen: str
    examples: List[str]
    suggestedAction: Optional[Dict[str, Any]] = None

class SuggestedAction(BaseModel):
    id: str
    toolId: str
    name: str
    description: str
    confidence: float
    reasoning: str
    estimatedSavings: Optional[str] = None
    cta: str
    priority: str  # 'high' | 'medium' | 'low'
    category: str

class UserInsights(BaseModel):
    totalActions: int
    mostUsedTool: str
    averageSessionLength: float
    peakUsageHours: List[str]
    commonWorkflows: List[str]
    efficiencyScore: float

# --- In-memory storage (replace with database in production) ---
user_actions: List[UserAction] = []
action_patterns: Dict[str, List[UserAction]] = defaultdict(list)

# --- AI Pattern Analysis Functions ---
def analyze_tool_usage_patterns() -> List[PredictivePattern]:
    """Analyze patterns in tool usage"""
    patterns = []
    
    if not user_actions:
        return patterns
    
    # Group actions by tool
    tool_actions = defaultdict(list)
    for action in user_actions:
        tool_actions[action.toolId].append(action)
    
    # Find most used tools
    tool_counts = Counter(action.toolId for action in user_actions)
    most_used_tool = tool_counts.most_common(1)[0] if tool_counts else None
    
    if most_used_tool and most_used_tool[1] > 3:
        patterns.append(PredictivePattern(
            id=f"pattern-tool-{most_used_tool[0]}",
            type="operation",
            description=f"You frequently use the {most_used_tool[0]} tool",
            frequency=min(most_used_tool[1] / len(user_actions), 1.0),
            confidence=0.8,
            lastSeen=datetime.datetime.now().isoformat(),
            examples=[f"Used {most_used_tool[0]} {most_used_tool[1]} times"]
        ))
    
    # Find workflow patterns (sequential tool usage)
    workflow_patterns = find_workflow_patterns()
    patterns.extend(workflow_patterns)
    
    # Find timing patterns
    timing_patterns = find_timing_patterns()
    patterns.extend(timing_patterns)
    
    return patterns

def find_workflow_patterns() -> List[PredictivePattern]:
    """Find common workflow patterns"""
    patterns = []
    
    if len(user_actions) < 3:
        return patterns
    
    # Look for common sequences
    sequences = []
    for i in range(len(user_actions) - 1):
        current_tool = user_actions[i].toolId
        next_tool = user_actions[i + 1].toolId
        sequences.append((current_tool, next_tool))
    
    sequence_counts = Counter(sequences)
    common_sequences = sequence_counts.most_common(3)
    
    for (tool1, tool2), count in common_sequences:
        if count > 2:  # Only patterns that occur more than twice
            patterns.append(PredictivePattern(
                id=f"pattern-workflow-{tool1}-{tool2}",
                type="workflow",
                description=f"You often use {tool1} followed by {tool2}",
                frequency=count / len(sequences),
                confidence=0.7,
                lastSeen=datetime.datetime.now().isoformat(),
                examples=[f"Used {tool1} → {tool2} {count} times"]
            ))
    
    return patterns

def find_timing_patterns() -> List[PredictivePattern]:
    """Find timing-based patterns"""
    patterns = []
    
    if not user_actions:
        return patterns
    
    # Analyze usage by hour of day
    hours = []
    for action in user_actions:
        try:
            timestamp = datetime.datetime.fromisoformat(action.timestamp.replace('Z', '+00:00'))
            hours.append(timestamp.hour)
        except:
            continue
    
    if hours:
        hour_counts = Counter(hours)
        peak_hours = hour_counts.most_common(2)
        
        if peak_hours:
            peak_hour, count = peak_hours[0]
            if count > 3:
                patterns.append(PredictivePattern(
                    id=f"pattern-timing-{peak_hour}",
                    type="timing",
                    description=f"You're most active around {peak_hour}:00",
                    frequency=count / len(hours),
                    confidence=0.6,
                    lastSeen=datetime.datetime.now().isoformat(),
                    examples=[f"Used tools {count} times at {peak_hour}:00"]
                ))
    
    return patterns

def generate_smart_suggestions() -> List[SuggestedAction]:
    """Generate AI-powered suggestions based on user patterns"""
    suggestions = []
    
    if not user_actions:
        return suggestions
    
    # Analyze recent actions (last 10)
    recent_actions = user_actions[-10:] if len(user_actions) > 10 else user_actions
    
    # Count recent tool usage
    recent_tool_counts = Counter(action.toolId for action in recent_actions)
    
    # Suggestion 1: If user uploads many files, suggest compression
    if recent_tool_counts.get('pdf-uploader', 0) > 2:
        suggestions.append(SuggestedAction(
            id="suggest-compress",
            toolId="compress",
            name="Compress Your PDFs",
            description="You've uploaded several PDF files recently. Compressing them can save space and improve performance.",
            confidence=0.9,
            reasoning="Multiple file uploads detected in recent activity",
            estimatedSavings="Up to 70% file size reduction",
            cta="Go to Compress PDF",
            priority="high",
            category="Efficiency"
        ))
    
    # Suggestion 2: If user merges files, suggest batch processing
    if recent_tool_counts.get('merge-pdf', 0) > 1:
        suggestions.append(SuggestedAction(
            id="suggest-batch",
            toolId="batch-processing",
            name="Try Batch Processing",
            description="You frequently merge documents. Batch processing can automate this workflow.",
            confidence=0.8,
            reasoning="Frequent merge operations detected",
            estimatedSavings="Save 5-10 minutes per batch",
            cta="Go to Batch Processing",
            priority="medium",
            category="Automation"
        ))
    
    # Suggestion 3: If user converts files, suggest AI chat
    if recent_tool_counts.get('csv-to-pdf', 0) > 0 or recent_tool_counts.get('word-to-pdf', 0) > 0:
        suggestions.append(SuggestedAction(
            id="suggest-ai-chat",
            toolId="ai-chat",
            name="Chat with Your Documents",
            description="You've been working with documents. Ask our AI questions about their content or get summaries.",
            confidence=0.7,
            reasoning="Document processing activity detected",
            estimatedSavings="Instant insights and answers",
            cta="Go to AI Document Chat",
            priority="medium",
            category="Intelligence"
        ))
    
    # Suggestion 4: If user works with many files, suggest organization
    total_files = sum(1 for action in recent_actions if 'file' in action.action.lower())
    if total_files > 5:
        suggestions.append(SuggestedAction(
            id="suggest-organize",
            toolId="organize-pdf",
            name="Organize Your PDFs",
            description="You're working with many files. Use our organization tools to keep them structured.",
            confidence=0.6,
            reasoning="High file activity detected",
            estimatedSavings="Better file management",
            cta="Go to Organize PDF",
            priority="low",
            category="Organization"
        ))
    
    return suggestions

def calculate_user_insights() -> UserInsights:
    """Calculate comprehensive user insights"""
    if not user_actions:
        return UserInsights(
            totalActions=0,
            mostUsedTool="none",
            averageSessionLength=0.0,
            peakUsageHours=[],
            commonWorkflows=[],
            efficiencyScore=0.0
        )
    
    # Basic stats
    total_actions = len(user_actions)
    tool_counts = Counter(action.toolId for action in user_actions)
    most_used_tool = tool_counts.most_common(1)[0][0] if tool_counts else "none"
    
    # Calculate peak usage hours
    hours = []
    for action in user_actions:
        try:
            timestamp = datetime.datetime.fromisoformat(action.timestamp.replace('Z', '+00:00'))
            hours.append(timestamp.hour)
        except:
            continue
    
    peak_hours = []
    if hours:
        hour_counts = Counter(hours)
        peak_hours = [f"{hour}:00" for hour, _ in hour_counts.most_common(3)]
    
    # Calculate common workflows
    workflows = []
    for i in range(len(user_actions) - 1):
        current_tool = user_actions[i].toolId
        next_tool = user_actions[i + 1].toolId
        workflows.append(f"{current_tool} → {next_tool}")
    
    workflow_counts = Counter(workflows)
    common_workflows = [workflow for workflow, _ in workflow_counts.most_common(3)]
    
    # Calculate efficiency score (based on successful operations)
    successful_actions = sum(1 for action in user_actions if action.metadata.get('success', True))
    efficiency_score = min((successful_actions / total_actions) * 100, 100) if total_actions > 0 else 0
    
    # Calculate average session length (mock calculation)
    session_length = 15.0  # minutes - in real implementation, calculate from timestamps
    
    return UserInsights(
        totalActions=total_actions,
        mostUsedTool=most_used_tool,
        averageSessionLength=session_length,
        peakUsageHours=peak_hours,
        commonWorkflows=common_workflows,
        efficiencyScore=efficiency_score
    )

# --- API Endpoints ---
@app.post("/track-action", status_code=200)
async def track_user_action(action: UserAction):
    """Track a user action for pattern analysis"""
    try:
        # Validate timestamp
        datetime.datetime.fromisoformat(action.timestamp.replace('Z', '+00:00'))
        
        # Store the action
        user_actions.append(action)
        action_patterns[action.toolId].append(action)
        
        # Keep only last 1000 actions to prevent memory issues
        if len(user_actions) > 1000:
            user_actions[:] = user_actions[-1000:]
        
        print(f"✅ Tracked action: {action.toolId} - {action.action} at {action.timestamp}")
        return {"message": "Action tracked successfully", "total_actions": len(user_actions)}
        
    except Exception as e:
        print(f"❌ Error tracking action: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid action data: {str(e)}")

@app.get("/patterns", response_model=List[PredictivePattern])
async def get_predictive_patterns():
    """Get AI-analyzed user patterns"""
    try:
        patterns = analyze_tool_usage_patterns()
        print(f"📊 Generated {len(patterns)} predictive patterns")
        return patterns
    except Exception as e:
        print(f"❌ Error generating patterns: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing patterns: {str(e)}")

@app.get("/suggestions", response_model=List[SuggestedAction])
async def get_suggested_actions():
    """Get AI-generated suggestions based on user behavior"""
    try:
        suggestions = generate_smart_suggestions()
        print(f"💡 Generated {len(suggestions)} smart suggestions")
        return suggestions
    except Exception as e:
        print(f"❌ Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")

@app.get("/insights", response_model=UserInsights)
async def get_user_insights():
    """Get comprehensive user insights and analytics"""
    try:
        insights = calculate_user_insights()
        print(f"📈 Generated user insights for {insights.totalActions} actions")
        return insights
    except Exception as e:
        print(f"❌ Error calculating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating insights: {str(e)}")

@app.get("/status")
async def get_status():
    """Get backend status and statistics"""
    return {
        "status": "Predictive Processing AI Backend is running",
        "version": "0.1.0",
        "tracked_actions_count": len(user_actions),
        "unique_tools_used": len(set(action.toolId for action in user_actions)),
        "last_action_time": user_actions[-1].timestamp if user_actions else None,
        "patterns_generated": len(analyze_tool_usage_patterns()),
        "suggestions_available": len(generate_smart_suggestions())
    }

@app.delete("/clear-data")
async def clear_user_data():
    """Clear all user data (for testing/reset)"""
    global user_actions, action_patterns
    user_actions.clear()
    action_patterns.clear()
    print("🧹 Cleared all user data")
    return {"message": "User data cleared successfully"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
