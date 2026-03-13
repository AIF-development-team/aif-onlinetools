# AIF Online Tools

A web application for producing and validating AIF (Adsorption Information Format) files against standard specifications. This tool performs checks on file structure, required fields, and data consistency.

## Features

- Upload and convert multiple AIF files
- Detailed error reporting and warnings for AIF files
- Input data directly into an AIF
- Visualization of isotherms from AIF
- GDPR compliant - no data storage
- API for AIF validation and conversion
- User-friendly interface

## Tech Stack

- **Frontend**: React/Next.js with Tailwind CSS
- **Backend**: Python FastAPI
- **Deployment**: DigitalOcean App Platform / Docker Compose

## Getting Started

### Development Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd api
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run both services:
   ```bash
   # Backend
   cd api
   uvicorn main:app --reload
   
   # Frontend (in another terminal)
   npm run dev
   ```

### Docker Deployment

Build and start the containers:
```bash
docker compose up --build -d
```

For a fresh build without cache:
```bash
docker compose build --no-cache && docker compose up -d
```

## Testing

### Frontend

```bash
npm run lint                # ESLint
npm run build               # build check
```

### Backend

```bash
cd api
source venv/bin/activate
pytest tests/ -v                                # run all tests
pytest tests/test_main.py::test_health_check -v # run a single test
flake8 main.py --max-line-length 120            # lint
```

### CI

Tests run automatically via GitHub Actions on push/PR to `main` and `develop`. See `.github/workflows/ci.yml`.

## API Endpoints

- `POST /api/check-aif`: Validates an AIF file
- `POST /api/convert`: Converts formats to AIF
- `POST /api/input-to-aif`: Generates an AIF document from JSON
- `POST /api/process-aif`: Extracts plot data from an AIF file
- `GET /api/health`: Health check endpoint
