"""
Simplified IDP Generation Pipeline (LLM + ML Hybrid)
Powered by Llama-3.3-70B (Groq Cloud)
"""

import os, json, sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq # type: ignore
from langchain_core.prompts import PromptTemplate # type: ignore
from langchain_core.output_parsers import JsonOutputParser # type: ignore
from db_services.mongo_data_service import get_comprehensive_data_for_idp, store_idp_result, fetch_idp_result

load_dotenv()
groq_api_key=os.getenv("GROQ_API_KEY")

class SkillRec(BaseModel):
    skill: str
    priority: str
    reason: str
    timeline: str

class LearningResource(BaseModel):
    title: str
    url: str
    provider: str
    type: str
    description: str

class Mentor(BaseModel):
    name: str
    role: str
    department: str
    similarity: float
    matching_skills: List[str]

class FinalIDP(BaseModel):
    employee_name: str
    current_role: str
    target_role: str
    readiness: str
    skill_recommendations: List[SkillRec]
    learning_resources: List[LearningResource]
    mentors: List[Mentor]
    milestones: List[Dict[str, Any]]
    generated_date: str

# --------- Simplified Orchestrator ---------
class IDPGenerator:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=groq_api_key,
            temperature=0.3
        )

    def generate_idp(self, emp_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main function to generate IDP"""
        print(f"Generating IDP for {emp_data['name']}...")

        # Step 1: Get recommendations
        recs = self._generate_skill_recs(emp_data)

        # Step 2: Get learning resources
        resources = self._get_learning_resources([r.skill for r in recs])

        # Step 3: Get mentors
        mentors = self._find_mentors(emp_data)

        # Step 4: Build milestones
        milestones = self._create_milestones(recs)

        # Step 5: Assemble final IDP
        idp = FinalIDP(
            employee_name=emp_data["name"],
            current_role=emp_data["role"],
            target_role=emp_data.get("target_role", "N/A"),
            readiness=emp_data.get("readiness", "Unknown"),
            skill_recommendations=recs,
            learning_resources=resources,
            mentors=mentors,
            milestones=milestones,
            generated_date=datetime.now().isoformat()
        )
        return idp.dict()

    # ----- Sub-functions -----
    def _generate_skill_recs(self, emp_data):
        prompt = PromptTemplate(
            input_variables=["employee"],
            template="""
            You are an HR consultant creating an Individual Development Plan (IDP).
            Based on this employee's profile, generate 4-6 skill recommendations.

            Employee Info:
            {employee}

            Return JSON:
            {{
            "skills": [
                {{"skill": "Skill name", "priority": "high/medium/low", "timeline": "3-6 months", "reason": "why"}}
            ]
            }}
            """
        )

        chain = prompt | self.llm | JsonOutputParser()
        result = chain.invoke({"employee": emp_data})
        return [SkillRec(**r) for r in result.get("skills", [])]

    def _get_learning_resources(self, skills: List[str]):
        prompt = PromptTemplate(
            input_variables=["skills"],
            template="""
            Suggest 5-8 relevant online learning resources for skills: {skills}.
            Provide in JSON:
            {{
            "resources": [
            {{"title": "Resource", "url": "https://", "provider": "Coursera", "type": "course", "description": "brief"}}
            ]
            }}
            """
        )
        chain = prompt | self.llm | JsonOutputParser()
        result = chain.invoke({"skills": ", ".join(skills)})
        return [LearningResource(**r) for r in result.get("resources", [])]

    def _find_mentors(self, emp_data):
        # Simple placeholder logic (replace with similarity matching or DB call)
        return [
            Mentor(name="A. Sharma", role="Sr. Engineer", department=emp_data["department"], similarity=0.82, matching_skills=["Python", "Leadership"]),
            Mentor(name="R. Das", role="Tech Lead", department=emp_data["department"], similarity=0.79, matching_skills=["AI/ML"]),
            Mentor(name="K. Iyer", role="Manager", department="Cross-Dept", similarity=0.74, matching_skills=["Communication"])
        ]

    def _create_milestones(self, recs):
        return [
            {"month": 3, "focus": [r.skill for r in recs if r.priority == "high"], "goal": "Complete initial courses"},
            {"month": 6, "focus": [r.skill for r in recs], "goal": "Apply learned skills"},
            {"month": 12, "focus": [r.skill for r in recs], "goal": "Evaluate readiness for next role"}
        ]

# --------- Example Usage ---------
if __name__ == "__main__":

    sample_employee = {
        "name": "Riya Patel",
        "role": "Data Analyst",
        "department": "Data Science",
        "experience": 3,
        "skills": ["Python", "SQL", "Tableau"],
        "target_role": "Data Scientist",
        "readiness": "Partially Ready"
    }

    generator = IDPGenerator()
    result = generator.generate_idp(sample_employee)
    print(json.dumps(result, indent=2))


def generate_employee_idp(employee_id: str) -> Dict[str, Any]:
    """Orchestrator: fetch data, generate IDP, store result.

    Returns a dict with keys: success (bool), idp (dict) if success, error if failed
    """
    try:
        # First check if IDP already exists in database
        existing_idp = fetch_idp_result(employee_id)
        if existing_idp and existing_idp.get("idp"):
            print(f"Found existing IDP for employee {employee_id}, returning from database")
            return {
                "success": True, 
                "idp": existing_idp["idp"], 
                "source": "database",
                "generated_at": existing_idp.get("generated_at", "unknown")
            }

        # If no existing IDP, generate new one
        print(f"No existing IDP found for employee {employee_id}, generating new one")
        
        # Get comprehensive data from MongoDB (may trigger gap-analysis endpoint if missing)
        data = get_comprehensive_data_for_idp(employee_id)
        if not data or data.get("error"):
            return {"success": False, "error": data.get("error", "Failed to fetch data")}

        employee = data.get("employee")
        gap = data.get("gap_analysis") or {}
        target_role = data.get("target_role") or {}

        # Prepare input for generator
        # Ensure target_role is always a string (avoid None which fails Pydantic validation)
        if isinstance(target_role, dict):
            target_role_str = target_role.get("role") or employee.get("target_success_role") or "N/A"
        else:
            target_role_str = employee.get("target_success_role") or "N/A"

        emp_input = {
            "name": employee.get("name"),
            "role": employee.get("role"),
            "department": employee.get("department"),
            "skills": employee.get("skills", []),
            "target_role": target_role_str,
            "readiness": data.get("readiness", "Unknown"),
            "gap_analysis": gap
        }

        generator = IDPGenerator()
        idp = generator.generate_idp(emp_input)

        # Store IDP
        idp_doc = {
            "employee_id": employee_id,
            "employee_name": employee.get("name"),
            "generated_at": datetime.now().isoformat(),
            "idp": idp
        }

        stored = store_idp_result(idp_doc)
        if not stored:
            return {"success": True, "idp": idp, "warning": "IDP generated but failed to store in DB"}

        return {"success": True, "idp": idp}

    except Exception as e:
        return {"success": False, "error": str(e)}
