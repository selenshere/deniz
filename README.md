# Mentor Backend (Render)

## Endpoints
- GET /health -> { ok: true }
- POST /api/mentor-feedback -> { feedback: "..." }

## Render settings (copy)
- Environment: Node
- Build Command: npm install
- Start Command: node server.js

## Environment variables
- OPENAI_API_KEY = your key (required)
- OPENAI_MODEL = gpt-4o-mini (optional)
- FRONTEND_ORIGIN = * (optional; you can set to your GitHub Pages URL later)
