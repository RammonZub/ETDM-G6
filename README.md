# London Restaurant Recommender

An end-to-end recommendation system for London restaurants, built for interactive search and ranking based on natural-language user intent.

The project combines:
- A Python recommendation engine
- A FastAPI backend service
- A Next.js frontend with chat and map-based exploration

## Project Scope

The application:
- Loads precomputed restaurant scoring data from `london_restaurant_scores.csv` (1,833 venues)
- Interprets natural-language preferences (for example: cuisine type, budget intent, and review thresholds)
- Maps user intent to recommendation profiles such as `best_value`, `romantic_date`, and `quick_bites`
- Returns ranked recommendations with explanations and supporting snippets
- Displays results in a browser-based UI with map markers

## Repository Structure

- `api/`
  - `main.py`: FastAPI application, query parsing logic, recommendation endpoints, geocoding, and CORS configuration
  - `requirements.txt`: backend Python dependencies
- `web/`
  - Next.js frontend (`app/`, `components/`, `lib/`) for the chat and map interface
  - Backend API integration in `web/lib/api.ts`
- `recommender_v2.py`
  - Primary recommendation engine used by the API
  - Includes preference profiles, weighted scoring, filtering, confidence blending, and ranking logic
- `recommender.py`
  - Earlier engine version kept for compatibility (current tests import this module)
- `test_recommender.py`
  - Python test script with synthetic scenarios for ranking and filtering validation
- `london_restaurant_scores.csv`
  - Runtime data source for restaurant scoring and metadata

## System Workflow

1. A user submits a natural-language query in the frontend.
2. The frontend sends `POST /recommend` to the backend (`http://localhost:8000`).
3. The backend extracts structured intent, including:
   - preference tags (for example, `best_value` and `quick_bites`)
   - optional cuisine filters
   - minimum review count
   - requested number of results (`top_n`)
4. The backend calls `RestaurantRecommender` in `recommender_v2.py`.
5. If strict constraints return no results, the backend progressively relaxes filters.
6. The API returns ranked recommendations with score details, parsed intent, and explanation notes.
7. The frontend renders recommendation cards and map markers.

## Prerequisites

- Node.js and npm
- Python 3.10 or newer

Check installed versions:

```bash
node -v
npm -v
python3 --version
```

## Local Setup and Execution

Use two terminals: one for the backend and one for the frontend.

### 1) Start the backend (FastAPI on port 8000)

```bash
cd "/Users/ramonzubiagasuarez/Desktop/IE/Y5S2/Emerging Topics in Data Analysis & Management/final-project/api"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response shape:

```json
{"status":"ok","restaurants":1833}
```

### 2) Start the frontend (Next.js on port 3000)

```bash
cd "/Users/ramonzubiagasuarez/Desktop/IE/Y5S2/Emerging Topics in Data Analysis & Management/final-project/web"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

From the repository root:

```bash
python3 test_recommender.py
```

This test script generates synthetic cases and validates key ranking and filtering behavior.

## API Endpoints

Base URL: `http://localhost:8000`

- `GET /health`: Service health and loaded restaurant count
- `POST /recommend`: Recommendation endpoint for natural-language requests
- `GET /preferences`: Available preference profiles
- `GET /cuisines`: Available cuisine values

Example request:

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"Quick bites British restaurant, budget-friendly, 200+ reviews"}'
```

## Troubleshooting

- Frontend message: _"couldn't connect to the recommendation engine"_
  - Cause: backend is not running on port `8000`
  - Resolution: start `uvicorn` in `api/` and verify `GET /health`

- No strict matches returned for a query
  - Behavior: backend automatically relaxes constraints (for example, review threshold or preference narrowing) and provides an explanatory note

- Browser CORS errors
  - Check: ensure allowed frontend origin includes `http://localhost:3000` in `api/main.py`

## Local Development Defaults

- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:8000`
- Frontend API base is defined in `web/lib/api.ts`

