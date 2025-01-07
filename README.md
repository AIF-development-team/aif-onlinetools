# AIF Online Tools

A web application for working with the Adsorption Information Format (AIF). This tool provides a collection of utilities for converting, validating, and inputting adsorption data in the AIF standard format.

## Features

- Convert experimental adsorption data to AIF format
- Validate AIF files against the schema
- Input and edit adsorption metadata
- Visualize adsorption isotherms
- Export data in various formats

## Project Structure

- `/src` - Next.js frontend dashboard
- `/api` - FastAPI backend for data processing and validation

## Getting Started

### Start the Frontend

```bash
npm install
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000)

### Start the Backend

```bash
cd api
python -m venv venv  # Create virtual environment (first time only)
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000)

## Development

- Frontend: React/Next.js dashboard application (in `/src`)
- Backend: Python FastAPI server handling data processing and validatio (in `/api`)