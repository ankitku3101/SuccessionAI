from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import uvicorn
import ngrok
import logging
from logging.handlers import TimedRotatingFileHandler
import os


from nine_box_matrix import NineBoxMatrix
from nine_box_visualizer import NineBoxVisualizer
from gap_analysis_agent import GapAnalysisAgent
from mongo_data_service import (
    get_employee_for_nine_box,
    get_employees_for_batch_analysis,
    get_employee_and_role_for_gap_analysis,
    get_all_employees_for_visualization,
    MongoDataFetcher
)

app = FastAPI(title="SuccessionAI API", version="1.0.0", description="Employee Succession Planning API with MongoDB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Logging Setup =====
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app-ai-backend.log")


os.makedirs(LOG_DIR, exist_ok=True)

# Configure rotating file handler (rotate every midnight, keep 5 days)
handler = TimedRotatingFileHandler(
    LOG_FILE, when="midnight", interval=1, backupCount=5, encoding="utf-8"
)

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)

logging.basicConfig(
    level=logging.INFO,
    handlers=[handler, logging.StreamHandler()]  # Log to file + console
)

logger = logging.getLogger("succession_ai")
logger.info("Logging initialized...")

uvicorn_logger = logging.getLogger("uvicorn.access")
uvicorn_logger.addHandler(handler)

uvicorn_error_logger = logging.getLogger("uvicorn.error")
uvicorn_error_logger.addHandler(handler)


matrix = NineBoxMatrix()
gap_agent = GapAnalysisAgent()

# Pydantic Models for API
class EmployeeIdRequest(BaseModel):
    """Single employee ID for analysis."""
    employee_id: str
    
    class Config:
        schema_extra = {
            "example": {
                "employee_id": "68e2c736457c490e4e901139"
            }
        }

class EmployeeBatchRequest(BaseModel):
    """Multiple employee IDs for batch analysis."""
    employee_ids: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "employee_ids": [
                    "68e2c736457c490e4e901139",
                    "68e2c736457c490e4e90113a",
                    "68e2c736457c490e4e90113b"
                ]
            }
        }

class GapAnalysisRequest(BaseModel):
    """Employee ID and optional role for gap analysis."""
    employee_id: str
    role_name: str = None  # Optional, will use employee's target_success_role if not provided
    
    class Config:
        schema_extra = {
            "example": {
                "employee_id": "68e2c736457c490e4e901139",
                "role_name": "Technical Lead"
            }
        }

@app.post("/segment/single", summary="Segment Single Employee from MongoDB", description="Fetch employee from MongoDB and analyze nine-box matrix segment")
async def segment_single_employee(request: EmployeeIdRequest):
    """Segment a single employee from MongoDB."""
    try:
        # Fetch employee from MongoDB
        employee_data = get_employee_for_nine_box(request.employee_id)
        if not employee_data:
            raise HTTPException(status_code=404, detail=f"Employee with ID {request.employee_id} not found")
        
        # Segment employee
        result = matrix.segment_employee(employee_data)
        
        return {
            "employee_id": result.employee_id,
            "employee_name": result.employee_name,
            "performance_rating": result.performance_rating,
            "potential_rating": result.potential_rating,
            "performance_level": result.performance_level,
            "potential_level": result.potential_level,
            "segment_label": result.segment_label
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")

@app.post("/segment/batch", summary="Segment Multiple Employees from MongoDB", description="Fetch multiple employees from MongoDB and perform batch nine-box analysis")
async def segment_batch_employees(request: EmployeeBatchRequest):
    """Segment multiple employees from MongoDB."""
    try:
        # Fetch employees from MongoDB
        employees_data = get_employees_for_batch_analysis(request.employee_ids)
        if not employees_data:
            raise HTTPException(status_code=404, detail="No employees found with provided IDs")
        
        # Segment employees
        results = matrix.segment_employees(employees_data)
        summary = matrix.get_segment_summary(results)
        
        return {
            "total_employees": len(results),
            "found_employees": len(employees_data),
            "requested_employees": len(request.employee_ids),
            "individual_results": [
                {
                    "employee_id": result.employee_id,
                    "employee_name": result.employee_name,
                    "performance_rating": result.performance_rating,
                    "potential_rating": result.potential_rating,
                    "performance_level": result.performance_level,
                    "potential_level": result.potential_level,
                    "segment_label": result.segment_label
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
        raise HTTPException(status_code=500, detail=f"Batch segmentation failed: {str(e)}")

# @app.get("/visualize", summary="Generate Nine-Box Matrix Visual from MongoDB", description="Fetch all employees from MongoDB and create nine-box matrix visualization")
# async def create_visualization():
#     """Generate visual chart using all employees from MongoDB."""
#     try:
#         # Fetch all employees from MongoDB
#         employees_data = get_all_employees_for_visualization()
#         if not employees_data:
#             raise HTTPException(status_code=404, detail="No employees found in database")
        
#         # Create enhanced visualization
#         visualizer = NineBoxVisualizer()
        
#         # Ensure visuals directory exists
#         os.makedirs("visuals", exist_ok=True)
        
#         visualizer.create_matplotlib_chart(
#             employees_data, 
#             save_path="visuals/latest_nine_box_matrix.png",
#             show_names=True
#         )
        
#         # Get segmentation results for response
#         results = matrix.segment_employees(employees_data)
#         summary = matrix.get_segment_summary(results)
        
#         return {
#             "message": "Enhanced visualization created successfully from MongoDB data",
#             "chart_path": "visuals/enhanced_mongo_nine_box_matrix.png",
#             "total_employees": len(employees_data),
#             "segment_distribution": summary,
#             "chart_url": "/download/chart"
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Visualization failed: {str(e)}")

@app.get("/visualize/data", summary="Get Nine-Box Matrix Data for Frontend", description="Fetch all employees from MongoDB and return structured data for frontend visualization")
async def get_visualization_data():
    """Get structured nine-box matrix data for frontend Chart.js/Plotly.js visualization."""
    try:
        # Fetch all employees from MongoDB
        employees_data = get_all_employees_for_visualization()
        if not employees_data:
            raise HTTPException(status_code=404, detail="No employees found in database")
        
        # Create visualizer and get structured data
        visualizer = NineBoxVisualizer()
        visualization_data = visualizer.get_visualization_data(employees_data)
        
        return {
            "success": True,
            "message": "Nine-box matrix data generated successfully from MongoDB",
            "data": visualization_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data generation failed: {str(e)}")

@app.post("/visualize/data/filtered", summary="Get Filtered Nine-Box Matrix Data", description="Get nine-box matrix data for specific employees")
async def get_filtered_visualization_data(request: EmployeeBatchRequest):
    """Get structured nine-box matrix data for specific employees."""
    try:
        # Fetch specific employees from MongoDB
        employees_data = get_employees_for_batch_analysis(request.employee_ids)
        if not employees_data:
            raise HTTPException(status_code=404, detail="No employees found with provided IDs")
        
        # Create visualizer and get structured data
        visualizer = NineBoxVisualizer()
        visualization_data = visualizer.get_visualization_data(employees_data)
        
        return {
            "success": True,
            "message": f"Nine-box matrix data generated for {len(employees_data)} employees",
            "requested_count": len(request.employee_ids),
            "found_count": len(employees_data),
            "data": visualization_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filtered data generation failed: {str(e)}")

@app.post("/gap-analysis", summary="Perform Gap Analysis from MongoDB", description="Fetch employee and role from MongoDB and perform LLM-based gap analysis")
async def perform_gap_analysis(request: GapAnalysisRequest):
    """Perform gap analysis using MongoDB data."""
    try:
        # Fetch employee and role from MongoDB
        employee_data, role_data = get_employee_and_role_for_gap_analysis(
            request.employee_id, 
            request.role_name
        )
        
        if not employee_data:
            raise HTTPException(status_code=404, detail=f"Employee with ID {request.employee_id} not found")
        
        if not role_data:
            target_role = request.role_name or employee_data.get("target_success_role", "Unknown")
            raise HTTPException(status_code=404, detail=f"Success role '{target_role}' not found")
        
        # Perform gap analysis
        gap_result = gap_agent.analyze(employee_data, role_data)
        
        # Handle both dict and Pydantic model output
        if hasattr(gap_result, 'dict'):
            output = gap_result.dict()
        else:
            output = gap_result
        
        return {
            "employee_info": {
                "mongo_id": request.employee_id,
                "name": employee_data["name"],
                "role": employee_data["role"],
                "performance_rating": employee_data["performance_rating"],
                "potential_rating": employee_data["potential_rating"]
            },
            "target_role": role_data["role"],
            "gap_analysis": output
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")

@app.get("/database/status", summary="Check MongoDB Connection", description="Check database connection and get collection statistics")
async def database_status():
    """Check MongoDB connection status."""
    try:
        fetcher = MongoDataFetcher()
        status = fetcher.get_database_status()
        fetcher.close_connection()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database check failed: {str(e)}")

# @app.get("/download/chart", summary="Download Chart File", description="Download the generated nine-box matrix chart")
# async def download_chart():
#     """Download the generated chart file."""
#     chart_path = "visuals/latest_nine_box_matrix.png"
#     if os.path.exists(chart_path):
#         return FileResponse(chart_path, media_type="image/png", filename="latest_nine_box_matrix.png")
#     else:
#         raise HTTPException(status_code=404, detail="Chart not found. Please generate visualization first.")

@app.get("/health", summary="Health Check", description="Check if the API is running")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "SuccessionAI API is running"}

if __name__ == "__main__":
    # Disabling Grok for Development
    # authtoken = os.getenv("NGROK_AUTHTOKEN")
    # listener = ngrok.forward(addr=8000, domain="mole-model-drake.ngrok-free.app", authtoken = authtoken)
    # print(listener.url())
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
    # ngrok.disconnect()