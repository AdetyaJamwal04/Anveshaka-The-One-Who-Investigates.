# Anveshaka Frontend

Modern web frontend for the **Anveshaka** autonomous deep research agent. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- **Linear / Vercel-Inspired Design**: Sleek dark aesthetic with responsive layout and typography.
- **Top Navigation Bar**: Direct navigation back to the inquiry home page via the ANVESHAKA wordmark and "New Expedition" action.
- **Live Pipeline Tracker**: 6-stage real-time progress visualization connected to the FastAPI backend via Server-Sent Events (SSE).
- **Heartbeat-Resilient Streaming**: Emits and consumes background ping heartbeats (`: ping\n\n`) to prevent proxy and edge dropouts during intensive research rounds.
- **Interactive Research Dashboard**: Live activity log, sub-question facet cards, and rich markdown report rendering with inline citations.
- **Dossier Viewer**: Dedicated view with Table of Contents, word count, citation count, and export options (PDF / Markdown download).
- **Theme Support**: Seamless Dark/Light mode toggle powered by custom design tokens.

## Architecture

The frontend acts as an edge/server-side proxy for the backend:
- Browser connects to Next.js API Routes (`/api/research/stream`, `/api/reports`, `/api/health`).
- Next.js server-side proxies forward requests to the FastAPI backend service via `BACKEND_URL`, avoiding cross-origin (CORS) and firewall restrictions.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env.local` in the `frontend` folder if connecting to a custom backend (defaults to `http://127.0.0.1:8000`):
```env
BACKEND_URL=http://127.0.0.1:8000
```
> For production deployments (e.g. Cloud Run), set `BACKEND_URL` to your live Cloud Run URL (e.g., in `apphosting.yaml`).

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build & Test

```bash
# Build for production
npm run build

# Start production server locally
npm run start
```

## Deployment (Firebase App Hosting)

This frontend is configured for deployment using **Firebase App Hosting**:

1. Ensure `apphosting.yaml` has the correct live backend URL:
   ```yaml
   env:
     - variable: BACKEND_URL
       value: https://anveshaka-backend-xxxxxx.us-central1.run.app
       availability:
         - BUILD
         - RUNTIME
   ```

2. Deploy using the Firebase CLI:
   ```bash
   firebase deploy
   ```

3. Ignore rules are configured in `.firebaseignore`, `.gcloudignore`, and `firebase.json` (`apphosting.ignore`) to exclude `.next`, `node_modules`, and local secrets from being uploaded.
