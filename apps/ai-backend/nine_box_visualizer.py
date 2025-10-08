"""
Enhanced Nine-Box Matrix Visualization Module

This module creates clean, consistent, and attractive visual representations 
of the nine-box matrix with fixed grid layout and improved styling.
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, TYPE_CHECKING
from dataclasses import dataclass
import seaborn as sns

try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    if TYPE_CHECKING:
        pass

from nine_box_matrix import NineBoxMatrix, NineBoxConfig, load_employee_data


@dataclass
class PlotConfig:
    """Configuration for plot styling."""
    figure_size: Tuple[int, int] = (14, 10)
    dpi: int = 300
    grid_color: str = '#2c3e50'
    grid_linewidth: float = 3.0
    background_color: str = '#f8f9fa'
    title_size: int = 16
    label_size: int = 14
    point_size: int = 120
    alpha: float = 0.8


class NineBoxVisualizer:
    """Creates enhanced visual representations of the nine-box matrix."""
    
    def __init__(self, config: NineBoxConfig = None, plot_config: PlotConfig = None):
        self.matrix = NineBoxMatrix(config)
        self.plot_config = plot_config or PlotConfig()
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
    
    def create_matplotlib_chart(self, employees_data: List[Dict[str, Any]], 
                              save_path: Optional[str] = None,
                              show_names: bool = True) -> plt.Figure:
        """Create a clean, consistent 9-box matrix chart."""
        
        # Segment employees
        segmentations = self.matrix.segment_employees(employees_data)
        
        # Create figure with fixed size and styling
        plt.style.use('default')  # Reset style
        fig, ax = plt.subplots(figsize=(14, 10), dpi=300)
        fig.patch.set_facecolor('#ffffff')
        
        # Set consistent axis limits (0-5 for both axes to show full range)
        ax.set_xlim(0, 5)
        ax.set_ylim(0, 5)
        
        # Add background grid and segments
        self._add_background_segments(ax)
        self._add_grid_lines(ax)
        self._add_segment_labels(ax)
        
        # Plot employees with improved styling
        plotted_segments = set()
        for seg in segmentations:
            color = self.segment_colors.get(seg.segment_label.value, '#666666')
            segment_name = self._get_short_segment_name(seg.segment_label.value)
            
            # Only add to legend if not already plotted
            label = segment_name if segment_name not in plotted_segments else ""
            if label:
                plotted_segments.add(segment_name)
            
            # Plot point with enhanced styling
            ax.scatter(seg.performance_rating, seg.potential_rating,
                      c=color, s=120, alpha=0.85, 
                      edgecolors='white', linewidth=2.5,
                      label=label, zorder=10)
            
            # Add employee name with better styling
            if show_names:
                ax.annotate(seg.employee_name.split('_')[0],  # Remove suffix if present
                           (seg.performance_rating, seg.potential_rating),
                           xytext=(10, 10), textcoords='offset points',
                           fontsize=8, fontweight='bold', 
                           bbox=dict(boxstyle="round,pad=0.3", facecolor='white', 
                                   edgecolor='gray', alpha=0.9),
                           zorder=11)
        
        # Style the chart
        self._style_chart(ax)
        
        # Add legend
        self._add_legend(ax)
        
        # Final layout adjustments
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight', 
                       facecolor='white', edgecolor='none',
                       pad_inches=0.2)
            print(f"Enhanced chart saved to: {save_path}")
        
        return fig
    
    def _add_background_segments(self, ax):
        """Add subtle background colors for each 9-box segment."""
        # Get thresholds
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Get thresholds for meaningful segmentation
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Define segment areas using actual thresholds
        segments = [
            # Bottom row (Low Potential: 0 to pot_low)
            (0, 0, perf_low, pot_low, '#ffebee'),        # Risk Zone
            (perf_low, 0, perf_high-perf_low, pot_low, '#f3e5f5'),   # Diligent Worker
            (perf_high, 0, 5-perf_high, pot_low, '#e8f5e8'),      # Solid Performer
            
            # Middle row (Medium Potential: pot_low to pot_high)  
            (0, pot_low, perf_low, pot_high-pot_low, '#fff3e0'),           # Inconsistent
            (perf_low, pot_low, perf_high-perf_low, pot_high-pot_low, '#e3f2fd'),  # Core
            (perf_high, pot_low, 5-perf_high, pot_high-pot_low, '#e8f5e8'),     # Consistent
            
            # Top row (High Potential: pot_high to 5)
            (0, pot_high, perf_low, 5-pot_high, '#fff8e1'),            # Enigma
            (perf_low, pot_high, perf_high-perf_low, 5-pot_high, '#e8f5e8'),   # Emerging
            (perf_high, pot_high, 5-perf_high, 5-pot_high, '#e8f5e8'),      # Star
        ]
        
        for x, y, width, height, color in segments:
            rect = patches.Rectangle((x, y), width, height, 
                                   facecolor=color, alpha=0.15, zorder=1)
            ax.add_patch(rect)
    
    def _add_grid_lines(self, ax):
        """Add clean, consistent grid lines with equal visual divisions."""
        # Get actual thresholds from matrix config for meaningful segmentation
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Add thick division lines using actual thresholds
        ax.axvline(x=perf_low, color='#2c3e50', linewidth=3, alpha=0.8, zorder=5)
        ax.axvline(x=perf_high, color='#2c3e50', linewidth=3, alpha=0.8, zorder=5)
        ax.axhline(y=pot_low, color='#2c3e50', linewidth=3, alpha=0.8, zorder=5)
        ax.axhline(y=pot_high, color='#2c3e50', linewidth=3, alpha=0.8, zorder=5)
        
        # Add subtle grid
        ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.8, color='#95a5a6', zorder=2)
    
    def _add_segment_labels(self, ax):
        """Add clean segment labels to each box."""
        # Get thresholds for meaningful segmentation
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Calculate center positions based on actual thresholds
        x_positions = [
            perf_low / 2,                    # Low performance center
            (perf_low + perf_high) / 2,      # Medium performance center
            (perf_high + 5) / 2              # High performance center
        ]
        
        y_positions = [
            pot_low / 2,                     # Low potential center
            (pot_low + pot_high) / 2,        # Medium potential center
            (pot_high + 5) / 2               # High potential center
        ]
        
        # Clean, short labels
        labels = [
            ['Risk\nZone', 'Diligent\nWorker', 'Solid\nPerformer'],
            ['Inconsistent\nPlayer', 'Core\nContributor', 'Consistent\nPerformer'],
            ['Enigma', 'Emerging\nTalent', 'Star']
        ]
        
        # Add labels
        for i, y_pos in enumerate(y_positions):
            for j, x_pos in enumerate(x_positions):
                ax.text(x_pos, y_pos, labels[i][j],
                       ha='center', va='center', fontsize=11, fontweight='bold',
                       alpha=0.5, zorder=3,
                       bbox=dict(boxstyle="round,pad=0.4", facecolor='white', 
                               edgecolor='none', alpha=0.8))
    
    def _style_chart(self, ax):
        """Apply consistent styling to the chart."""
        # Axis labels and title
        ax.set_xlabel('Performance Rating →', fontsize=14, fontweight='bold', 
                     color='#2c3e50')
        ax.set_ylabel('Potential Rating →', fontsize=14, fontweight='bold', 
                     color='#2c3e50')
        ax.set_title('Nine-Box Matrix: Employee Performance vs Potential', 
                    fontsize=18, fontweight='bold', color='#2c3e50', pad=25)
        
        # Set clean ticks
        ax.set_xticks([0, 1, 2, 3, 4, 5])
        ax.set_yticks([0, 1, 2, 3, 4, 5])
        ax.tick_params(axis='both', labelsize=12, colors='#2c3e50')
        
        # Style spines
        for spine in ax.spines.values():
            spine.set_linewidth(1.5)
            spine.set_color('#2c3e50')
        
        ax.set_facecolor('#ffffff')
        
        # Add some spacing around the plot
        plt.subplots_adjust(left=0.1, bottom=0.1, right=0.85, top=0.9)
    
    def _add_legend(self, ax):
        """Add a clean legend."""
        handles, labels = ax.get_legend_handles_labels()
        if handles:
            # Remove duplicates and sort
            by_label = dict(zip(labels, handles))
            sorted_items = sorted(by_label.items())
            
            legend = ax.legend([item[1] for item in sorted_items], 
                             [item[0] for item in sorted_items],
                             bbox_to_anchor=(1.02, 1), loc='upper left',
                             frameon=True, fancybox=True, shadow=True,
                             fontsize=10, title="Employee Segments",
                             title_fontsize=12)
            
            # Style legend
            legend.get_frame().set_facecolor('#ffffff')
            legend.get_frame().set_edgecolor('#bdc3c7')
            legend.get_frame().set_alpha(0.95)
            legend.get_title().set_color('#2c3e50')
    
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
    """Demo the enhanced visualizer."""
    # Load sample data (you can modify this to use your MongoDB data)
    employees = load_employee_data("data/sample_employee_data.json")
    
    # Create enhanced visualizer
    visualizer = NineBoxVisualizer()
    
    print("Creating enhanced nine-box matrix visualization...")
    
    # Create the enhanced chart
    fig = visualizer.create_matplotlib_chart(
        employees, 
        save_path="visuals/enhanced_nine_box_matrix.png",
        show_names=True
    )
    
    plt.show()
    print("Enhanced visualization complete!")


if __name__ == "__main__":
    main()