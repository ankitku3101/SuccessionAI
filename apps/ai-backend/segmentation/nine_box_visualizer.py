"""
Nine-Box Matrix Data Provider

This module provides structured data for nine-box matrix visualization 
on the frontend using Chart.js, Plotly.js, or D3.js.
"""
from typing import List, Dict, Any
from dataclasses import dataclass
from .nine_box_matrix import NineBoxMatrix, NineBoxConfig, load_employee_data


class NineBoxDataProvider:
    """Provides structured data for nine-box matrix visualization on frontend."""
    
    def __init__(self, config: NineBoxConfig = None):
        self.matrix = NineBoxMatrix(config)
        self.segment_colors = self._define_segment_colors()
        
    def _define_segment_colors(self) -> Dict[str, str]:
        """Define colors for each segment in the 9-box matrix."""
        return {
            # High Potential Row (Green tones)
            "Star (High Potential, High Performance)": "#27ae60",
            "Emerging Talent (High Potential, Medium Performance)": "#58d68d", 
            "Enigma (High Potential, Low Performance)": "#f39c12",
            
            # Medium Potential Row (Blue tones)
            "Consistent Performer (Medium Potential, High Performance)": "#3498db",
            "Core Contributor (Medium Potential, Medium Performance)": "#85c1e9",
            "Inconsistent Player (Medium Potential, Low Performance)": "#f39c12",
            
            # Low Potential Row (Red/Purple tones)
            "Solid Performer (Low Potential, High Performance)": "#9b59b6",
            "Diligent Worker (Low Potential, Medium Performance)": "#bdc3c7",
            "Risk Zone (Low Potential, Low Performance)": "#e74c3c",
        }
    
    def _get_short_segment_name(self, full_name: str) -> str:
        """Extract short name from full segment label."""
        return full_name.split('(')[0].strip()
    
    def get_visualization_data(self, employees_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate structured data for frontend visualization instead of static charts.
        Returns JSON-serializable data for Chart.js, Plotly.js, or D3.js.
        """
        # Segment employees
        segmentations = self.matrix.segment_employees(employees_data)
        
        # Prepare employee data for plotting
        employees_plot_data = []
        for seg in segmentations:
            color = self.segment_colors.get(seg.segment_label.value, '#666666')
            short_name = self._get_short_segment_name(seg.segment_label.value)
            
            employees_plot_data.append({
                "id": seg.employee_id,
                "name": seg.employee_name,
                "x": seg.performance_rating,  # X-axis: Performance
                "y": seg.potential_rating,    # Y-axis: Potential
                "segment": short_name,
                "segment_full": seg.segment_label.value,
                "color": color,
                "performance_level": seg.performance_level.value,
                "potential_level": seg.potential_level.value,
                "description": seg.segment_description
            })
        
        # Get configuration for grid and thresholds
        config = self.matrix.config
        
        # Prepare grid configuration
        grid_config = {
            "axis_limits": {
                "x_min": 0,
                "x_max": 5,
                "y_min": 0,
                "y_max": 5
            },
            "thresholds": {
                "performance_low": config.performance_low_threshold,
                "performance_high": config.performance_high_threshold,
                "potential_low": config.potential_low_threshold,
                "potential_high": config.potential_high_threshold
            },
            "grid_lines": [
                {"type": "vertical", "value": config.performance_low_threshold, "style": "major"},
                {"type": "vertical", "value": config.performance_high_threshold, "style": "major"},
                {"type": "horizontal", "value": config.potential_low_threshold, "style": "major"},
                {"type": "horizontal", "value": config.potential_high_threshold, "style": "major"}
            ]
        }
        
        # Define segment areas for background coloring
        segments_config = [
            # Bottom row (Low Potential)
            {
                "name": "Risk Zone",
                "full_name": "Risk Zone (Low Potential, Low Performance)",
                "bounds": {
                    "x_min": 0,
                    "x_max": config.performance_low_threshold,
                    "y_min": 0,
                    "y_max": config.potential_low_threshold
                },
                "background_color": "#ffebee",
                "color": "#e74c3c",
                "position": {"x": "low", "y": "low"}
            },
            {
                "name": "Diligent Worker",
                "full_name": "Diligent Worker (Low Potential, Medium Performance)",
                "bounds": {
                    "x_min": config.performance_low_threshold,
                    "x_max": config.performance_high_threshold,
                    "y_min": 0,
                    "y_max": config.potential_low_threshold
                },
                "background_color": "#f3e5f5",
                "color": "#bdc3c7",
                "position": {"x": "medium", "y": "low"}
            },
            {
                "name": "Solid Performer",
                "full_name": "Solid Performer (Low Potential, High Performance)",
                "bounds": {
                    "x_min": config.performance_high_threshold,
                    "x_max": 5,
                    "y_min": 0,
                    "y_max": config.potential_low_threshold
                },
                "background_color": "#e8f5e8",
                "color": "#9b59b6",
                "position": {"x": "high", "y": "low"}
            },
            # Middle row (Medium Potential)
            {
                "name": "Inconsistent Player",
                "full_name": "Inconsistent Player (Medium Potential, Low Performance)",
                "bounds": {
                    "x_min": 0,
                    "x_max": config.performance_low_threshold,
                    "y_min": config.potential_low_threshold,
                    "y_max": config.potential_high_threshold
                },
                "background_color": "#fff3e0",
                "color": "#f39c12",
                "position": {"x": "low", "y": "medium"}
            },
            {
                "name": "Core Contributor",
                "full_name": "Core Contributor (Medium Potential, Medium Performance)",
                "bounds": {
                    "x_min": config.performance_low_threshold,
                    "x_max": config.performance_high_threshold,
                    "y_min": config.potential_low_threshold,
                    "y_max": config.potential_high_threshold
                },
                "background_color": "#e3f2fd",
                "color": "#85c1e9",
                "position": {"x": "medium", "y": "medium"}
            },
            {
                "name": "Consistent Performer",
                "full_name": "Consistent Performer (Medium Potential, High Performance)",
                "bounds": {
                    "x_min": config.performance_high_threshold,
                    "x_max": 5,
                    "y_min": config.potential_low_threshold,
                    "y_max": config.potential_high_threshold
                },
                "background_color": "#e8f5e8",
                "color": "#3498db",
                "position": {"x": "high", "y": "medium"}
            },
            # Top row (High Potential)
            {
                "name": "Enigma",
                "full_name": "Enigma (High Potential, Low Performance)",
                "bounds": {
                    "x_min": 0,
                    "x_max": config.performance_low_threshold,
                    "y_min": config.potential_high_threshold,
                    "y_max": 5
                },
                "background_color": "#fff8e1",
                "color": "#f39c12",
                "position": {"x": "low", "y": "high"}
            },
            {
                "name": "Emerging Talent",
                "full_name": "Emerging Talent (High Potential, Medium Performance)",
                "bounds": {
                    "x_min": config.performance_low_threshold,
                    "x_max": config.performance_high_threshold,
                    "y_min": config.potential_high_threshold,
                    "y_max": 5
                },
                "background_color": "#e8f5e8",
                "color": "#58d68d",
                "position": {"x": "medium", "y": "high"}
            },
            {
                "name": "Star",
                "full_name": "Star (High Potential, High Performance)",
                "bounds": {
                    "x_min": config.performance_high_threshold,
                    "x_max": 5,
                    "y_min": config.potential_high_threshold,
                    "y_max": 5
                },
                "background_color": "#e8f5e8",
                "color": "#27ae60",
                "position": {"x": "high", "y": "high"}
            }
        ]
        
        # Generate segment summary
        segment_summary = self.matrix.get_segment_summary(segmentations)
        
        # Chart styling configuration
        chart_styling = {
            "title": "Nine-Box Matrix: Employee Performance vs Potential",
            "x_axis_label": "Performance Rating →",
            "y_axis_label": "Potential Rating →",
            "colors": self.segment_colors,
            "point_size": 120,
            "grid_color": "#95a5a6",
            "grid_alpha": 0.3,
            "major_grid_color": "#2c3e50",
            "major_grid_width": 3
        }
        
        return {
            "employees": employees_plot_data,
            "grid_config": grid_config,
            "segments": segments_config,
            "segment_summary": segment_summary,
            "chart_styling": chart_styling,
            "metadata": {
                "total_employees": len(employees_plot_data),
                "chart_type": "scatter",
                "data_source": "mongodb",
                "timestamp": "auto-generated"
            }
        }


def main():
    """Demo the nine-box data provider."""
    # Load sample data
    employees = load_employee_data("data/sample_employee_data.json")
    
    # Create data provider
    data_provider = NineBoxDataProvider()
    
    print("Generating nine-box matrix data for frontend...")
    
    # Get structured data
    visualization_data = data_provider.get_visualization_data(employees)
    
    print(f"Generated data for {len(visualization_data['employees'])} employees")
    print(f"Segment distribution: {visualization_data['segment_summary']}")
    print("Data ready for frontend Chart.js/Plotly.js visualization!")

if __name__ == "__main__":
    main()