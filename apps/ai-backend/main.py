from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Dict, Any
from pydantic import BaseModel
# import json
import os
import uvicorn

from nine_box_matrix import NineBoxMatrix, load_employee_data
from nine_box_visualizer import NineBoxVisualizer

app = FastAPI(title="SuccessionAI API", version="1.0.0", description="Employee Succession Planning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

matrix = NineBoxMatrix()

# Pydantic Models for API
class Employee(BaseModel):
    """Single employee input for segmentation."""
    id: int
    name: str
    performance_rating: float
    potential_rating: float
    role: str = "Employee"
    department: str = "General"
    
    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "name": "John Doe",
                "performance_rating": 4.2,
                "potential_rating": 3.8,
                "role": "Software Engineer",
                "department": "IT"
            }
        }

class EmployeeBatch(BaseModel):
    """Batch of employees for committee review."""
    employees: List[Employee]
    
    class Config:
        schema_extra = {
            "example": {
                "employees": [
                    {
                        "id": 1,
                        "name": "John Doe",
                        "performance_rating": 4.2,
                        "potential_rating": 3.8,
                        "role": "Software Engineer",
                        "department": "IT"
                    },
                    {
                        "id": 2,
                        "name": "Jane Smith",
                        "performance_rating": 3.9,
                        "potential_rating": 4.1,
                        "role": "Data Analyst",
                        "department": "R&D"
                    }
                ]
            }
        }

@app.post("/segment/single", summary="Segment Single Employee", description="Analyze and segment a single employee based on performance and potential ratings")
async def segment_single_employee(employee: Employee):
    """Segment a single employee into nine-box matrix category."""
    try:
        result = matrix.segment_employee(employee.dict())
        return {
            "employee_id": employee.id,
            "employee_name": employee.name,
            "performance_rating": result.performance_rating,
            "potential_rating": result.potential_rating,
            "performance_level": result.performance_level,
            "potential_level": result.potential_level,
            "segment_label": result.segment_label,
            "segment_description": result.segment_description
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Segmentation failed: {str(e)}")

@app.post("/segment/batch", summary="Segment Multiple Employees", description="Batch process multiple employees for committee review and get summary statistics")
async def segment_batch_employees(batch: EmployeeBatch):
    """Segment multiple employees for committee review."""
    try:
        employees_data = [emp.dict() for emp in batch.employees]
        results = matrix.segment_employees(employees_data)
        summary = matrix.get_segment_summary(results)
        
        return {
            "total_employees": len(results),
            "individual_results": [
                {
                    "employee_id": result.employee_id,
                    "employee_name": result.employee_name,
                    "segment_label": result.segment_label,
                    "performance_level": result.performance_level,
                    "potential_level": result.potential_level
                }
                for result in results
            ],
            "summary_statistics": summary,
            "recommendations": {
                "high_priority": [r.employee_name for r in results if "Star" in r.segment_label.value or "Emerging" in r.segment_label.value],
                "development_needed": [r.employee_name for r in results if "Risk" in r.segment_label.value or "Inconsistent" in r.segment_label.value]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch segmentation failed: {str(e)}")

@app.get("/visualize", summary="Generate Nine-Box Matrix Visual", description="Create and return a visual nine-box matrix chart with all sample employees")
async def create_visualization():
    """Generate visual chart of all employees in nine-box matrix."""
    try:
        # Load sample data
        employees_data = load_employee_data("data/sample_employee_data.json")
        
        # Create visualization
        visualizer = NineBoxVisualizer()
        visualizer.create_matplotlib_chart(
            employees_data, 
            save_path="visuals/api_nine_box_matrix.png",
            show_names=True
        )
        
        # Get segmentation results for response
        results = matrix.segment_employees(employees_data)
        summary = matrix.get_segment_summary(results)
        
        return {
            "message": "Visualization created successfully",
            "chart_path": "visuals/api_nine_box_matrix.png",
            "total_employees": len(employees_data),
            "segment_distribution": summary,
            "chart_url": "/download/chart"  # We'll add this endpoint
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")

@app.get("/download/chart", summary="Download Chart File", description="Download the generated nine-box matrix chart as PNG file")
async def download_chart():
    """Download the generated chart file."""
    chart_path = "visuals/api_nine_box_matrix.png"
    if os.path.exists(chart_path):
        return FileResponse(chart_path, media_type="image/png", filename="nine_box_matrix.png")
    else:
        raise HTTPException(status_code=404, detail="Chart not found. Please generate visualization first.")

@app.get("/health", summary="Health Check", description="Check if the API is running")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "SuccessionAI API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)