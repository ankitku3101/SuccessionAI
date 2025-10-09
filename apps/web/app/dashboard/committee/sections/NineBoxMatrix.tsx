import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';

// --- Interfaces (from original code) ---

interface Employee {
  id: string;
  name: string;
  x: number;
  y: number;
  segment: string;
  segment_full: string;
  color: string;
  performance_level: string;
  potential_level: string;
  description: string;
}

interface Segment {
  name: string;
  full_name: string;
  bounds: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  background_color: string;
  color: string;
  position: {
    x: string;
    y: string;
  };
}

interface GridConfig {
  axis_limits: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  thresholds: {
    performance_low: number;
    performance_high: number;
    potential_low: number;
    potential_high: number;
  };
  grid_lines: Array<{
    type: string;
    value: number;
    style: string;
  }>;
}

interface ChartStyling {
  title: string;
  x_axis_label: string;
  y_axis_label: string;
  colors: Record<string, string>;
  point_size: number;
  grid_color: string;
  grid_alpha: number;
  major_grid_color: string;
  major_grid_width: number;
}

interface ApiData {
  employees: Employee[];
  grid_config: GridConfig;
  segments: Segment[];
  segment_summary: Record<string, number>;
  chart_styling: ChartStyling;
  metadata: {
    total_employees: number;
    chart_type: string;
    data_source: string;
    timestamp: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApiData;
}

// --- Main Component ---

export default function NineBoxMatrix() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const colors = {
    background: isDarkMode ? "#0B0B0B" : "#FFFFFF",
    foreground: isDarkMode ? "#EAEAEA" : "#1A1A1A",
    mutedForeground: isDarkMode ? "#9CA3AF" : "#4B5563",
    destructive: isDarkMode ? "#F87171" : "#B91C1C",
  };

  useEffect(() => {
    const updateTheme = () => {
        const hasDarkClass = document.documentElement.classList.contains('dark');
        setIsDarkMode(hasDarkClass);
    };

    // Set initial theme
    updateTheme();

    // Observe changes to the class attribute of the html element
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                updateTheme();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true
    });

    // Fetch data
    fetch('http://localhost:8000/visualize/data') 
      .then(res => res.json())
      .then((result: ApiResponse) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to load data from API.');
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error("Fetch error:", err);
        setError("Could not connect to the API. Please check the console for details.");
        setLoading(false);
      });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);
  
  const { traces, layout } = useMemo(() => {
    if (!data) return { traces: [], layout: {} };

    const { grid_config: config, chart_styling: styling, segments, employees } = data;
    
    // Group employees by segment
    const employeeGroups = employees.reduce((acc, emp) => {
      const key = emp.segment_full || emp.segment || 'Unknown';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(emp);
      return acc;
    }, {} as Record<string, Employee[]>);

    // Create traces for each segment
    const traces = Object.entries(employeeGroups).map(([segment, employees]) => {
      const color = employees[0]?.color || '#999999';
      return {
        x: employees.map(e => e.x),
        y: employees.map(e => e.y),
        text: employees.map(e => e.name),
        mode: 'markers' as const,
        type: 'scatter' as const,
        marker: {
          size: 8,
          color: color,
          line: { width: 1, color: colors.background } // DARK MODE FIX: Use main background for contrast
        },
        name: employees[0]?.segment || segment,
        hovertemplate: '<b>%{text}</b><br>Performance: %{x:.2f}<br>Potential: %{y:.2f}<extra></extra>'
      };
    });

    // Create shapes for segment backgrounds
    const shapes = [
      ...segments.map(seg => ({
        type: 'rect' as const,
        x0: seg.bounds.x_min,
        x1: seg.bounds.x_max,
        y0: seg.bounds.y_min,
        y1: seg.bounds.y_max,
        fillcolor: seg.color,
        line: { width: 1, color: colors.background },
        opacity: isDarkMode ? 0.4 : 0.25,
        layer: 'below' as const,
      })),
    ];

    const annotations = segments.map(seg => ({
      x: (seg.bounds.x_min + seg.bounds.x_max) / 2,
      y: (seg.bounds.y_min + seg.bounds.y_max) / 2,
      text: `<b>${seg.name}</b><br>${data.segment_summary[seg.full_name] || 0} employees`,
      showarrow: false,
      font: { 
        size: 11, 
        color: colors.destructive ,
        family: 'Inter, sans-serif' 
      },
    }));

    const layout = {
      title: {
          text: styling?.title || 'Nine-Box Matrix',
          font: { 
            family: 'Inter, sans-serif', 
            size: 24, 
            color: colors.foreground
          },
          x: 0.5,
          xanchor: 'center',
      },
      xaxis: {
        title: {
            text: styling?.x_axis_label || 'Performance',
            font: { family: 'Inter, sans-serif', size: 14, color: colors.mutedForeground }
        },
        range: [config.axis_limits.x_min, config.axis_limits.x_max],
        showgrid: false,
        zeroline: false,
        showline: false,
        ticks: '',
        showticklabels: false,
      },
      yaxis: {
        title: {
            text: styling?.y_axis_label || 'Potential',
            font: { family: 'Inter, sans-serif', size: 14, color: colors.mutedForeground }
        },
        range: [config.axis_limits.y_min, config.axis_limits.y_max],
        showgrid: false,
        zeroline: false,
        showline: false,
        ticks: '',
        showticklabels: false,
      },
      shapes: shapes,
      annotations: annotations,
      legend: { 
        orientation: 'h' as const,
        yanchor: 'bottom',
        y: -0.2,
        xanchor: 'center',
        x: 0.5,
        font: { color: colors.mutedForeground },
        bgcolor: 'transparent',
      },
      margin: { t: 80, b: 120, l: 60, r: 60 },
      height: 700,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      hovermode: 'closest' as const,
      showlegend: true
    };

    return { traces, layout };

  }, [data, isDarkMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)] text-lg">Loading Employee Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-[var(--card)] p-8 rounded-lg shadow-lg max-w-md text-center border border-[var(--border)]">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Data</h2>
          <p className="text-[var(--foreground)]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--muted-foreground)]">No data available to display.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card rounded-xl shadow-lg border border-[var(--border)] p-2 sm:p-4">
            <Plot
              data={traces as any}
              layout={layout as any}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
  );
}

