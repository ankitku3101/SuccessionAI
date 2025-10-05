# AI Backend - SuccessionAI

Python-based AI services for employee succession planning and talent management.

## Features

### Module 1: Nine-Box Matrix (Implemented)
- **Purpose**: Segment employees into a 3×3 grid based on Performance vs Potential ratings
- **Input**: `performance_rating`, `potential_rating` (numeric values)
- **Output**: Employee segment labels with actionable descriptions
- **Type**: Rule-based segmentation (no ML required)

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Test the Implementation
```bash
python test_nine_box.py
```

### 3. Generate Visualizations (Optional)
```bash
# Install visualization dependencies first
pip install matplotlib seaborn plotly numpy

# Test visualization data structure (no dependencies needed)
python test_visualization.py

# Generate actual charts (requires dependencies)
python nine_box_visualizer.py
```

### 4. Run FastAPI Server
```bash
python main.py
```

The API will be available at:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/

## API Endpoints

### Nine-Box Matrix Endpoints

- `GET /` - Health check
- `GET /config` - Get current segmentation thresholds
- `POST /config` - Update segmentation thresholds
- `POST /segment/single` - Segment a single employee
- `POST /segment/bulk` - Segment multiple employees
- `GET /segment/sample` - Segment sample employees from JSON file
- `GET /summary/sample` - Get segmentation summary for sample data
- `GET /visualize/sample` - Get visualization data for frontend charts
- `POST /visualize/generate` - Generate and save static charts

### Example Usage

```python
# Single employee segmentation
{
  "id": 1,
  "name": "John Doe",
  "performance_rating": 4.2,
  "potential_rating": 3.8
}

# Response
{
  "employee_id": 1,
  "employee_name": "John Doe",
  "performance_rating": 4.2,
  "potential_rating": 3.8,
  "performance_level": "High",
  "potential_level": "Medium",
  "segment_label": "Consistent Performer (Medium Potential, High Performance)",
  "segment_description": "Strong current performers. Recognize contributions and maintain engagement."
}
```

## Nine-Box Matrix Segments

| Potential \\ Performance | Low | Medium | High |
|--------------------------|-----|--------|------|
| **High** | Enigma (High Potential, Low Performance) | Emerging Talent | Star |
| **Medium** | Inconsistent Player | Core Contributor | Consistent Performer |
| **Low** | Risk Zone | Diligent Worker | Solid Performer |

## Visualization Features

The AI backend includes comprehensive visualization capabilities:

### Static Charts (matplotlib)
- **Nine-Box Scatter Plot**: Employees plotted on Performance vs Potential grid
- **Segment Distribution**: Pie and bar charts showing employee distribution
- **Grid Lines**: Visual thresholds showing Low/Medium/High boundaries
- **Color Coding**: Each segment has a distinct color for easy identification

### Interactive Charts (plotly)
- **Hover Tooltips**: Detailed employee information on hover
- **Zoom & Pan**: Navigate large datasets easily
- **Export Options**: Save as PNG, HTML, or PDF
- **Legend Filtering**: Click to show/hide segments

### Chart Types Generated
1. `nine_box_matrix_static.png` - Main scatter plot with employee positions
2. `nine_box_summary.png` - Distribution charts (pie + bar)
3. `nine_box_matrix_interactive.html` - Interactive web-based chart

### API Endpoints for Visualization
- `GET /visualize/sample` - Returns JSON data for frontend charting
- `POST /visualize/generate` - Generates and saves chart files

### Sample Output
```
High Potential    │ Enigma      │ Emerging Talent │ Star (4 employees)
Medium Potential  │ Inconsistent│ Core Contributor│ Consistent Performer
Low Potential     │ Risk Zone   │ Diligent Worker │ Solid Performer
                    Low Performance → High Performance
```

## Configuration

Default thresholds:
- Performance: Low < 3.5, Medium 3.5-4.0, High > 4.0
- Potential: Low < 3.5, Medium 3.5-4.0, High > 4.0

Thresholds are configurable via the `/config` endpoint.

## Files Structure

```
ai-backend/
├── main.py                     # FastAPI application with endpoints
├── nine_box_matrix.py          # Core nine-box matrix implementation
├── nine_box_visualizer.py      # Visualization module (charts & plots)
├── test_nine_box.py            # Comprehensive tests and examples
├── test_visualization.py       # Visualization tests (no dependencies)
├── requirements.txt            # Python dependencies
├── package.json               # Node.js package file for Turborepo
├── sample_employee_data.json  # Sample employee data
└── README.md                  # This file
```

## Integration with Frontend

The FastAPI server includes CORS middleware configured for Next.js development:
- Allowed origin: `http://localhost:3000`
- All methods and headers permitted

Frontend can fetch data like:
```javascript
// Segment sample employees
const response = await fetch('http://localhost:8000/segment/sample');
const segmentations = await response.json();

// Get summary
const summary = await fetch('http://localhost:8000/summary/sample');
const summaryData = await summary.json();
```

## Upcoming Modules

- **Module 2**: Gap Analysis (structured attribute comparison + embedding-based similarity)
- **Module 3**: Recommendation Engine (training/development suggestions)
- **Additional**: Skills embeddings, career path prediction, attrition risk modeling

## Development

Run tests:
```bash
# Test core functionality
python test_nine_box.py

# Test visualization (ASCII output, no dependencies)
python test_visualization.py

# Generate actual charts (requires matplotlib/plotly)
python nine_box_visualizer.py
```

Start development server:
```bash
python main.py
```

The server will reload automatically when files change (uvicorn with `--reload`).