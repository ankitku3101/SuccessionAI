"""
MongoDB Data Access Module for SuccessionAI:
This module handles all MongoDB operations for fetching employee and role data.
Integrates with existing nine-box matrix, gap analysis, and visualization modules.
"""

from pymongo import MongoClient # type: ignore
from bson import ObjectId # type: ignore
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

load_dotenv()


class MongoConfig(BaseModel):
    """MongoDB configuration."""
    connection_string: str
    database_name: str = "successionai"
    employees_collection: str = "employees"
    roles_collection: str = "success_roles"


class MongoDataFetcher:
    """Handles MongoDB operations for SuccessionAI."""
    
    def __init__(self, config: MongoConfig = None):
        if config:
            self.config = config
        else:
            # Default configuration
            self.config = MongoConfig(
                connection_string="mongodb+srv://testerguy3101:ThreeAndHalf@threeandhalf.prvxg.mongodb.net/"
            )
        
        self.client = MongoClient(self.config.connection_string)
        self.db = self.client[self.config.database_name]
        self.employees_collection = self.db[self.config.employees_collection]
        self.roles_collection = self.db[self.config.roles_collection]
        self.gap_collection = self.db["gap_analysis"]
        self.idp_collection = self.db["idp"]
    
    def fetch_employee_by_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single employee by MongoDB ObjectId."""
        try:
            object_id = ObjectId(employee_id)
            employee = self.employees_collection.find_one({"_id": object_id})
            
            if employee:
                # Convert ObjectId to string for JSON serialization
                employee["_id"] = str(employee["_id"])
                # Map MongoDB fields to our expected format
                return self._transform_employee_data(employee)
            return None
            
        except Exception as e:
            print(f"Error fetching employee {employee_id}: {e}")
            return None
    
    def fetch_employees_by_ids(self, employee_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetch multiple employees by their MongoDB ObjectIds."""
        employees = []
        for emp_id in employee_ids:
            employee = self.fetch_employee_by_id(emp_id)
            if employee:
                employees.append(employee)
        return employees
    
    def fetch_all_employees(self, limit: int = None) -> List[Dict[str, Any]]:
        """Fetch all employees from MongoDB."""
        try:
            query = self.employees_collection.find()
            if limit:
                query = query.limit(limit)
            
            employees = []
            for emp in query:
                emp["_id"] = str(emp["_id"])
                employees.append(self._transform_employee_data(emp))
            
            return employees
            
        except Exception as e:
            print(f"Error fetching all employees: {e}")
            return []
    
    def fetch_role_by_name(self, role_name: str) -> Optional[Dict[str, Any]]:
        """Fetch a success role by name."""
        try:
            role = self.roles_collection.find_one({"role": role_name})
            if role:
                role["_id"] = str(role["_id"])
                return role
            return None
            
        except Exception as e:
            print(f"Error fetching role {role_name}: {e}")
            return None
    
    def fetch_all_roles(self) -> List[Dict[str, Any]]:
        """Fetch all success roles."""
        try:
            roles = []
            for role in self.roles_collection.find():
                role["_id"] = str(role["_id"])
                roles.append(role)
            return roles
            
        except Exception as e:
            print(f"Error fetching roles: {e}")
            return []
    
    def _transform_employee_data(self, mongo_employee: Dict[str, Any]) -> Dict[str, Any]:
        """Transform MongoDB employee data to match our expected format."""
        
        # Create a standardized employee object
        transformed = {
            "id": str(mongo_employee.get("_id")),  # Use MongoDB _id as our id
            "name": mongo_employee.get("name", ""),
            "role": mongo_employee.get("role", ""),
            "department": mongo_employee.get("department", ""),
            "education": mongo_employee.get("education", ""),
            "recruitment_channel": mongo_employee.get("recruitment_channel", ""),
            "num_trainings": mongo_employee.get("num_trainings", 0),
            "age": mongo_employee.get("age", 0),
            "length_of_service_years": mongo_employee.get("length_of_service_years", 0),
            "experience_years": mongo_employee.get("experience_years", 0),
            "skills": mongo_employee.get("skills", []),
            "performance_rating": float(mongo_employee.get("performance_rating", 0.0)),
            "assessment_scores": mongo_employee.get("assessment_scores", {
                "technical": 0,
                "communication": 0,
                "leadership": 0
            }),
            "potential_rating": float(mongo_employee.get("potential_rating", 0.0)),
            "target_success_role": mongo_employee.get("target_success_role", ""),
            # Additional MongoDB fields for reference
            "user_role": mongo_employee.get("user_role", "employee"),
            "created_at": mongo_employee.get("createdAt"),
            "updated_at": mongo_employee.get("updatedAt")
        }
        
        return transformed
    
    def get_employee_count(self) -> int:
        """Get total number of employees in database."""
        try:
            return self.employees_collection.count_documents({})
        except Exception as e:
            print(f"Error getting employee count: {e}")
            return 0
    
    def get_database_status(self) -> Dict[str, Any]:
        """Get database connection status and collection info."""
        try:
            # Test connection
            self.client.admin.command('ping')
            
            return {
                "status": "connected",
                "database": self.config.database_name,
                "employees_count": self.get_employee_count(),
                "roles_count": self.roles_collection.count_documents({}),
                "collections": self.db.list_collection_names()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def close_connection(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()

    # IDP Generation Support Functions
    def fetch_gap_analysis(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Fetch gap analysis data for an employee."""
        try:
            gap_data = self.gap_collection.find_one({
                "employee_info.mongo_id": employee_id
            })
            if gap_data:
                gap_data["_id"] = str(gap_data["_id"])
                return gap_data
            return None
        except Exception as e:
            print(f"Error fetching gap analysis for {employee_id}: {e}")
            return None

    def store_gap_analysis(self, gap_data: Dict[str, Any]) -> bool:
        """Store gap analysis result in database."""
        try:
            # Remove existing gap analysis for this employee
            employee_id = gap_data.get("employee_info", {}).get("mongo_id")
            if employee_id:
                self.gap_collection.delete_many({
                    "employee_info.mongo_id": employee_id
                })
            
            # Insert new gap analysis
            result = self.gap_collection.insert_one(gap_data)
            return bool(result.inserted_id)
        except Exception as e:
            print(f"Error storing gap analysis: {e}")
            return False

    def fetch_idp(self, employee_id: str) -> Optional[Dict[str, Any]]:
        """Fetch existing IDP for an employee."""
        try:
            idp_data = self.idp_collection.find_one({
                "employee_id": employee_id
            })
            if idp_data:
                idp_data["_id"] = str(idp_data["_id"])
                return idp_data
            return None
        except Exception as e:
            print(f"Error fetching IDP for {employee_id}: {e}")
            return None

    def store_idp(self, idp_data: Dict[str, Any]) -> bool:
        """Store IDP in database."""
        try:
            # Remove existing IDP for this employee
            employee_id = idp_data.get("employee_id")
            if employee_id:
                self.idp_collection.delete_many({
                    "employee_id": employee_id
                })
            
            # Insert new IDP
            result = self.idp_collection.insert_one(idp_data)
            return bool(result.inserted_id)
        except Exception as e:
            print(f"Error storing IDP: {e}")
            return False

    def get_comprehensive_employee_data(self, employee_id: str) -> Dict[str, Any]:
        """
        Get comprehensive employee data for IDP generation including:
        - Employee profile with segment and readiness
        - Gap analysis data
        - Target role information
        """
        try:
            # 1. Fetch employee data
            employee = self.fetch_employee_by_id(employee_id)
            if not employee:
                return {"error": "Employee not found", "missing": ["employee"]}

            # 2. Fetch gap analysis
            gap_analysis = self.fetch_gap_analysis(employee_id)

            # 3. Fetch target role data
            target_role = None
            target_role_name = employee.get("target_success_role", "").strip()
            if target_role_name:
                target_role = self.fetch_role_by_name(target_role_name)

            # 4. If gap analysis is missing, try to call local gap-analysis endpoint to generate and store it
            missing_data = []
            api_base = os.getenv("API_BASE_URL", "http://localhost:8000")

            if not gap_analysis:
                # First try to run gap analysis in-process to avoid HTTP calls to the same server
                try:
                    from gap_analysis.gap_analysis_agent import GapAnalysisAgent

                    gap_agent = GapAnalysisAgent()

                    # Build role payload (if target_role exists use it, otherwise try to suggest)
                    role_payload = target_role
                    if not role_payload and target_role_name:
                        role_payload = self.fetch_role_by_name(target_role_name)

                    # If still no role payload, make a minimal role object using target_role_name
                    if not role_payload:
                        role_payload = {
                            "role": target_role_name or "TBD",
                            "required_skills": [],
                            "required_experience": 0,
                            "min_performance_rating": 0,
                            "min_potential_rating": 0,
                            "required_scores": {}
                        }

                    result = gap_agent.analyze(employee, role_payload)

                    # Normalize result to dict
                    if hasattr(result, "dict"):
                        gap_analysis_content = result.dict()
                    else:
                        gap_analysis_content = result

                    gap_doc = {
                        "employee_info": {
                            "mongo_id": employee_id,
                            "role": employee.get("role"),
                            "experience_years": employee.get("experience_years")
                        },
                        "target_role_info": {
                            "role": role_payload.get("role"),
                            "required_experience": role_payload.get("required_experience")
                        },
                        "gap_analysis": gap_analysis_content
                    }

                    stored = self.store_gap_analysis(gap_doc)
                    if stored:
                        gap_analysis = gap_doc
                    else:
                        print(f"Warning: gap analysis generated but failed to store for {employee_id}")

                    # If target_role was not a full DB doc, try to fetch DB role by name
                    if not target_role and role_payload and role_payload.get("role"):
                        target_role = self.fetch_role_by_name(role_payload.get("role"))

                except Exception as e:
                    print(f"In-process gap analysis failed: {e}")
                    # Fallback to HTTP endpoint (existing behavior)
                    try:
                        resp = requests.post(f"{api_base}/gap-analysis", json={
                            "employee_id": employee_id,
                            "role_name": target_role_name or None
                        }, timeout=10)

                        if resp.status_code == 200:
                            data = resp.json()
                            gap_doc = {
                                "employee_info": data.get("employee_info", {}),
                                "target_role_info": data.get("target_role_info", {}),
                                "gap_analysis": data.get("gap_analysis", {})
                            }
                            stored = self.store_gap_analysis(gap_doc)
                            if stored:
                                gap_analysis = gap_doc
                            else:
                                print(f"Warning: gap analysis generated but failed to store for {employee_id}")

                            if not target_role and data.get("target_role_info"):
                                tr = data["target_role_info"]
                                role_name = tr.get("role")
                                if role_name:
                                    target_role = self.fetch_role_by_name(role_name)
                        else:
                            print(f"Gap-analysis endpoint returned status {resp.status_code}: {resp.text}")
                    except Exception as e2:
                        print(f"Error calling gap-analysis endpoint: {e2}")

            # 5. Check what data is missing after attempts
            if not gap_analysis:
                missing_data.append("gap_analysis")
            if not target_role and target_role_name:
                missing_data.append("target_role")

            # 6. Extract segment and readiness from employee data (already expected in employee record)
            segment = employee.get("segment", "")
            readiness = employee.get("readiness", "")

            return {
                "employee": employee,
                "gap_analysis": gap_analysis,
                "target_role": target_role,
                "segment": segment,
                "readiness": readiness,
                "missing_data": missing_data,
                "has_all_data": len(missing_data) == 0
            }

        except Exception as e:
            print(f"Error getting comprehensive employee data: {e}")
            return {"error": str(e), "missing": ["all"]}

    def update_employee_segment_readiness(self, employee_id: str, segment: str = None, readiness: str = None) -> bool:
        """Update employee's segment and readiness in the database."""
        try:
            update_data = {}
            if segment:
                update_data["segment"] = segment
            if readiness:
                update_data["readiness"] = readiness
            
            if update_data:
                result = self.employees_collection.update_one(
                    {"_id": ObjectId(employee_id)},
                    {"$set": update_data}
                )
                return result.modified_count > 0
            return False
        except Exception as e:
            print(f"Error updating employee segment/readiness: {e}")
            return False


# Integration functions for existing modules
def get_employee_for_nine_box(employee_id: str) -> Optional[Dict[str, Any]]:
    """Get employee data formatted for nine-box matrix analysis."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.fetch_employee_by_id(employee_id)
    finally:
        fetcher.close_connection()


def get_employees_for_batch_analysis(employee_ids: List[str]) -> List[Dict[str, Any]]:
    """Get multiple employees for batch nine-box analysis."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.fetch_employees_by_ids(employee_ids)
    finally:
        fetcher.close_connection()


def get_employee_and_role_for_gap_analysis(employee_id: str, role_name: str = None) -> tuple:
    """Get employee and target role data for gap analysis."""
    fetcher = MongoDataFetcher()
    try:
        employee = fetcher.fetch_employee_by_id(employee_id)
        if not employee:
            return None, None
        
        # Use provided role name or employee's target role
        target_role = role_name or employee.get("target_success_role")
        
        # If target_success_role is empty, provide a default suggestion based on current role
        if not target_role or target_role.strip() == "":
            # Simple role mapping for demonstration
            role_suggestions = {
                "Research Associate": "Senior Developer",
                "Software Engineer": "Technical Lead", 
                "Data Analyst": "Data Science Manager",
                "Project Manager": "Product Manager",
                "HR Specialist": "HR Manager",
                "Quality Analyst": "Quality Assurance Lead"
            }
            current_role = employee.get("role", "")
            target_role = role_suggestions.get(current_role, "Senior Developer")
            print(f"ℹ️ No target role found for {employee['name']}, suggesting: {target_role}")
        
        role = fetcher.fetch_role_by_name(target_role) if target_role else None
        
        return employee, role
    finally:
        fetcher.close_connection()


def get_all_employees_for_visualization() -> List[Dict[str, Any]]:
    """Get all employees for visualization."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.fetch_all_employees()
    finally:
        fetcher.close_connection()


def get_employee_for_readiness_prediction(employee_id: str) -> Optional[Dict[str, Any]]:
    """Get employee data specifically formatted for readiness classification."""
    fetcher = MongoDataFetcher()
    try:
        employee = fetcher.fetch_employee_by_id(employee_id)
        if not employee:
            return None
        
        # Calculate missing skills count based on target role
        missing_skills_count = 0
        if employee.get("target_success_role"):
            role = fetcher.fetch_role_by_name(employee["target_success_role"])
            if role and role.get("required_skills"):
                employee_skills = set(employee.get("skills", []))
                required_skills = set(role["required_skills"])
                missing_skills_count = len(required_skills - employee_skills)
        
        # Return employee data with calculated missing skills
        employee["missing_skills_count"] = missing_skills_count
        return employee
        
    finally:
        fetcher.close_connection()


def get_employees_for_batch_readiness_prediction(employee_ids: List[str]) -> List[Dict[str, Any]]:
    """Get multiple employees for batch readiness prediction."""
    fetcher = MongoDataFetcher()
    try:
        employees = []
        for emp_id in employee_ids:
            employee = fetcher.fetch_employee_by_id(emp_id)
            if employee:
                # Calculate missing skills count
                missing_skills_count = 0
                if employee.get("target_success_role"):
                    role = fetcher.fetch_role_by_name(employee["target_success_role"])
                    if role and role.get("required_skills"):
                        employee_skills = set(employee.get("skills", []))
                        required_skills = set(role["required_skills"])
                        missing_skills_count = len(required_skills - employee_skills)
                
                employee["missing_skills_count"] = missing_skills_count
                employees.append(employee)
        
        return employees
        
    finally:
        fetcher.close_connection()


def get_comprehensive_data_for_idp(employee_id: str) -> Dict[str, Any]:
    """
    Get comprehensive data for IDP generation from MongoDB.
    This function implements the retrieval logic from the flow diagram.
    """
    fetcher = MongoDataFetcher()
    try:
        return fetcher.get_comprehensive_employee_data(employee_id)
    finally:
        fetcher.close_connection()


def store_gap_analysis_result(gap_data: Dict[str, Any]) -> bool:
    """Store gap analysis result in MongoDB."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.store_gap_analysis(gap_data)
    finally:
        fetcher.close_connection()


def store_idp_result(idp_data: Dict[str, Any]) -> bool:
    """Store IDP result in MongoDB."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.store_idp(idp_data)
    finally:
        fetcher.close_connection()


def fetch_idp_result(employee_id: str) -> Optional[Dict[str, Any]]:
    """Fetch existing IDP from MongoDB."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.fetch_idp(employee_id)
    finally:
        fetcher.close_connection()


def update_employee_analytics(employee_id: str, segment: str = None, readiness: str = None) -> bool:
    """Update employee's computed analytics (segment, readiness) in MongoDB."""
    fetcher = MongoDataFetcher()
    try:
        return fetcher.update_employee_segment_readiness(employee_id, segment, readiness)
    finally:
        fetcher.close_connection()


def main():
    """Test MongoDB connection and data fetching."""
    print("🔍 TESTING MONGODB DATA FETCHER")
    print("=" * 50)
    
    fetcher = MongoDataFetcher()
    
    # Test connection
    status = fetcher.get_database_status()
    print(f"Database Status: {status}")
    print()
    
    if status["status"] == "connected":
        # Test fetching all employees
        print("📋 Fetching all employees...")
        employees = fetcher.fetch_all_employees(limit=3)
        print(f"Found {len(employees)} employees")
        
        if employees:
            # Show first employee details
            first_emp = employees[0]
            print(f"\n👤 Sample Employee:")
            print(f"  ID: {first_emp['id']}")
            print(f"  Name: {first_emp['name']}")
            print(f"  Role: {first_emp['role']}")
            print(f"  Performance: {first_emp['performance_rating']}")
            print(f"  Potential: {first_emp['potential_rating']}")
            print(f"  Skills: {first_emp['skills']}")
            
            # Test fetching by ID
            print(f"\n🔎 Testing fetch by ID...")
            employee_by_id = fetcher.fetch_employee_by_id(first_emp['id'])
            if employee_by_id:
                print(f"Successfully fetched: {employee_by_id['name']}")
            else:
                print("Failed to fetch by ID")
        
        # Test roles
        print(f"\n📋 Fetching success roles...")
        roles = fetcher.fetch_all_roles()
        print(f"Found {len(roles)} success roles")
        
        if roles:
            print(f"  Sample role: {roles[0].get('role', 'N/A')}")
    
    fetcher.close_connection()
    print("\n✅ MongoDB testing completed!")


if __name__ == "__main__":
    main()