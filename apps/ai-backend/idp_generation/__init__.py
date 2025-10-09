"""
IDP Generation Package

This package handles Individual Development Plan (IDP) generation for SuccessionAI.
It implements a comprehensive multi-agent workflow with LLM integration, web search,
and mentor matching following the provided flow diagram.

Components:
- ExecutionOrchestrator: Main workflow coordinator
- RecommendationAgent: LLM-powered skill and development recommendations
- WebSearchAgent: Real-time learning resource discovery via Tavily API
- MentorMatchingAgent: Intelligent mentor matching with similarity scoring
- FinalIDPAgent: Comprehensive IDP assembly and structuring

Features:
- Llama-3.3-70B integration for intelligent analysis
- Real-time web search for current learning resources
- Advanced mentor matching algorithms
- Comprehensive MongoDB integration
- Robust error handling and fallbacks
"""

from .idp_generator import IDPGenerator, generate_employee_idp

# Import agents if available
try:
    from .web_search_agent import WebSearchAgent
except ImportError:
    WebSearchAgent = None

try:
    from .mentor_matching_agent import MentorMatchingAgent
except ImportError:
    MentorMatchingAgent = None

__all__ = [
    "IDPGenerator",
    "generate_employee_idp",
    "WebSearchAgent",
    "MentorMatchingAgent"
]

__version__ = "2.0.0"
__author__ = "SuccessionAI Team"