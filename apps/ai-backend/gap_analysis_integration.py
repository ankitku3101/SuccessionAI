"""
FastAPI endpoint integration for Gap Analysis
Adds gap analysis functionality to the main SuccessionAI API
"""
from fastapi import HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
import json
from gap_analysis_agent import GapAnalysisAgent, GapAnalysisResult


class GapAnalysisRequest(BaseModel):
    """Request model for gap analysis."""
    employee_id: int
    target_role: str
    
    class Config:
        schema_extra = {
            "example": {
                "employee_id": 1,
                "target_role": "Technical Lead"
            }
        }


class GapAnalysisResponse(BaseModel):
    """Response model for gap analysis."""
    employee_name: str
    current_role: str
    target_role: str
    analysis: Dict[str, Any]
    
    class Config:
        schema_extra = {
            "example": {
                "employee_name": "Amit Sharma",
                "current_role": "Software Engineer",
                "target_role": "Technical Lead",
                "analysis": {
                    "matched_skills": ["Python"],
                    "missing_skills": ["System Design", "Team Leadership"],
                    "score_gaps": {
                        "leadership": {"employee": 60, "required": 75}
                    },
                    "overall_skill_match": "33%",
                    "recommendations": ["Develop System Design skills"],
                    "readiness_level": "Not Ready"
                }
            }
        }


def load_sample_data():
    """Load sample employee and role data."""
    try:
        with open("data/sample_employee_data.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        with open("sample_employee_data.json", "r") as f:
            return json.load(f)


def find_employee_by_id(employee_id: int, data: Dict) -> Dict[str, Any]:
    """Find employee by ID."""
    for emp in data["employees"]:
        if emp["id"] == employee_id:
            return emp
    raise HTTPException(status_code=404, detail=f"Employee with ID {employee_id} not found")


def find_role_by_name(role_name: str, data: Dict) -> Dict[str, Any]:
    """Find success role by name."""
    for role in data["success_roles"]:
        if role["role"] == role_name:
            return role
    raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found")


def perform_gap_analysis(employee_id: int, target_role: str) -> GapAnalysisResponse:
    """Perform gap analysis for an employee against a target role."""
    
    # Load data
    data = load_sample_data()
    
    # Find employee and role
    employee = find_employee_by_id(employee_id, data)
    role = find_role_by_name(target_role, data)
    
    # Initialize gap analysis agent
    try:
        agent = GapAnalysisAgent()
        
        # Prepare employee profile for analysis
        employee_profile = {
            "name": employee["name"],
            "role": employee["role"],
            "skills": employee["skills"],
            "assessment_scores": employee["assessment_scores"],
            "performance_rating": employee["performance_rating"],
            "potential_rating": employee["potential_rating"],
            "experience_years": employee["experience_years"]
        }
        
        # Prepare role requirements
        role_requirements = {
            "role": role["role"],
            "required_skills": role["required_skills"],
            "required_experience": role["required_experience"],
            "min_performance_rating": role["min_performance_rating"],
            "min_potential_rating": role["min_potential_rating"],
            "required_scores": {
                "technical": 85,
                "communication": 75,
                "leadership": 70
            }  # Default scores, can be customized per role
        }
        
        # Perform analysis
        result = agent.analyze(employee_profile, role_requirements)
        
        # Handle both dict and Pydantic model output
        if hasattr(result, 'dict'):
            analysis_data = result.dict()
        else:
            analysis_data = result
        
        return GapAnalysisResponse(
            employee_name=employee["name"],
            current_role=employee["role"],
            target_role=role["role"],
            analysis=analysis_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")


# Demo function to test the integration
def demo_gap_analysis_integration():
    """Demo function to test gap analysis integration."""
    
    print("🔍 GAP ANALYSIS INTEGRATION DEMO")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {"employee_id": 1, "target_role": "Technical Lead", "description": "High performer → Leadership role"},
        {"employee_id": 7, "target_role": "Data Science Manager", "description": "Data Scientist → Management"},
        {"employee_id": 11, "target_role": "Senior Developer", "description": "Junior → Senior Developer"},
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n🧪 TEST CASE {i}: {case['description']}")
        print("-" * 40)
        
        try:
            result = perform_gap_analysis(case["employee_id"], case["target_role"])
            
            print(f"Employee: {result.employee_name} ({result.current_role})")
            print(f"Target: {result.target_role}")
            print(f"Match: {result.analysis['overall_skill_match']}")
            print(f"Readiness: {result.analysis['readiness_level']}")
            print(f"Matched Skills: {result.analysis['matched_skills']}")
            print(f"Missing Skills: {result.analysis['missing_skills']}")
            
            if result.analysis['recommendations']:
                print(f"Top Recommendation: {result.analysis['recommendations'][0]}")
            
            print("✅ Analysis completed")
            
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
    
    print(f"\n🎯 Integration testing completed!")


# Additional utility functions
def get_all_available_roles() -> List[str]:
    """Get list of all available success roles."""
    data = load_sample_data()
    return [role["role"] for role in data["success_roles"]]


def get_employees_for_role(target_role: str, min_match_percentage: int = 40) -> List[Dict]:
    """Get all employees suitable for a specific role."""
    data = load_sample_data()
    suitable_employees = []
    
    for employee in data["employees"]:
        try:
            result = perform_gap_analysis(employee["id"], target_role)
            match_pct = float(result.analysis['overall_skill_match'].rstrip('%'))
            
            if match_pct >= min_match_percentage:
                suitable_employees.append({
                    "employee_id": employee["id"],
                    "name": employee["name"],
                    "current_role": employee["role"],
                    "match_percentage": f"{match_pct}%",
                    "readiness_level": result.analysis['readiness_level']
                })
        except Exception:
            continue
    
    # Sort by match percentage
    suitable_employees.sort(key=lambda x: float(x['match_percentage'].rstrip('%')), reverse=True)
    return suitable_employees


if __name__ == "__main__":
    demo_gap_analysis_integration()
    
    # Test additional functionality
    print(f"\n📋 AVAILABLE ROLES:")
    roles = get_all_available_roles()
    for role in roles:
        print(f"  • {role}")
    
    print(f"\n👥 EMPLOYEES SUITABLE FOR 'Technical Lead' (≥40% match):")
    candidates = get_employees_for_role("Technical Lead", 40)
    for candidate in candidates:
        print(f"  • {candidate['name']:15} | {candidate['match_percentage']:>6} | {candidate['readiness_level']}")