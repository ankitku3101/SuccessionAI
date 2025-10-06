"""
MongoDB Data Access Module for SuccessionAI

This module handles all MongoDB operations for fetching employee and role data.
Integrates with existing nine-box matrix, gap analysis, and visualization modules.
"""

from pymongo import MongoClient
from bson import ObjectId
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv

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
            "performance_rating": mongo_employee.get("performance_rating", 0.0),
            "assessment_scores": mongo_employee.get("assessment_scores", {
                "technical": 0,
                "communication": 0,
                "leadership": 0
            }),
            "potential_rating": mongo_employee.get("potential_rating", 0.0),
            "target_success_role": mongo_employee.get("target_success_role", "")
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