"""
Simplified Mentor Matching Agent

Behavior:
- Fetch senior / experienced employees from the DB
- For each mentor, compute:
  - department match (same department)
  - skills the mentor has that the employee does not (these are the "missing" skills)
- Score mentors simply by department match (weight) + normalized count of missing skills
- Return top N (default 3) mentors

This intentionally avoids heavy scoring and role/experience heuristics.
"""

import sys
sys.path.append('..')

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from db_services.mongo_data_service import MongoDataFetcher


class MentorProfile(BaseModel):
    employee_id: str = Field(description="Mentor's employee ID")
    name: str = Field(description="Mentor's full name")
    role: str = Field(description="Current role/position")
    department: str = Field(description="Department or division")
    skills: List[str] = Field(description="List of mentor's skills")
    similarity_score: float = Field(description="Simple similarity score 0-1")
    matching_skills: List[str] = Field(description="Skills mentor has that employee is missing")


class MentorMatchingAgent:
    """Very small, pragmatic mentor matcher."""

    def __init__(self):
        # lightweight init
        pass

    def find_mentors(self, employee_data: Dict[str, Any], max_mentors: int = 3) -> List[MentorProfile]:
        """Return top mentors that match department and provide missing skills.

        Args:
            employee_data: dict with at least keys 'id', 'department', 'skills'
            max_mentors: how many mentors to return
        """
        try:
            fetcher = MongoDataFetcher()
            all_employees = fetcher.fetch_all_employees()

            # Prepare sets
            emp_id = employee_data.get("id")
            emp_dept = (employee_data.get("department") or "").strip().lower()
            emp_skills = set(s.lower() for s in employee_data.get("skills", []))

            # Define what we consider a senior mentor: role contains senior/lead/principal/manager/director
            senior_keywords = ("senior", "lead", "principal", "manager", "director")

            candidates = []
            for emp in all_employees:
                if not emp:
                    continue
                # skip self
                if emp.get("id") == emp_id:
                    continue

                role = (emp.get("role") or "").lower()
                # quick senior check
                is_senior = any(k in role for k in senior_keywords)
                if not is_senior:
                    continue

                mentor_skills = [s for s in emp.get("skills", []) if s]
                mentor_skills_l = [s.lower() for s in mentor_skills]

                # skills mentor has that employee doesn't — these are "missing" from the employee perspective
                missing_skills = [s for s in mentor_skills_l if s not in emp_skills]

                dept_match = (emp_dept != "" and (emp.get("department") or "").strip().lower() == emp_dept)

                # simple scoring: department match weight + normalized missing skills count
                skill_score = (len(missing_skills) / max(1, len(mentor_skills_l))) if mentor_skills_l else 0.0
                score = (0.6 if dept_match else 0.0) + 0.4 * skill_score
                score = min(1.0, round(score, 3))

                candidates.append({
                    "emp": emp,
                    "score": score,
                    "missing_skills": missing_skills,
                })

            # sort and return top N
            candidates.sort(key=lambda x: x["score"], reverse=True)

            results = []
            for c in candidates[:max_mentors]:
                mentor = c["emp"]
                results.append(
                    MentorProfile(
                        employee_id=mentor.get("id", ""),
                        name=mentor.get("name", ""),
                        role=mentor.get("role", ""),
                        department=mentor.get("department", ""),
                        skills=mentor.get("skills", []),
                        similarity_score=c["score"],
                        matching_skills=c["missing_skills"],
                    )
                )

            fetcher.close_connection()
            return results

        except Exception as e:
            # keep this simple — log and return empty
            print(f"MentorMatchingAgent error: {e}")
            return []


def test_mentor_matching():
    employee_data = {
        "id": "test_employee_123",
        "name": "John Doe",
        "role": "Software Engineer",
        "department": "Engineering",
        "skills": ["Python", "JavaScript", "SQL"],
    }

    agent = MentorMatchingAgent()
    mentors = agent.find_mentors(employee_data, max_mentors=3)

    print(f"\nFound {len(mentors)} mentor(s):")
    for m in mentors:
        print(f"- {m.name} ({m.role}) dept={m.department} score={m.similarity_score} missing_skills={m.matching_skills}")


if __name__ == "__main__":
    test_mentor_matching()