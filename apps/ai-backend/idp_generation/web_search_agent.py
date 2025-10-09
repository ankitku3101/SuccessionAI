"""
Web Search Agent using Tavily API for Real-time Learning Resource Discovery
This agent performs real web searches to find curated learning resources, courses, and materials.
"""

import os
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict, Any, Optional
from tavily import TavilyClient # type: ignore
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq # type: ignore
from langchain_core.prompts import PromptTemplate # type: ignore
from langchain_core.output_parsers import JsonOutputParser # type: ignore

class LearningResource(BaseModel):
    """Structured learning resource from web search."""
    title: str = Field(description="Title of the resource")
    type: str = Field(description="Type: course, article, book, certification, tutorial")
    url: str = Field(description="URL or link to the resource")
    description: str = Field(description="Brief description of the resource")
    estimated_duration: str = Field(description="Estimated time to complete")
    provider: str = Field(description="Platform or provider name")
    relevance_score: float = Field(description="Relevance score 0-1")

class WebSearchAgent:
    def __init__(self):
        self.tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.2
        )
        print("Web Search Agent initialized with Tavily integration")
    
    def search_learning_resources(self, skills: List[str], target_role: str, max_results: int = 10) -> List[LearningResource]:
        try:
            print(f"Searching learning resources for skills: {', '.join(skills)}")
            
            all_resources = []
            
            # Search for each skill separately for better results
            for skill in skills[:3]:  # Limit to top 3 skills to avoid rate limits
                skill_resources = self._search_skill_resources(skill, target_role)
                all_resources.extend(skill_resources)
            
            # Search for general role-specific resources
            if target_role and target_role != "To be determined":
                role_resources = self._search_role_resources(target_role)
                all_resources.extend(role_resources)
            
            # Remove duplicates and rank by relevance
            unique_resources = self._deduplicate_and_rank(all_resources)
            
            # Limit results
            return unique_resources[:max_results]
            
        except Exception as e:
            print(f"Web search error: {e}")
    
    def _search_skill_resources(self, skill: str, target_role: str) -> List[LearningResource]:
        """Search for resources specific to a skill."""
        try:
            # Construct search queries
            queries = [
                f"{skill} online course certification training",
                f"learn {skill} {target_role} career development",
                f"best {skill} resources tutorials courses"
            ]
            
            resources = []
            
            for query in queries:
                try:
                    # Perform Tavily search
                    search_results = self.tavily_client.search(
                        query=query,
                        search_depth="basic",
                        max_results=5,
                        include_domains=["coursera.com", "udemy.com", "edx.org", "linkedin.com", "pluralsight.com", "skillshare.com", "codecademy.com", "datacamp.com", "udacity.com"]
                    )
                    
                    # Process search results
                    for result in search_results.get("results", []):
                        resource = self._process_search_result(result, skill)
                        if resource:
                            resources.append(resource)
                            
                except Exception as e:
                    print(f"Search query failed: {query}, Error: {e}")
                    continue
            
            return resources
            
        except Exception as e:
            print(f"Skill search error for {skill}: {e}")
            return []
    
    def _search_role_resources(self, target_role: str) -> List[LearningResource]:
        """Search for general resources for the target role."""
        try:
            queries = [
                f"{target_role} career development path training",
                f"how to become {target_role} courses certification",
                f"{target_role} skills development resources"
            ]
            
            resources = []
            
            for query in queries:
                try:
                    search_results = self.tavily_client.search(
                        query=query,
                        search_depth="basic",
                        max_results=3,
                        include_domains=["coursera.com", "udemy.com", "edx.org", "linkedin.com", "harvard.edu", "mit.edu", "stanford.edu"]
                    )
                    
                    for result in search_results.get("results", []):
                        resource = self._process_search_result(result, target_role)
                        if resource:
                            resources.append(resource)
                            
                except Exception as e:
                    print(f"Role search query failed: {query}, Error: {e}")
                    continue
            
            return resources
            
        except Exception as e:
            print(f"Role search error for {target_role}: {e}")
            return []
    
    def _process_search_result(self, result: Dict[str, Any], search_term: str) -> Optional[LearningResource]:
        """Process individual search result into structured learning resource."""
        try:
            title = result.get("title", "")
            url = result.get("url", "")
            content = result.get("content", "")
            
            if not title or not url:
                return None
            
            # Use LLM to extract structured information
            resource_info = self._extract_resource_info(title, url, content, search_term)
            
            if resource_info:
                return LearningResource(**resource_info)
            
            return None
            
        except Exception as e:
            print(f"Error processing search result: {e}")
            return None
    
    def _extract_resource_info(self, title: str, url: str, content: str, search_term: str) -> Optional[Dict[str, Any]]:
        """Use LLM to extract structured information from search result."""
        try:
            prompt_template = PromptTemplate(
                input_variables=["title", "url", "content", "search_term"],
                template="""
                Analyze this web search result and extract structured learning resource information.

                Title: {title}
                URL: {url}
                Content: {content}
                Search Term: {search_term}

                Based on the title, URL, and content, provide structured information in JSON format:

                {{
                    "title": "Clean, descriptive title",
                    "type": "course/certification/tutorial/article/book/workshop",
                    "description": "Brief 1-2 sentence description of what this resource teaches",
                    "estimated_duration": "Duration estimate like '4-6 weeks', '2 hours', '3 months'",
                    "provider": "Platform name like 'Coursera', 'Udemy', 'LinkedIn Learning'",
                    "relevance_score": 0.8
                }}

                Guidelines:
                - Only extract if this is actually a learning resource (course, tutorial, article, book, certification)
                - Estimate duration based on content type and description
                - Provider should be the platform/organization offering the resource
                - Relevance score should be 0.1-1.0 based on how well it matches the search term
                - Return null if this is not a relevant learning resource

                If this is not a relevant learning resource, return: {{"relevant": false}}
                """
            )
            
            chain = prompt_template | self.llm | JsonOutputParser()
            
            result = chain.invoke({
                "title": title,
                "url": url,
                "content": content[:500],  # Limit content length
                "search_term": search_term
            })
            
            if result.get("relevant") == False:
                return None
            
            # Add URL to the result
            result["url"] = url
            
            return result
            
        except Exception as e:
            print(f"LLM extraction error: {e}")
            return None
    
    def _deduplicate_and_rank(self, resources: List[LearningResource]) -> List[LearningResource]:
        """Remove duplicates and rank resources by relevance."""
        try:
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            
            for resource in resources:
                if resource.url not in seen_urls:
                    seen_urls.add(resource.url)
                    unique_resources.append(resource)
            
            # Sort by relevance score (descending)
            unique_resources.sort(key=lambda x: x.relevance_score, reverse=True)
            
            return unique_resources
            
        except Exception as e:
            print(f"Deduplication error: {e}")
            return resources

def test_web_search_agent():
    """Test function for the web search agent."""
    import os
    
    # Ensure API keys are set
    if not os.getenv("TAVILY_API_KEY"):
        print("TAVILY_API_KEY not set, using fallback resources")
    
    if not os.getenv("GROQ_API_KEY"):
        print("GROQ_API_KEY not set")
        return
    
    agent = WebSearchAgent()
    
    # Test search
    skills = ["Python", "Leadership", "Project Management"]
    target_role = "Technical Lead"
    
    resources = agent.search_learning_resources(skills, target_role, max_results=8)
    
    print(f"\nFound {len(resources)} learning resources:")
    for i, resource in enumerate(resources, 1):
        print(f"\n{i}. {resource.title}")
        print(f"   Type: {resource.type} | Provider: {resource.provider}")
        print(f"   Duration: {resource.estimated_duration} | Score: {resource.relevance_score}")
        print(f"   URL: {resource.url}")
        print(f"   Description: {resource.description}")

if __name__ == "__main__":
    test_web_search_agent()