"""
Nine-Box Matrix Module for Employee Segmentation

This module implements a rule-based 9-box matrix that segments employees
based on their performance rating (X-axis) and potential rating (Y-axis).
"""
from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import json


class PerformanceLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class PotentialLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class SegmentLabel(str, Enum):
    # High Potential Row
    HIGH_POTENTIAL_LOW_PERFORMANCE = "Enigma (High Potential, Low Performance)"
    EMERGING_TALENT = "Emerging Talent (High Potential, Medium Performance)"
    HIGH_PERFORMER_HIGH_POTENTIAL = "Star (High Potential, High Performance)"
    
    # Medium Potential Row
    INCONSISTENT_PLAYER = "Inconsistent Player (Medium Potential, Low Performance)"
    CORE_CONTRIBUTOR = "Core Contributor (Medium Potential, Medium Performance)"
    CONSISTENT_PERFORMER = "Consistent Performer (Medium Potential, High Performance)"
    
    # Low Potential Row
    RISK_ZONE = "Risk Zone (Low Potential, Low Performance)"
    DILIGENT_WORKER = "Diligent Worker (Low Potential, Medium Performance)"
    SOLID_PERFORMER = "Solid Performer (Low Potential, High Performance)"


class NineBoxConfig(BaseModel):
    """Configuration for 9-box matrix thresholds."""
    performance_low_threshold: float = Field(default=3.5, description="Below this is Low Performance")
    performance_high_threshold: float = Field(default=4.0, description="Above this is High Performance")
    potential_low_threshold: float = Field(default=3.5, description="Below this is Low Potential")
    potential_high_threshold: float = Field(default=4.0, description="Above this is High Potential")


class EmployeeSegmentation(BaseModel):
    """Result of employee segmentation."""
    employee_id: int
    employee_name: str
    performance_rating: float
    potential_rating: float
    performance_level: PerformanceLevel
    potential_level: PotentialLevel
    segment_label: SegmentLabel
    segment_description: str


class NineBoxMatrix:
    """Nine-box matrix implementation for employee segmentation."""
    
    def __init__(self, config: NineBoxConfig = None):
        self.config = config or NineBoxConfig()
        self._segment_mapping = self._create_segment_mapping()
    
    def _create_segment_mapping(self) -> Dict[tuple, tuple]:
        """Create mapping from (performance_level, potential_level) to (segment_label, description)."""
        return {
            # High Potential Row
            (PerformanceLevel.LOW, PotentialLevel.HIGH): (
                SegmentLabel.HIGH_POTENTIAL_LOW_PERFORMANCE,
                "High potential but underperforming. May need coaching, role adjustment, or support."
            ),
            (PerformanceLevel.MEDIUM, PotentialLevel.HIGH): (
                SegmentLabel.EMERGING_TALENT,
                "Rising stars with high potential. Invest in development and growth opportunities."
            ),
            (PerformanceLevel.HIGH, PotentialLevel.HIGH): (
                SegmentLabel.HIGH_PERFORMER_HIGH_POTENTIAL,
                "Top talent. Retain, promote, and use as mentors. Future leaders."
            ),
            
            # Medium Potential Row
            (PerformanceLevel.LOW, PotentialLevel.MEDIUM): (
                SegmentLabel.INCONSISTENT_PLAYER,
                "Inconsistent performance with moderate potential. Needs performance improvement plan."
            ),
            (PerformanceLevel.MEDIUM, PotentialLevel.MEDIUM): (
                SegmentLabel.CORE_CONTRIBUTOR,
                "Reliable performers forming the backbone of the organization. Provide stability."
            ),
            (PerformanceLevel.HIGH, PotentialLevel.MEDIUM): (
                SegmentLabel.CONSISTENT_PERFORMER,
                "Strong current performers. Recognize contributions and maintain engagement."
            ),
            
            # Low Potential Row
            (PerformanceLevel.LOW, PotentialLevel.LOW): (
                SegmentLabel.RISK_ZONE,
                "Poor performance and limited potential. Consider performance improvement or exit."
            ),
            (PerformanceLevel.MEDIUM, PotentialLevel.LOW): (
                SegmentLabel.DILIGENT_WORKER,
                "Steady workers with limited growth potential. Keep engaged in current role."
            ),
            (PerformanceLevel.HIGH, PotentialLevel.LOW): (
                SegmentLabel.SOLID_PERFORMER,
                "High performers happy in current role. Valuable individual contributors."
            ),
        }
    
    def _categorize_rating(self, rating: float, low_threshold: float, high_threshold: float) -> str:
        """Categorize a rating into Low/Medium/High based on thresholds."""
        if rating < low_threshold:
            return "Low"
        elif rating >= high_threshold:
            return "High"
        else:
            return "Medium"
    
    def segment_employee(self, employee_data: Dict[str, Any]) -> EmployeeSegmentation:
        """Segment a single employee based on performance and potential ratings."""
        performance_rating = employee_data["performance_rating"]
        potential_rating = employee_data["potential_rating"]
        
        # Categorize performance and potential
        performance_level = PerformanceLevel(
            self._categorize_rating(
                performance_rating, 
                self.config.performance_low_threshold, 
                self.config.performance_high_threshold
            )
        )
        
        potential_level = PotentialLevel(
            self._categorize_rating(
                potential_rating, 
                self.config.potential_low_threshold, 
                self.config.potential_high_threshold
            )
        )
        
        # Get segment label and description
        segment_label, segment_description = self._segment_mapping[(performance_level, potential_level)]
        
        return EmployeeSegmentation(
            employee_id=employee_data["id"],
            employee_name=employee_data["name"],
            performance_rating=performance_rating,
            potential_rating=potential_rating,
            performance_level=performance_level,
            potential_level=potential_level,
            segment_label=segment_label,
            segment_description=segment_description
        )
    
    def segment_employees(self, employees_data: List[Dict[str, Any]]) -> List[EmployeeSegmentation]:
        """Segment multiple employees."""
        return [self.segment_employee(employee) for employee in employees_data]
    
    def get_segment_summary(self, segmentations: List[EmployeeSegmentation]) -> Dict[str, int]:
        """Get count summary of employees in each segment."""
        summary = {}
        for segmentation in segmentations:
            segment = segmentation.segment_label.value
            summary[segment] = summary.get(segment, 0) + 1
        return summary


def load_employee_data(file_path: str) -> List[Dict[str, Any]]:
    """Load employee data from JSON file."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data["employees"]


def main():
    # Load sample data
    employees = load_employee_data("data/sample_employee_data.json")
    
    # Initialize 9-box matrix with default config
    nine_box = NineBoxMatrix()
    
    # Segment all employees
    segmentations = nine_box.segment_employees(employees)
    
    # Print results
    print("=== NINE-BOX MATRIX SEGMENTATION RESULTS ===\n")
    
    for seg in segmentations:
        print(f"Employee: {seg.employee_name}")
        print(f"  Performance: {seg.performance_rating} ({seg.performance_level})")
        print(f"  Potential: {seg.potential_rating} ({seg.potential_level})")
        print(f"  Segment: {seg.segment_label}")
        print(f"  Description: {seg.segment_description}")
        print()
    
    # Print summary
    summary = nine_box.get_segment_summary(segmentations)
    print("=== SEGMENT SUMMARY ===")
    for segment, count in summary.items():
        print(f"{segment}: {count} employees")


if __name__ == "__main__":
    main()