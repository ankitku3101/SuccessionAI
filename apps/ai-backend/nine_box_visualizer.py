"""
Nine-Box Matrix Visualization Module

This module creates visual representations of the 9-box matrix with employee data
using matplotlib and plotly for both static and interactive charts.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import json
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
    # Create dummy classes for type hints when plotly is not available
    if TYPE_CHECKING:
        import plotly.graph_objects as go

from nine_box_matrix import NineBoxMatrix, NineBoxConfig, load_employee_data


@dataclass
class PlotConfig:
    """Configuration for plot styling."""
    figure_size: Tuple[int, int] = (12, 10)
    dpi: int = 300
    grid_color: str = '#cccccc'
    grid_linewidth: float = 1.5
    background_color: str = '#f8f9fa'
    title_size: int = 16
    label_size: int = 12
    point_size: int = 100
    alpha: float = 0.7


class NineBoxVisualizer:
    """Creates visual representations of the nine-box matrix."""
    
    def __init__(self, config: NineBoxConfig = None, plot_config: PlotConfig = None):
        self.matrix = NineBoxMatrix(config)
        self.plot_config = plot_config or PlotConfig()
        self.segment_colors = self._define_segment_colors()
        
    def _define_segment_colors(self) -> Dict[str, str]:
        """Define colors for each segment in the 9-box matrix."""
        return {
            # High Potential Row (Green tones)
            "Star (High Potential, High Performance)": "#2E8B57",  # Sea Green
            "Emerging Talent (High Potential, Medium Performance)": "#90EE90",  # Light Green
            "Enigma (High Potential, Low Performance)": "#FFD700",  # Gold
            
            # Medium Potential Row (Blue tones)
            "Consistent Performer (Medium Potential, High Performance)": "#4169E1",  # Royal Blue
            "Core Contributor (Medium Potential, Medium Performance)": "#87CEEB",  # Sky Blue
            "Inconsistent Player (Medium Potential, Low Performance)": "#FFA500",  # Orange
            
            # Low Potential Row (Red/Gray tones)
            "Solid Performer (Low Potential, High Performance)": "#9370DB",  # Medium Purple
            "Diligent Worker (Low Potential, Medium Performance)": "#D3D3D3",  # Light Gray
            "Risk Zone (Low Potential, Low Performance)": "#DC143C",  # Crimson
        }
    
    def create_matplotlib_chart(self, employees_data: List[Dict[str, Any]], 
                              save_path: Optional[str] = None,
                              show_names: bool = True) -> plt.Figure:
        """Create a static 9-box matrix chart using matplotlib."""
        
        # Segment employees
        segmentations = self.matrix.segment_employees(employees_data)
        
        # Create figure and axis
        fig, ax = plt.subplots(figsize=self.plot_config.figure_size, 
                              dpi=self.plot_config.dpi)
        fig.patch.set_facecolor(self.plot_config.background_color)
        ax.set_facecolor('white')
        
        # Plot grid lines for 9-box matrix
        self._add_grid_lines(ax)
        
        # Plot employees
        plotted_segments = set()
        for seg in segmentations:
            color = self.segment_colors.get(seg.segment_label.value, '#666666')
            segment_name = seg.segment_label.value
            
            # Only add to legend if not already plotted
            label = segment_name if segment_name not in plotted_segments else ""
            if label:
                plotted_segments.add(segment_name)
            
            # Plot point
            ax.scatter(seg.performance_rating, seg.potential_rating,
                      c=color, s=self.plot_config.point_size, 
                      alpha=self.plot_config.alpha, 
                      edgecolors='black', linewidth=1,
                      label=label)
            
            # Add employee name if requested
            if show_names:
                ax.annotate(seg.employee_name, 
                           (seg.performance_rating, seg.potential_rating),
                           xytext=(5, 5), textcoords='offset points',
                           fontsize=9, alpha=0.8)
        
        # Customize axes
        ax.set_xlabel('Performance Rating', fontsize=self.plot_config.label_size, fontweight='bold')
        ax.set_ylabel('Potential Rating', fontsize=self.plot_config.label_size, fontweight='bold')
        ax.set_title('Nine-Box Matrix: Employee Performance vs Potential', 
                    fontsize=self.plot_config.title_size, fontweight='bold', pad=20)
        
        # Set axis limits with some padding
        perf_ratings = [seg.performance_rating for seg in segmentations]
        pot_ratings = [seg.potential_rating for seg in segmentations]
        
        ax.set_xlim(min(perf_ratings) - 0.2, max(perf_ratings) + 0.2)
        ax.set_ylim(min(pot_ratings) - 0.2, max(pot_ratings) + 0.2)
        
        # Add grid labels
        self._add_grid_labels(ax)
        
        # Add legend
        handles, labels = ax.get_legend_handles_labels()
        if handles:
            # Remove duplicate labels
            by_label = dict(zip(labels, handles))
            ax.legend(by_label.values(), by_label.keys(), 
                     loc='center left', bbox_to_anchor=(1, 0.5),
                     fontsize=10)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=self.plot_config.dpi, bbox_inches='tight')
            print(f"Chart saved to: {save_path}")
        
        return fig
    
    def create_plotly_chart(self, employees_data: List[Dict[str, Any]], 
                           save_path: Optional[str] = None) -> "go.Figure":
        """Create an interactive 9-box matrix chart using plotly."""
        
        if not PLOTLY_AVAILABLE:
            raise ImportError("Plotly is not installed. Install with: pip install plotly")
        
        # Segment employees
        segmentations = self.matrix.segment_employees(employees_data)
        
        # Prepare data for plotly
        data = []
        for seg in segmentations:
            data.append({
                'name': seg.employee_name,
                'performance': seg.performance_rating,
                'potential': seg.potential_rating,
                'segment': seg.segment_label.value,
                'description': seg.segment_description,
                'performance_level': seg.performance_level.value,
                'potential_level': seg.potential_level.value
            })
        
        # Create scatter plot
        fig = go.Figure()
        
        # Group by segments for better legend
        segments = {}
        for item in data:
            segment = item['segment']
            if segment not in segments:
                segments[segment] = []
            segments[segment].append(item)
        
        # Add traces for each segment
        for segment, items in segments.items():
            color = self.segment_colors.get(segment, '#666666')
            
            fig.add_trace(go.Scatter(
                x=[item['performance'] for item in items],
                y=[item['potential'] for item in items],
                mode='markers+text',
                text=[item['name'] for item in items],
                textposition='top center',
                name=segment,
                marker=dict(
                    color=color,
                    size=12,
                    opacity=0.8,
                    line=dict(width=2, color='black')
                ),
                hovertemplate='<b>%{text}</b><br>' +
                            'Performance: %{x:.1f}<br>' +
                            'Potential: %{y:.1f}<br>' +
                            'Segment: ' + segment + '<extra></extra>'
            ))
        
        # Add grid lines
        self._add_plotly_grid_lines(fig)
        
        # Update layout
        fig.update_layout(
            title={
                'text': 'Nine-Box Matrix: Employee Performance vs Potential',
                'x': 0.5,
                'xanchor': 'center',
                'font': {'size': 18}
            },
            xaxis_title='Performance Rating',
            yaxis_title='Potential Rating',
            width=900,
            height=700,
            showlegend=True,
            legend=dict(
                orientation="v",
                yanchor="middle",
                y=0.5,
                xanchor="left",
                x=1.02
            ),
            margin=dict(r=200)
        )
        
        # Add annotations for grid sections
        self._add_plotly_annotations(fig)
        
        if save_path:
            if save_path.endswith('.html'):
                fig.write_html(save_path)
            else:
                fig.write_image(save_path)
            print(f"Interactive chart saved to: {save_path}")
        
        return fig
    
    def _add_grid_lines(self, ax):
        """Add grid lines to matplotlib chart."""
        # Get thresholds
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Add vertical lines (performance thresholds)
        ax.axvline(x=perf_low, color=self.plot_config.grid_color, 
                  linewidth=self.plot_config.grid_linewidth, linestyle='--')
        ax.axvline(x=perf_high, color=self.plot_config.grid_color, 
                  linewidth=self.plot_config.grid_linewidth, linestyle='--')
        
        # Add horizontal lines (potential thresholds)
        ax.axhline(y=pot_low, color=self.plot_config.grid_color, 
                  linewidth=self.plot_config.grid_linewidth, linestyle='--')
        ax.axhline(y=pot_high, color=self.plot_config.grid_color, 
                  linewidth=self.plot_config.grid_linewidth, linestyle='--')
    
    def _add_grid_labels(self, ax):
        """Add labels to grid sections."""
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Calculate positions for labels
        xlim = ax.get_xlim()
        ylim = ax.get_ylim()
        
        x_positions = [
            (xlim[0] + perf_low) / 2,  # Low performance
            (perf_low + perf_high) / 2,  # Medium performance
            (perf_high + xlim[1]) / 2   # High performance
        ]
        
        y_positions = [
            (ylim[0] + pot_low) / 2,  # Low potential
            (pot_low + pot_high) / 2,  # Medium potential
            (pot_high + ylim[1]) / 2   # High potential
        ]
        
        # Add background rectangles and labels
        labels = [
            ['Risk Zone', 'Diligent Worker', 'Solid Performer'],
            ['Inconsistent Player', 'Core Contributor', 'Consistent Performer'],
            ['Enigma', 'Emerging Talent', 'Star']
        ]
        
        for i, y_pos in enumerate(y_positions):
            for j, x_pos in enumerate(x_positions):
                # Add subtle background
                if i == 0:  # Low potential row
                    bg_color = '#ffebee' if j == 0 else '#f3e5f5' if j == 2 else '#f5f5f5'
                elif i == 1:  # Medium potential row
                    bg_color = '#fff3e0' if j == 0 else '#e3f2fd' if j == 2 else '#e8f5e8'
                else:  # High potential row
                    bg_color = '#fff9c4' if j == 0 else '#e8f5e8' if j == 1 else '#e8f5e8'
                
                # Add label
                ax.text(x_pos, y_pos, labels[i][j], 
                       ha='center', va='center', fontsize=9, 
                       alpha=0.6, weight='bold',
                       bbox=dict(boxstyle='round,pad=0.3', facecolor=bg_color, alpha=0.5))
    
    def _add_plotly_grid_lines(self, fig):
        """Add grid lines to plotly chart."""
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Add vertical lines
        fig.add_vline(x=perf_low, line_dash="dash", line_color="gray", opacity=0.5)
        fig.add_vline(x=perf_high, line_dash="dash", line_color="gray", opacity=0.5)
        
        # Add horizontal lines
        fig.add_hline(y=pot_low, line_dash="dash", line_color="gray", opacity=0.5)
        fig.add_hline(y=pot_high, line_dash="dash", line_color="gray", opacity=0.5)
    
    def _add_plotly_annotations(self, fig):
        """Add section labels to plotly chart."""
        perf_low = self.matrix.config.performance_low_threshold
        perf_high = self.matrix.config.performance_high_threshold
        pot_low = self.matrix.config.potential_low_threshold
        pot_high = self.matrix.config.potential_high_threshold
        
        # Calculate positions (approximate)
        x_positions = [perf_low - 0.3, (perf_low + perf_high) / 2, perf_high + 0.3]
        y_positions = [pot_low - 0.3, (pot_low + pot_high) / 2, pot_high + 0.3]
        
        labels = [
            ['Risk Zone', 'Diligent Worker', 'Solid Performer'],
            ['Inconsistent Player', 'Core Contributor', 'Consistent Performer'],
            ['Enigma', 'Emerging Talent', 'Star']
        ]
        
        for i, y_pos in enumerate(y_positions):
            for j, x_pos in enumerate(x_positions):
                fig.add_annotation(
                    x=x_pos, y=y_pos,
                    text=labels[i][j],
                    showarrow=False,
                    font=dict(size=10, color="gray"),
                    opacity=0.6
                )
    
    def generate_summary_chart(self, employees_data: List[Dict[str, Any]], 
                             save_path: Optional[str] = None) -> plt.Figure:
        """Generate a summary chart showing distribution of employees across segments."""
        
        segmentations = self.matrix.segment_employees(employees_data)
        summary = self.matrix.get_segment_summary(segmentations)
        
        # Create figure
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        fig.patch.set_facecolor(self.plot_config.background_color)
        
        # Pie chart
        segments = list(summary.keys())
        counts = list(summary.values())
        colors = [self.segment_colors.get(seg, '#666666') for seg in segments]
        
        wedges, texts, autotexts = ax1.pie(counts, labels=None, autopct='%1.1f%%', 
                                          colors=colors, startangle=90)
        ax1.set_title('Employee Distribution by Segment', fontweight='bold', fontsize=14)
        
        # Bar chart
        bars = ax2.bar(range(len(segments)), counts, color=colors, alpha=0.8)
        ax2.set_xlabel('Segments', fontweight='bold')
        ax2.set_ylabel('Number of Employees', fontweight='bold')
        ax2.set_title('Employee Count by Segment', fontweight='bold', fontsize=14)
        ax2.set_xticks(range(len(segments)))
        ax2.set_xticklabels([seg.split('(')[0].strip() for seg in segments], rotation=45, ha='right')
        
        # Add value labels on bars
        for bar, count in zip(bars, counts):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.05,
                    f'{count}', ha='center', va='bottom', fontweight='bold')
        
        # Add legend for pie chart
        ax1.legend(wedges, [seg.split('(')[0].strip() for seg in segments],
                  title="Segments", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=self.plot_config.dpi, bbox_inches='tight')
            print(f"Summary chart saved to: {save_path}")
        
        return fig


def main():
    """Demo function to create visualizations."""
    # Load sample data
    employees = load_employee_data("data/sample_employee_data.json")
    
    # Create visualizer
    visualizer = NineBoxVisualizer()
    
    print("Creating nine-box matrix visualizations...")
    
    # Create matplotlib chart
    print("\n1. Creating static chart with matplotlib...")
    fig_static = visualizer.create_matplotlib_chart(
        employees, 
        save_path="nine_box_matrix_static.png",
        show_names=True
    )
    plt.show()
    
    # Create plotly chart if available
    if PLOTLY_AVAILABLE:
        print("\n2. Creating interactive chart with plotly...")
        fig_interactive = visualizer.create_plotly_chart(
            employees,
            save_path="nine_box_matrix_interactive.html"
        )
        fig_interactive.show()
    else:
        print("\n2. Plotly not available. Install with: pip install plotly")
    
    # Create summary chart
    print("\n3. Creating summary distribution chart...")
    fig_summary = visualizer.generate_summary_chart(
        employees,
        save_path="nine_box_summary.png"
    )
    plt.show()
    
    print("\nVisualization complete!")


if __name__ == "__main__":
    main()