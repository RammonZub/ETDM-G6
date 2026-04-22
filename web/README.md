# Web Frontend

This directory contains the Next.js frontend for the London Restaurant Recommender project.

## Purpose

The frontend provides:
- A chat-style interface for natural-language restaurant queries
- Map-based visualization of recommendation results
- Integration with the FastAPI backend recommendation endpoints

## Development Setup

From the `web/` directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend Dependency

The frontend expects the backend API to be available at `http://localhost:8000`.

If the backend is not running, recommendation requests from the UI will fail.

## Key Locations

- `app/`: Next.js App Router pages and layouts
- `components/`: Reusable UI components
- `lib/api.ts`: API client configuration and backend request helpers

## Notes

- This frontend is part of a larger full-stack project and should be run together with the backend for full functionality.
- For complete project setup, refer to the repository root `README.md`.
