"""
Employee Readiness Dataset Generator

This module generates synthetic training data for employee readiness classification.
Features: potential_rating, performance_rating, assessment_scores, matched_skills_count, missing_skills_count
Target: readiness_status (Ready/Not Ready/Developing)
"""

import json
import random
import numpy as np
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class EmployeeReadinessRecord:
    """Single employee readiness training record."""
    employee_id: str
    employee_name: str
    potential_rating: float
    performance_rating: float
    technical_score: int
    communication_score: int
    leadership_score: int
    matched_skills_count: int
    missing_skills_count: int
    total_skills_required: int
    experience_years: int
    target_role: str
    readiness_status: str  # Ready/Not Ready/Developing

class EmployeeReadinessDataGenerator:
    """Generates synthetic training data for employee readiness classification."""
    
    def __init__(self):
        self.roles = [
            "Technical Lead", "Data Science Manager", "Product Manager", 
            "Senior Developer", "DevOps Manager", "HR Manager", 
            "Marketing Manager", "Quality Assurance Lead", 
            "Business Analyst Lead", "Operations Supervisor"
        ]
        
        self.first_names = [
            "Amit", "Priya", "Rohit", "Neha", "Karan", "Simran", "Arjun", 
            "Meera", "Siddharth", "Ananya", "Ravi", "Sneha", "Vikram", 
            "Pooja", "Deepak", "Manisha", "Rajesh", "Kavita", "Ajay",
            "Sangeeta", "Rahul", "Divya", "Nikhil", "Shweta", "Ashish",
            "Ria", "Varun", "Kritika", "Abhin", "Nisha", "Gaurav", 
            "Swati", "Hardik", "Pallavi", "Rohan", "Seema"
        ]
        
        self.last_names = [
            "Sharma", "Nair", "Verma", "Gupta", "Mehta", "Kaur", "Reddy",
            "Iyer", "Joshi", "Das", "Kumar", "Patel", "Singh", "Tiwari",
            "Agarwal", "Rao", "Mishra", "Aggarwal", "Malhotra", "Bansal",
            "Khanna", "Chopra", "Sethi", "Bhatia", "Goel", "Srivastava"
        ]
    
    def _determine_readiness_status(self, 
                                  potential_rating: float, 
                                  performance_rating: float,
                                  technical_score: int,
                                  communication_score: int,
                                  leadership_score: int,
                                  matched_skills_count: int,
                                  missing_skills_count: int,
                                  total_skills_required: int,
                                  experience_years: int) -> str:
        """
        Determine readiness status based on multiple factors with realistic business logic.
        """
        # Calculate skill completion percentage
        skill_completion = matched_skills_count / total_skills_required if total_skills_required > 0 else 0
        
        # Calculate average assessment score
        avg_assessment = (technical_score + communication_score + leadership_score) / 3
        
        # Ready criteria (achievable standards)
        if (potential_rating >= 3.6 and 
            performance_rating >= 3.6 and 
            avg_assessment >= 70 and 
            skill_completion >= 0.65 and 
            experience_years >= 2):
            return "Ready"
        
        # Not Ready criteria (clearly lacking)
        elif (potential_rating < 3.1 or 
              performance_rating < 3.1 or 
              avg_assessment < 55 or 
              skill_completion < 0.35):
            return "Not Ready"
        
        # Developing (in between, showing promise but needs improvement)
        else:
            return "Developing"
    
    def generate_realistic_record(self, employee_id: int) -> EmployeeReadinessRecord:
        """Generate a single realistic employee readiness record."""
        
        # Generate basic info
        name = f"{random.choice(self.first_names)} {random.choice(self.last_names)}"
        target_role = random.choice(self.roles)
        experience_years = random.randint(1, 12)
        
        # Generate correlated ratings (performance and potential are somewhat related)
        base_performance = random.uniform(2.5, 4.8)
        # Potential tends to be related to performance but with some variation
        potential_rating = max(2.5, min(5.0, base_performance + random.uniform(-0.8, 0.8)))
        performance_rating = base_performance
        
        # Generate assessment scores (higher performers tend to have better scores)
        performance_factor = (performance_rating - 2.5) / 2.5  # Normalize to 0-1
        
        technical_base = 45 + (performance_factor * 35)  # Base range 45-80
        technical_score = int(min(95, max(35, technical_base + random.uniform(-15, 15))))
        
        communication_base = 50 + (performance_factor * 30)  # Base range 50-80
        communication_score = int(min(95, max(40, communication_base + random.uniform(-12, 12))))
        
        leadership_base = 40 + (performance_factor * 35)  # Base range 40-75
        leadership_score = int(min(90, max(30, leadership_base + random.uniform(-15, 15))))
        
        # Generate skill matching (experience and performance influence skill acquisition)
        total_skills_required = random.randint(4, 8)
        experience_factor = min(1.0, experience_years / 8)  # Cap at 8 years
        skill_acquisition_rate = (performance_factor * 0.6) + (experience_factor * 0.4)
        
        matched_skills_count = int(total_skills_required * skill_acquisition_rate * random.uniform(0.7, 1.3))
        matched_skills_count = max(0, min(total_skills_required, matched_skills_count))
        missing_skills_count = total_skills_required - matched_skills_count
        
        # Determine readiness status
        readiness_status = self._determine_readiness_status(
            potential_rating, performance_rating, technical_score,
            communication_score, leadership_score, matched_skills_count,
            missing_skills_count, total_skills_required, experience_years
        )
        
        return EmployeeReadinessRecord(
            employee_id=f"EMP_{employee_id:03d}",
            employee_name=name,
            potential_rating=round(potential_rating, 2),
            performance_rating=round(performance_rating, 2),
            technical_score=technical_score,
            communication_score=communication_score,
            leadership_score=leadership_score,
            matched_skills_count=matched_skills_count,
            missing_skills_count=missing_skills_count,
            total_skills_required=total_skills_required,
            experience_years=experience_years,
            target_role=target_role,
            readiness_status=readiness_status
        )
    
    def generate_dataset(self, num_records: int = 200) -> List[EmployeeReadinessRecord]:
        """Generate a complete dataset with balanced classes."""
        records = []
        
        # Generate initial records
        for i in range(num_records):
            record = self.generate_realistic_record(i + 1)
            records.append(record)
        
        # Check class distribution
        ready_count = sum(1 for r in records if r.readiness_status == "Ready")
        developing_count = sum(1 for r in records if r.readiness_status == "Developing")
        not_ready_count = sum(1 for r in records if r.readiness_status == "Not Ready")
        
        print(f"Generated {num_records} records:")
        print(f"  Ready: {ready_count} ({ready_count/num_records*100:.1f}%)")
        print(f"  Developing: {developing_count} ({developing_count/num_records*100:.1f}%)")
        print(f"  Not Ready: {not_ready_count} ({not_ready_count/num_records*100:.1f}%)")
        
        return records
    
    def save_dataset(self, records: List[EmployeeReadinessRecord], file_path: str):
        """Save dataset to JSON file."""
        data = {
            "dataset_info": {
                "total_records": len(records),
                "features": [
                    "potential_rating", "performance_rating", "technical_score",
                    "communication_score", "leadership_score", "matched_skills_count",
                    "missing_skills_count", "total_skills_required", "experience_years"
                ],
                "target": "readiness_status",
                "classes": ["Ready", "Developing", "Not Ready"]
            },
            "training_data": []
        }
        
        for record in records:
            data["training_data"].append({
                "employee_id": record.employee_id,
                "employee_name": record.employee_name,
                "features": {
                    "potential_rating": record.potential_rating,
                    "performance_rating": record.performance_rating,
                    "technical_score": record.technical_score,
                    "communication_score": record.communication_score,
                    "leadership_score": record.leadership_score,
                    "matched_skills_count": record.matched_skills_count,
                    "missing_skills_count": record.missing_skills_count,
                    "total_skills_required": record.total_skills_required,
                    "experience_years": record.experience_years
                },
                "target_role": record.target_role,
                "readiness_status": record.readiness_status
            })
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Dataset saved to: {file_path}")

def main():
    """Generate and save the employee readiness training dataset."""
    generator = EmployeeReadinessDataGenerator()
    
    print("Generating Employee Readiness Training Dataset...")
    records = generator.generate_dataset(200)
    
    # Save to file
    generator.save_dataset(records, "data/employee_readiness_training_data.json")
    
    print("\nDataset generation complete!")
    print("You can now use this data to train the ML model.")

if __name__ == "__main__":
    main()