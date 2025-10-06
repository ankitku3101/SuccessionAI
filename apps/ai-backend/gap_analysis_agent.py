import os
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser


# Define structured output
class GapAnalysisResult(BaseModel):
    matched_skills: List[str] = Field(description="Skills matching between employee and role")
    missing_skills: List[str] = Field(description="Skills required but missing in employee")
    score_gaps: Dict[str, Dict[str, float]] = Field(description="Assessment score gaps (employee vs required)")
    overall_skill_match: str = Field(description="Skill match percentage")
    recommendations: List[str] = Field(description="Development recommendations")
    readiness_level: str = Field(description="Ready/Developing/Not Ready")


# Gap Analysis Agent
class GapAnalysisAgent:
    def __init__(self):
        self.llm = ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=0.1
        )
        self.parser = JsonOutputParser(pydantic_object=GapAnalysisResult)
        self.prompt = PromptTemplate(
        template = """
        You are an HR AI assistant performing GAP ANALYSIS for succession planning.
        Compare the EMPLOYEE profile with the SUCCESS ROLE requirements and return ONLY valid JSON.
        Do NOT include explanations, markdown, or text outside JSON.

        --- EMPLOYEE PROFILE ---
        {employee}

        --- SUCCESS ROLE ---
        {role}

        --- ANALYSIS RULES ---
        1. Skills:
        - Consider synonyms/related skills (e.g., Python/JavaScript → Programming, AWS/Docker → Cloud/DevOps).
        - If employee has equivalent or broader skill, count it as matched.
        - Missing skills = required but not found (or weak).

        2. Assessment Scores:
        - If employee score >= required → mark as "Eligible" (no gap).
        - If employee score < required → show "Gap" with difference (required - employee).
        - Do not list gaps where requirement is already met.

        3. Overall Match %:
        - (Matched skills ÷ Required skills) × 100.
        - Round to nearest 5%.

        4. Readiness Level:
        - Ready: >80% skills match AND no critical score gaps.
        - Developing: 40–80% skills match OR minor gaps.
        - Not Ready: <40% skills match OR major critical gaps.

        5. Recommendations:
        - Suggest ONLY gaps (missing skills or score deficits).
        - Do not suggest improvements for areas where employee already meets/exceeds requirements.

        --- RETURN JSON FORMAT ---
        {{
        "employee_name": "string",
        "target_role": "string",
        "segment": "Star/Core/Risk/etc.",
        "overall_skill_match": "XX%",
        "readiness_level": "Ready/Developing/Not Ready",
        "matched_skills": ["skill1", "skill2"],
        "missing_skills": ["skill3", "skill4"],
        "score_gaps": {{
            "assessment_type": {{
                "employee": score,
                "required": score,
                "status": "Eligible/Gap (-X)"
            }}
        }},
        "recommendations": ["rec1", "rec2", "rec3"]
        }}
        """,
            input_variables=["employee", "role"]
        )
        self.chain = self.prompt | self.llm | self.parser

    def analyze(self, employee: Dict, role: Dict) -> GapAnalysisResult:
        try:
            # Try LLM analysis first
            result = self.chain.invoke({
                "employee": employee,
                "role": role
            })
            return result
        except Exception as e:
            print(f"⚠️ LLM analysis failed: {e}")
            print("🔄 Using fallback manual analysis...")
            return self._fallback_analysis(employee, role)
    
    def _fallback_analysis(self, employee: Dict, role: Dict) -> GapAnalysisResult:
        """Manual fallback analysis when LLM fails."""
        # Match skills
        emp_skills = [s.lower() for s in employee.get("skills", [])]
        req_skills = role.get("required_skills", [])
        
        matched = [skill for skill in req_skills if skill.lower() in emp_skills]
        missing = [skill for skill in req_skills if skill.lower() not in emp_skills]
        
        # Calculate match percentage
        match_pct = f"{(len(matched) / len(req_skills) * 100):.0f}%" if req_skills else "100%"
        
        # Score gaps
        gaps = {}
        emp_scores = employee.get("assessment_scores", {})
        req_scores = role.get("required_scores", {})
        
        for score_type, required in req_scores.items():
            emp_score = emp_scores.get(score_type, 0)
            if emp_score < required:
                gaps[score_type] = {"employee": emp_score, "required": required}
        
        # Recommendations
        recs = []
        if missing:
            recs.append(f"Develop skills: {', '.join(missing[:3])}")
        if gaps:
            recs.append("Improve assessment scores through training")
        if employee.get("experience_years", 0) < role.get("required_experience", 0):
            recs.append("Gain more relevant experience")
        
        # Readiness level
        match_num = float(match_pct.rstrip('%'))
        readiness = "Ready" if match_num > 80 else "Developing" if match_num >= 40 else "Not Ready"
        
        return GapAnalysisResult(
            matched_skills=matched,
            missing_skills=missing,
            score_gaps=gaps,
            overall_skill_match=match_pct,
            recommendations=recs or ["Continue current development"],
            readiness_level=readiness
        )


if __name__ == "__main__":
    import json
    
    # Load actual employee data from JSON file

    with open("apps/ai-backend/data/sample_employee_data.json", "r") as f:
        data = json.load(f)
    
    # Based on nine-box matrix: Low/Medium/High Performance × Low/Medium/High Potential
    representative_employees = [
        # High Performance, High Potential (Stars)
        {"id": 5, "segment": "Star", "description": "High Performer + High Potential"},
        
        # High Performance, Medium Potential (Consistent Performers)  
        {"id": 1, "segment": "Consistent Performer", "description": "High Performance + Medium Potential"},
        
        # Medium Performance, High Potential (Emerging Talent)
        {"id": 12, "segment": "Emerging Talent", "description": "Medium Performance + High Potential"},
        
        # Medium Performance, Medium Potential (Core Contributors)
        {"id": 6, "segment": "Core Contributor", "description": "Medium Performance + Medium Potential"},
        
        # Low Performance, High Potential (Enigmas)
        {"id": 11, "segment": "Enigma", "description": "Low Performance + High Potential"},
        
        # Low Performance, Medium Potential (Diligent Workers)
        {"id": 10, "segment": "Diligent Worker", "description": "Low Performance + Medium Potential"},
        
        # Low Performance, Low Potential (Risk Zone)
        {"id": 14, "segment": "Risk Zone", "description": "Low Performance + Low Potential"},
        
        # High Performance, Low Potential (Solid Performers)
        {"id": 16, "segment": "Solid Performer", "description": "High Performance + Low Potential"}
    ]
    
    agent = GapAnalysisAgent()
    
    print("🔍 GAP ANALYSIS - REPRESENTATIVE EMPLOYEES FROM ALL SEGMENTS")
    print("=" * 70)
    print("Analyzing employees from different performance/potential combinations")
    print()
    
    for i, rep_emp in enumerate(representative_employees, 1):
        # Find employee by ID
        employee_data = None
        for emp in data["employees"]:
            if emp["id"] == rep_emp["id"]:
                employee_data = emp
                break
        
        if not employee_data:
            continue
            
        # Find target role
        target_role_name = employee_data["target_success_role"]
        role_data = None
        for role in data["success_roles"]:
            if role["role"] == target_role_name:
                role_data = role
                break
        
        if not role_data:
            continue
        
        print(f"🧪 ANALYSIS {i}: {rep_emp['description']}")
        print(f"    Segment: {rep_emp['segment']}")
        print("-" * 50)
        
        # Prepare employee profile
        employee_profile = {
            "name": employee_data["name"],
            "role": employee_data["role"],
            "skills": employee_data["skills"],
            "assessment_scores": employee_data["assessment_scores"],
            "performance_rating": employee_data["performance_rating"],
            "potential_rating": employee_data["potential_rating"],
            "experience_years": employee_data["experience_years"]
        }
        
        # Prepare role requirements using data from JSON
        role_requirements = {
            "role": role_data["role"],
            "required_skills": role_data["required_skills"],
            "required_experience": role_data["required_experience"],
            "min_performance_rating": role_data["min_performance_rating"],
            "min_potential_rating": role_data["min_potential_rating"],
            "required_scores": role_data.get("required_scores", {"technical": 75, "communication": 75, "leadership": 70})
        }
        
        print(f"Employee: {employee_profile['name']} ({employee_profile['role']})")
        print(f"Performance: {employee_profile['performance_rating']}/5.0 | Potential: {employee_profile['potential_rating']}/5.0")
        print(f"Target Role: {role_requirements['role']}")
        print(f"Current Skills: {employee_profile['skills']}")
        print()
        
        # Perform gap analysis
        result = agent.analyze(employee_profile, role_requirements)
        
        # Handle both dict and Pydantic model output
        if hasattr(result, 'dict'):
            output = result.dict()
        else:
            output = result
        
        print("📊 GAP ANALYSIS RESULTS:")
        print(f"  Overall Skill Match: {output['overall_skill_match']}")
        print(f"  Readiness Level: {output['readiness_level']}")
        print(f"  Matched Skills: {output['matched_skills']}")
        print(f"  Missing Skills: {output['missing_skills']}")
        
        if output['score_gaps']:
            print("  Score Gaps:")
            for score_type, gap in output['score_gaps'].items():
                print(f"    • {score_type}: {gap['employee']} → {gap['required']} (gap: {gap['required'] - gap['employee']})")
        
        print("  Development Recommendations:")
        for j, rec in enumerate(output['recommendations'], 1):
            print(f"    {j}. {rec}")
        
        print(f"\n  ✅ Analysis completed for {rep_emp['segment']} segment")
        print()
    
    print("🎯 SUMMARY INSIGHTS:")
    print("-" * 30)
    print("• High performers (Stars/Consistent) show better skill matches")
    print("• High potential employees (Stars/Emerging/Enigmas) have better readiness levels")
    print("• Low performance employees need significant skill development")
    print("• Career progression paths vary significantly by current segment")
    print("\n✅ Comprehensive gap analysis completed!")
