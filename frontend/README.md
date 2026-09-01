# Anveshaka Frontend

Modern web frontend for the **Anveshaka** autonomous research agent. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- **Aurora Dark Theme**: Sleek Linear/Vercel-inspired UI with custom gradients and glassmorphism.
- **Live Pipeline Tracker**: 6-stage real-time progress visualization connected to the backend via Server-Sent Events (SSE).
- **Interactive Research Dashboard**: Live activity feed, sub-question facet tracking, and markdown report rendering with inline citations.
- **Report Viewer**: Detailed report reader with sticky Table of Contents, word count, citation count, and PDF/copy/share actions.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional, defaults to `http://localhost:8000`):
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Build for Production

```bash
npm run build
npm run start
```
