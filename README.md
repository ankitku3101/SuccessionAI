<div align="center">
  <h1>SuccessionAI: AI-powered Employee IDP Platform</h1>
  <!-- Tech Stack Badges -->
  <p>
    <img src="https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
    <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white">
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white">
    <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white"/>
    <img src="https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white">
    <img src="https://img.shields.io/badge/Groq-412991?style=for-the-badge&logo=groq&logoColor=white" />
    <img src="https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white">
    <img src="https://img.shields.io/badge/ngrok-140648?style=for-the-badge&logo=Ngrok&logoColor=white" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
    <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
  </p>
</div>

SuccessionAI is a comprehensive talent management platform that leverages artificial intelligence to identify, develop, and prepare high-potential employees for future leadership roles. The platform uses advanced analytics, gap analysis, and personalized development planning to optimize succession planning strategies.

## Architecture

This is a Turborepo monorepo containing:

```
SuccessionAI/
├── apps/
│   ├── ai-backend/         # Python FastAPI backend with AI services
│   ├── web/               # Next.js frontend application
│   └── server/            # Additional server services
├── packages/
│   ├── eslint-config/     # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/               # Shared React component library
└── turbo.json            # Turborepo configuration
```

## Key Features

### Nine-Box Matrix Analysis
- **Employee Segmentation**: Categorizes employees based on performance and potential
- **Visual Analytics**: Interactive charts and data visualization
- **Batch Processing**: Analyze multiple employees simultaneously

### AI-Powered Gap Analysis
- **Skills Gap Detection**: Identifies missing competencies for target roles
- **Performance Analysis**: Compares current vs required ratings
- **LLM Integration**: Uses Llama-3.3-70B for intelligent recommendations

### Readiness Prediction
- **ML-based Assessment**: Predicts employee readiness for role transitions
- **Multi-factor Analysis**: Considers performance, potential, skills, and experience
- **Confidence Scoring**: Provides prediction confidence levels

### Individual Development Plans (IDP)
- **Automated Generation**: Creates personalized development plans
- **Mentor Matching**: Intelligent pairing with senior employees
- **Resource Recommendations**: Curated learning materials and courses
- **Milestone Tracking**: Time-based development goals

## Technology Stack

### Backend (ai-backend)
- **Framework**: FastAPI with Python 3.8+
- **AI/ML**: Groq (Llama-3.3-70B), LangChain, scikit-learn
- **Database**: MongoDB with PyMongo
- **APIs**: RESTful endpoints with automatic OpenAPI documentation

### Frontend (web)
- **Framework**: Next.js 15+ with React 19+
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Development**: Turbopack for fast development

### Infrastructure
- **Monorepo**: Turborepo for efficient build system
- **Package Management**: npm/yarn workspaces
- **Code Quality**: ESLint, TypeScript, Prettier

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- MongoDB database
- API Keys: Groq API key for LLM features

### 1. Clone Repository
```bash
git clone https://github.com/ankitku3101/SuccessionAI.git
cd SuccessionAI
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
npm install

# Install Python backend dependencies
cd apps/ai-backend

# Windows
python -m venv myenv
myenv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Configuration

Create `.env` files in respective applications:

**apps/ai-backend/.env**
```bash
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key  # Optional for web search
API_BASE_URL=http://localhost:8000
```

### 4. Database Setup
Ensure MongoDB is running and accessible. The application expects these collections:
- `employees` - Employee profiles and data
- `success_roles` - Role definitions and requirements  
- `gap_analysis` - Gap analysis results
- `idp` - Individual Development Plans

## Development

### Start All Services
```bash
# From root directory
npm run dev
```

### Individual Services
```bash
# Backend only
cd apps/ai-backend
python main.py

# Frontend only  
cd apps/web
npm run dev

# Specific workspace
npm run dev --filter=web
```

### Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## API Endpoints

### Employee Analysis
- `POST /segment/single` - Analyze single employee segment
- `POST /segment/batch` - Batch employee segmentation
- `GET /visualize/data` - Get visualization data

### Gap Analysis
- `POST /gap-analysis` - Perform skills and performance gap analysis
- `GET /database/status` - Check database connectivity

### Readiness Assessment  
- `POST /readiness/predict` - Predict role readiness
- `POST /readiness/predict/batch` - Batch readiness prediction
- `POST /readiness/predict/manual` - Manual feature input

### IDP Generation
- `POST /idp/generate/enhanced` - Generate comprehensive development plan

## Data Models

### Employee Profile
```json
{
  "id": "string",
  "name": "string", 
  "role": "string",
  "department": "string",
  "skills": ["array"],
  "performance_rating": "float",
  "potential_rating": "float",
  "assessment_scores": {
    "technical": "int",
    "communication": "int", 
    "leadership": "int"
  }
}
```

### Success Role
```json
{
  "role": "string",
  "required_skills": ["array"],
  "required_experience": "int",
  "min_performance_rating": "float",
  "min_potential_rating": "float",
  "required_scores": {
    "technical": "int",
    "communication": "int",
    "leadership": "int"
  }
}
```

## AI Components

### Gap Analysis Agent
- **Purpose**: Identifies skill and performance gaps
- **Model**: Llama-3.3-70B via Groq
- **Fallback**: Rule-based analysis when LLM unavailable

### Readiness Prediction Model  
- **Type**: Machine Learning classifier
- **Features**: Performance, potential, skills, experience
- **Output**: Ready/Developing/Not Ready with confidence scores

### IDP Generator
- **Workflow**: Data retrieval → Gap analysis → Recommendations → Resource matching → Mentor pairing
- **Integration**: MongoDB + LLM + Web search (Tavily)

## Configuration

### MongoDB Collections Setup
```javascript
// Employee document structure
{
  "_id": ObjectId,
  "name": "string",
  "role": "string", 
  "department": "string",
  "skills": ["array"],
  "performance_rating": "number",
  "potential_rating": "number",
  "target_success_role": "string",
  "segment": "string",        // Computed field
  "readiness": "string"       // Computed field  
}
```

### Turborepo Configuration
The `turbo.json` defines build and development pipelines for efficient monorepo management.

## Testing & Quality

### Backend Testing
```bash
cd apps/ai-backend
python -m pytest
```

### Code Quality
```bash
# Lint all workspaces
npm run lint

# Type checking
npm run check-types
```

## Deployment

### Production Build
```bash
# Build all apps
npm run build

# Build specific app
npm run build --filter=web
```

### Environment Variables (Production)
Ensure all required environment variables are set in your production environment.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.

---
