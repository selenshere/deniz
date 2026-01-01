// Render backend base URL
// IMPORTANT: GitHub Pages is static; keep API keys on the server (Render), not here.
const API_BASE_URL = "https://deniz-vazb.onrender.com";

// The frontend will try these endpoints in order until one works (HTTP 200-299).
// Update this list to match your Render app.
const ENDPOINT_CANDIDATES = [
  "/api/mentor-feedback",
  "/mentor-feedback",
  "/api/feedback",
  "/feedback",
  "/api/chat",
  "/chat"
];
