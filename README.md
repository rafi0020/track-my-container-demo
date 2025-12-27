# Track My Container — Whitebox Demo (Static Simulation)

This repo is a **portfolio-ready, interactive demo** that simulates the real-world Track My Container system end-to-end with **whitebox transparency**.

It is **100% static** (runs entirely in the browser) and deploys to **GitHub Pages** via Actions.

## What you get
- A “Live Demo” dashboard view:
  - Real-time event feed (fused container movement events)
  - Offline yard map (SVG) showing telemetry position
  - Container detail modal with artifacts
- A “Whitebox Transparency” view:
  - Pipeline stepper (RTSP → detect → crops → V2H → OCR → ISO → send → correlate → archive)
  - Artifacts viewer (owner crop, digits crop, paired crop, vertical crop, V2H strip)
  - State machine view
  - Structured logs console (filter by component)
  - Metrics charts (success rates, latency)
- Deterministic scenario player (seeded RNG) with 5 scenarios:
  1) Normal Daylight Capture  
  2) Vertical ID Stack  
  3) Night Glare + Polarizer Improvement  
  4) Faded Text + ISO Correction Save  
  5) RTSP Jitter + Network Retry + Backend Correlation  

## Tech
- React + Vite + TypeScript
- Zustand (lightweight, simple state)
- Tailwind CSS
- Recharts (metrics charts)
- Mermaid (diagrams rendered in-app)

## Quickstart
```bash
npm install
npm run dev
