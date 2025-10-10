from fastapi import FastAPI, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from typing import List
from pydantic import BaseModel
import uvicorn
import ngrok
import logging
from logging.handlers import TimedRotatingFileHandler
import os


from segmentation.nine_box_matrix import NineBoxMatrix
from segmentation.nine_box_visualizer import NineBoxDataProvider
from gap_analysis.gap_analysis_agent import GapAnalysisAgent
from readiness.employee_readiness_model import EmployeeReadinessModel, EmployeeFeatures
from idp_generation.idp_generator import generate_employee_idp
from db_services.mongo_data_service import (
    get_employee_for_nine_box,
    get_employees_for_batch_analysis,
    get_employee_and_role_for_gap_analysis,
    get_all_employees_for_visualization,
    get_employee_for_readiness_prediction,
    get_employees_for_batch_readiness_prediction,
    MongoDataFetcher
)

app = FastAPI(title="SuccessionAI API", version="1.0.0", description="Employee Succession Planning API with MongoDB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://succession-ai-web.vercel.app","http://localhost:3000", "*"],
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
readiness_model = EmployeeReadinessModel()

# Pydantic Models for API
class EmployeeIdRequest(BaseModel):
    """Single employee ID for analysis."""
    employee_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": "68e2c736457c490e4e901139"
            }
        }

class EmployeeBatchRequest(BaseModel):
    """Multiple employee IDs for batch analysis."""
    employee_ids: List[str]
    
    class Config:
        json_schema_extra = {
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
        json_schema_extra = {
            "example": {
                "employee_id": "68e2c736457c490e4e901139",
                "role_name": "Technical Lead"
            }
        }

class ReadinessFeatures(BaseModel):
    """Manual features input for readiness prediction."""
    performance_rating: float
    potential_rating: float
    leadership_score: int
    missing_skills_count: int
    technical_score: int
    communication_score: int
    experience_years: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "performance_rating": 4.2,
                "potential_rating": 3.8,
                "leadership_score": 75,
                "missing_skills_count": 2,
                "technical_score": 85,
                "communication_score": 78,
                "experience_years": 4
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


@app.get("/visualize/data", summary="Get Nine-Box Matrix Data for Frontend", description="Fetch all employees from MongoDB and return structured data for frontend visualization")
async def get_visualization_data():
    """Get structured nine-box matrix data for frontend Chart.js/Plotly.js visualization."""
    try:
        # Fetch all employees from MongoDB
        employees_data = get_all_employees_for_visualization()
        if not employees_data:
            raise HTTPException(status_code=404, detail="No employees found in database")
        
        # Create data provider and get structured data
        data_provider = NineBoxDataProvider()
        visualization_data = data_provider.get_visualization_data(employees_data)
        
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
        
        # Create data provider and get structured data
        data_provider = NineBoxDataProvider()
        visualization_data = data_provider.get_visualization_data(employees_data)
        
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
                "role": employee_data["role"],
                "experience_years": employee_data["experience_years"],
            },
            "target_role_info": {
                "role": role_data["role"],
                "required_experience": role_data["required_experience"],
            },
            "gap_analysis": {
                "overall_skill_match": output.get("overall_skill_match", "N/A"),
                "matched_skills": output.get("matched_skills", []),
                "missing_skills": output.get("missing_skills", []),
                "score_gaps": output.get("score_gaps", {}),
                "rating_gaps": output.get("rating_gaps", {}),
                "recommendations": output.get("recommendations", []),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")

@app.post("/readiness/predict", summary="Predict Employee Readiness from MongoDB", description="Fetch employee from MongoDB and predict readiness status using ML model")
async def predict_employee_readiness(request: EmployeeIdRequest):
    """Predict employee readiness status using MongoDB data."""
    try:
        # Fetch employee from MongoDB with calculated missing skills
        employee_data = get_employee_for_readiness_prediction(request.employee_id)
        if not employee_data:
            raise HTTPException(status_code=404, detail=f"Employee with ID {request.employee_id} not found")
        
        # Extract features for ML model
        features = EmployeeFeatures(
            performance_rating=employee_data["performance_rating"],
            potential_rating=employee_data["potential_rating"],
            leadership_score=employee_data["assessment_scores"]["leadership"],
            missing_skills_count=employee_data["missing_skills_count"],
            technical_score=employee_data["assessment_scores"]["technical"],
            communication_score=employee_data["assessment_scores"]["communication"],
            experience_years=employee_data["experience_years"]
        )
        
        # Make prediction
        prediction = readiness_model.predict_readiness(features, request.employee_id)
        
        return {
            "employee_info": {
                "mongo_id": request.employee_id,
                "name": employee_data["name"],
                "role": employee_data["role"],
                "target_role": employee_data["target_success_role"],
                "performance_rating": employee_data["performance_rating"],
                "potential_rating": employee_data["potential_rating"]
            },
            "input_features": {
                "performance_rating": features.performance_rating,
                "potential_rating": features.potential_rating,
                "leadership_score": features.leadership_score,
                "missing_skills_count": features.missing_skills_count,
                "technical_score": features.technical_score,
                "communication_score": features.communication_score,
                "experience_years": features.experience_years
            },
            "prediction": {
                "readiness_status": prediction.predicted_readiness,
                "confidence": round(prediction.confidence, 3),
                "probabilities": {k: round(v, 3) for k, v in prediction.probabilities.items()}
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Readiness prediction failed: {str(e)}")

@app.post("/readiness/predict/batch", summary="Batch Predict Employee Readiness", description="Predict readiness status for multiple employees from MongoDB")
async def predict_batch_employee_readiness(request: EmployeeBatchRequest):
    """Predict readiness status for multiple employees."""
    try:
        # Fetch employees from MongoDB
        employees_data = get_employees_for_batch_readiness_prediction(request.employee_ids)
        if not employees_data:
            raise HTTPException(status_code=404, detail="No employees found with provided IDs")
        
        results = []
        for employee_data in employees_data:
            try:
                # Extract features for ML model
                features = EmployeeFeatures(
                    performance_rating=employee_data["performance_rating"],
                    potential_rating=employee_data["potential_rating"],
                    leadership_score=employee_data["assessment_scores"]["leadership"],
                    missing_skills_count=employee_data["missing_skills_count"],
                    technical_score=employee_data["assessment_scores"]["technical"],
                    communication_score=employee_data["assessment_scores"]["communication"],
                    experience_years=employee_data["experience_years"]
                )
                
                # Make prediction
                prediction = readiness_model.predict_readiness(features, employee_data["id"])
                
                results.append({
                    "employee_id": employee_data["id"],
                    "employee_name": employee_data["name"],
                    "current_role": employee_data["role"],
                    "target_role": employee_data["target_success_role"],
                    "readiness_status": prediction.predicted_readiness,
                    "confidence": round(prediction.confidence, 3),
                    "probabilities": {k: round(v, 3) for k, v in prediction.probabilities.items()}
                })
                
            except Exception as e:
                results.append({
                    "employee_id": employee_data["id"],
                    "employee_name": employee_data["name"],
                    "error": f"Prediction failed: {str(e)}"
                })
        
        # Generate summary
        status_summary = {}
        successful_predictions = [r for r in results if "readiness_status" in r]
        for result in successful_predictions:
            status = result["readiness_status"]
            status_summary[status] = status_summary.get(status, 0) + 1
        
        return {
            "total_requested": len(request.employee_ids),
            "total_found": len(employees_data),
            "successful_predictions": len(successful_predictions),
            "failed_predictions": len(results) - len(successful_predictions),
            "summary": status_summary,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch readiness prediction failed: {str(e)}")

@app.post("/readiness/predict/manual", summary="Predict Readiness with Manual Features", description="Predict employee readiness using manually provided features")
async def predict_readiness_manual_features(features: ReadinessFeatures):
    """Predict employee readiness using manually provided features."""
    try:
        # Convert Pydantic model to EmployeeFeatures dataclass
        employee_features = EmployeeFeatures(
            performance_rating=features.performance_rating,
            potential_rating=features.potential_rating,
            leadership_score=features.leadership_score,
            missing_skills_count=features.missing_skills_count,
            technical_score=features.technical_score,
            communication_score=features.communication_score,
            experience_years=features.experience_years
        )
        
        # Make prediction
        prediction = readiness_model.predict_readiness(employee_features, "MANUAL_INPUT")
        
        return {
            "input_features": features.dict(),
            "prediction": {
                "readiness_status": prediction.predicted_readiness,
                "confidence": round(prediction.confidence, 3),
                "probabilities": {k: round(v, 3) for k, v in prediction.probabilities.items()}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual readiness prediction failed: {str(e)}")

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

@app.post("/idp/generate/enhanced", summary="Generate Enhanced Individual Development Plan", description="Generate comprehensive IDP with LLM integration, web search, and mentor matching")
async def generate_enhanced_idp_endpoint(request: EmployeeIdRequest):
    """Generate Enhanced Individual Development Plan for an employee using multi-agent workflow."""
    try:
        # Generate IDP using the DB-driven orchestrator
        result = generate_employee_idp(request.employee_id)

        if result and result.get("success"):
            return {
                "success": True,
                "message": f"Enhanced IDP generated successfully for employee {request.employee_id}",
                "idp": result.get("idp"),
                "warning": result.get("warning")  # In case storage failed
            }

        # If generation failed, propagate error
        error_msg = result.get("error") if isinstance(result, dict) else "Unknown error"
        raise HTTPException(status_code=500, detail=f"Enhanced IDP generation failed: {error_msg}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced IDP generation failed: {str(e)}")

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
