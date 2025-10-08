"""
Test FastAPI endpoints for SuccessionAI system
Tests the actual HTTP endpoints with proper request/response validation
"""
import requests
import json
import time
import subprocess
import os
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def wait_for_server(max_attempts=10):
    """Wait for the FastAPI server to be ready."""
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Server is ready!")
                return True
        except requests.exceptions.RequestException:
            print(f"⏳ Waiting for server... (attempt {attempt + 1}/{max_attempts})")
            time.sleep(2)
    return False

def test_health_endpoint():
    """Test the health check endpoint."""
    print("\n🔍 Testing Health Check Endpoint")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {data['status']}")
        print(f"Message: {data['message']}")
        print("✅ Health check passed!")
        return True
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False

def test_single_employee_endpoint():
    """Test the single employee segmentation endpoint."""
    print("\n🔍 Testing Single Employee Segmentation")
    print("-" * 40)
    
    # Test payload
    employee_data = {
        "id": 1,
        "name": "Test Employee",
        "performance_rating": 4.2,
        "potential_rating": 3.8,
        "role": "Software Engineer",
        "department": "IT"
    }
    
    response = requests.post(f"{BASE_URL}/segment/single", json=employee_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Employee: {result['employee_name']}")
        print(f"Performance: {result['performance_rating']} ({result['performance_level']})")
        print(f"Potential: {result['potential_rating']} ({result['potential_level']})")
        print(f"Segment: {result['segment_label']}")
        print(f"Description: {result['segment_description']}")
        print("✅ Single employee segmentation working!")
        return True
    else:
        print(f"❌ Single employee test failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def test_batch_employees_endpoint():
    """Test the batch employee segmentation endpoint."""
    print("\n🔍 Testing Batch Employee Segmentation")
    print("-" * 40)
    
    # Test payload with multiple employees
    batch_data = {
        "employees": [
            {
                "id": 1,
                "name": "High Performer",
                "performance_rating": 4.5,
                "potential_rating": 4.2,
                "role": "Senior Engineer",
                "department": "IT"
            },
            {
                "id": 2,
                "name": "Core Contributor",
                "performance_rating": 3.8,
                "potential_rating": 3.6,
                "role": "Analyst",
                "department": "Business"
            },
            {
                "id": 3,
                "name": "Development Needed",
                "performance_rating": 3.2,
                "potential_rating": 3.1,
                "role": "Junior Developer",
                "department": "IT"
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/segment/batch", json=batch_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Total Employees Processed: {result['total_employees']}")
        
        print("\nIndividual Results:")
        for emp in result['individual_results']:
            print(f"  • {emp['employee_name']}: {emp['segment_label']}")
        
        print("\nSummary Statistics:")
        for segment, count in result['summary_statistics'].items():
            print(f"  • {segment}: {count} employees")
        
        print("\nRecommendations:")
        print(f"  • High Priority: {', '.join(result['recommendations']['high_priority'])}")
        print(f"  • Development Needed: {', '.join(result['recommendations']['development_needed'])}")
        
        print("✅ Batch employee segmentation working!")
        return True
    else:
        print(f"❌ Batch employee test failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def test_visualization_endpoint():
    """Test the visualization generation endpoint."""
    print("\n🔍 Testing Visualization Generation")
    print("-" * 40)
    
    response = requests.get(f"{BASE_URL}/visualize")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Message: {result['message']}")
        print(f"Chart Path: {result['chart_path']}")
        print(f"Total Employees: {result['total_employees']}")
        
        print("\nSegment Distribution:")
        for segment, count in result['segment_distribution'].items():
            print(f"  • {segment}: {count} employees")
        
        # Test chart download
        download_response = requests.get(f"{BASE_URL}/download/chart")
        if download_response.status_code == 200:
            print("✅ Chart download working!")
            print(f"Chart size: {len(download_response.content)} bytes")
        else:
            print(f"⚠️ Chart download failed: {download_response.status_code}")
        
        print("✅ Visualization generation working!")
        return True
    else:
        print(f"❌ Visualization test failed: {response.status_code}")
        print(f"Error: {response.text}")
        return False

def run_comprehensive_api_test():
    """Run all API endpoint tests."""
    print("🚀 TESTING SUCCESSION AI - FASTAPI ENDPOINTS")
    print("=" * 60)
    
    # Check if server is running
    if not wait_for_server():
        print("❌ Server is not running! Please start the server with:")
        print("   python main.py")
        return False
    
    # Run all tests
    tests = [
        test_health_endpoint,
        test_single_employee_endpoint,
        test_batch_employees_endpoint,
        test_visualization_endpoint
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append(False)
    
    # Final summary
    print("\n🎯 FINAL API TEST RESULTS")
    print("=" * 60)
    
    test_names = [
        "Health Check Endpoint",
        "Single Employee Segmentation",
        "Batch Employee Segmentation", 
        "Visualization Generation"
    ]
    
    for i, (name, passed) in enumerate(zip(test_names, results)):
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{i+1}. {name}: {status}")
    
    all_passed = all(results)
    if all_passed:
        print("\n🎉 ALL API TESTS PASSED!")
        print("🔗 Ready for NextJS frontend integration")
        print("\n📖 API Documentation available at: http://localhost:8000/docs")
    else:
        print(f"\n⚠️ {results.count(False)} test(s) failed")
    
    return all_passed

if __name__ == "__main__":
    run_comprehensive_api_test()