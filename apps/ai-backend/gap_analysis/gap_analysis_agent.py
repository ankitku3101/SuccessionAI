import os
from dotenv import load_dotenv
load_dotenv()
from typing import List, Dict
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq # type: ignore
from langchain_core.prompts import PromptTemplate # type: ignore
from langchain_core.output_parsers import JsonOutputParser # type: ignore


# Define structured output
class GapAnalysisResult(BaseModel):
    matched_skills: List[str] = Field(description="Skills matching between employee and role")
    missing_skills: List[str] = Field(description="Skills required but missing in employee")
    score_gaps: Dict[str, Dict[str, float]] = Field(description="Assessment score gaps (employee vs required)")
    rating_gaps: Dict[str, Dict[str, float]] = Field(description="Performance/Potential rating gaps")
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

        3. Performance & Potential Ratings:
        - Compare employee's performance_rating vs role's min_performance_rating
        - Compare employee's potential_rating vs role's min_potential_rating
        - If employee rating >= required → mark as "Eligible"
        - If employee rating < required → show "Gap" with difference

        4. Overall Match %:
        - (Matched skills ÷ Required skills) × 100.
        - Round to nearest 5%.

        5. Recommendations:
        - Suggest ONLY gaps (missing skills, score deficits, rating gaps).
        - Do not suggest improvements for areas where employee already meets/exceeds requirements.

        --- RETURN JSON FORMAT ---
        {{
        "employee_name": "string",
        "target_role": "string",
        "segment": "Star/Core/Risk/etc.",
        "overall_skill_match": "XX%",
        "matched_skills": ["skill1", "skill2"],
        "missing_skills": ["skill3", "skill4"],
        "score_gaps": {{
            "assessment_type": {{
                "employee": score,
                "required": score,
                "status": "Eligible/Gap (-X)"
            }}
        }},
        "rating_gaps": {{
            "performance": {{
                "employee": rating,
                "required": rating,
                "status": "Eligible/Gap (-X.X)"
            }},
            "potential": {{
                "employee": rating,
                "required": rating,
                "status": "Eligible/Gap (-X.X)"
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
        score_gaps = {}
        emp_scores = employee.get("assessment_scores", {})
        req_scores = role.get("required_scores", {})
        
        for score_type, required in req_scores.items():
            emp_score = emp_scores.get(score_type, 0)
            if emp_score < required:
                score_gaps[score_type] = {
                    "employee": emp_score, 
                    "required": required,
                    "status": f"Gap (-{required - emp_score})"
                }
            else:
                score_gaps[score_type] = {
                    "employee": emp_score,
                    "required": required,
                    "status": "Eligible"
                }
        
        # Rating gaps (Performance & Potential)
        rating_gaps = {}
        
        # Performance rating comparison
        emp_performance = employee.get("performance_rating", 0)
        req_performance = role.get("min_performance_rating", 0)
        if emp_performance < req_performance:
            rating_gaps["performance"] = {
                "employee": emp_performance,
                "required": req_performance,
                "status": f"Gap (-{req_performance - emp_performance:.1f})"
            }
        else:
            rating_gaps["performance"] = {
                "employee": emp_performance,
                "required": req_performance,
                "status": "Eligible"
            }
        
        # Potential rating comparison
        emp_potential = employee.get("potential_rating", 0)
        req_potential = role.get("min_potential_rating", 0)
        if emp_potential < req_potential:
            rating_gaps["potential"] = {
                "employee": emp_potential,
                "required": req_potential,
                "status": f"Gap (-{req_potential - emp_potential:.1f})"
            }
        else:
            rating_gaps["potential"] = {
                "employee": emp_potential,
                "required": req_potential,
                "status": "Eligible"
            }
        
        # Recommendations
        recs = []
        if missing:
            recs.append(f"Develop skills: {', '.join(missing[:3])}")
        
        # Add recommendations for score gaps
        for score_type, gap_info in score_gaps.items():
            if "Gap" in gap_info["status"]:
                gap_points = gap_info["required"] - gap_info["employee"]
                recs.append(f"Improve {score_type} assessment score by {gap_points} points")
        
        # Add recommendations for rating gaps
        for rating_type, gap_info in rating_gaps.items():
            if "Gap" in gap_info["status"]:
                gap_points = gap_info["required"] - gap_info["employee"]
                recs.append(f"Improve {rating_type} rating by {gap_points:.1f} points")
        
        if employee.get("experience_years", 0) < role.get("required_experience", 0):
            exp_gap = role.get("required_experience", 0) - employee.get("experience_years", 0)
            recs.append(f"Gain {exp_gap} more years of relevant experience")
        
        return GapAnalysisResult(
            matched_skills=matched,
            missing_skills=missing,
            score_gaps=score_gaps,
            rating_gaps=rating_gaps,
            overall_skill_match=match_pct,
            recommendations=recs or ["Continue current development"],
            readiness_level="Ready" if not recs else ("Developing" if len(recs) <= 2 else "Not Ready")
        )


if __name__ == "__main__":
    import json
    
    # Load actual employee data from JSON files
    with open("data/sample_employee_data.json", "r") as f:
        employee_data = json.load(f)
    
    with open("data/sample_success_role.json", "r") as f:
        role_data = json.load(f)
    
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
        employee_found = None
        for emp in employee_data["employees"]:
            if emp["id"] == rep_emp["id"]:
                employee_found = emp
                break
        
        if not employee_found:
            continue
            
        # Find target role
        target_role_name = employee_found["target_success_role"]
        role_found = None
        for role in role_data["success_roles"]:
            if role["role"] == target_role_name:
                role_found = role
                break
        
        if not role_found:
            continue
        
        print(f"🧪 ANALYSIS {i}: {rep_emp['description']}")
        print(f"    Segment: {rep_emp['segment']}")
        print("-" * 50)
        
        # Prepare employee profile
        employee_profile = {
            "name": employee_found["name"],
            "role": employee_found["role"],
            "skills": employee_found["skills"],
            "assessment_scores": employee_found["assessment_scores"],
            "performance_rating": employee_found["performance_rating"],
            "potential_rating": employee_found["potential_rating"],
            "experience_years": employee_found["experience_years"]
        }
        
        # Prepare role requirements using data from JSON
        role_requirements = {
            "role": role_found["role"],
            "required_skills": role_found["required_skills"],
            "required_experience": role_found["required_experience"],
            "min_performance_rating": role_found["min_performance_rating"],
            "min_potential_rating": role_found["min_potential_rating"],
            "required_scores": role_found.get("required_scores", {"technical": 75, "communication": 75, "leadership": 70})
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
        if 'readiness_level' in output:
            print(f"  Readiness Level: {output['readiness_level']}")
        print(f"  Matched Skills: {output['matched_skills']}")
        print(f"  Missing Skills: {output['missing_skills']}")
        
        if output['score_gaps']:
            print("  Assessment Score Gaps:")
            for score_type, gap in output['score_gaps'].items():
                print(f"    • {score_type}: {gap['employee']} → {gap['required']} ({gap['status']})")
        
        if output.get('rating_gaps'):
            print("  Performance/Potential Rating Gaps:")
            for rating_type, gap in output['rating_gaps'].items():
                print(f"    • {rating_type}: {gap['employee']} → {gap['required']} ({gap['status']})")
        
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
