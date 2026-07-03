# Smart Home IoT Monitor

Smart Home IoT Monitor is a three-part IoT simulation for the IUT Techathon: a FastAPI backend, a React dashboard, and a Discord bot. The backend simulates 15 devices across three rooms, keeps all state in one in-memory store, and exposes that state to both clients so the dashboard and bot always reflect the same source of truth.

## Overview

The project is organized around a single backend state store in [backend/core/store.py](backend/core/store.py). The dashboard consumes live updates over WebSocket, while the Discord bot reads the same backend data through REST and posts proactive alert notifications to a Discord channel.

* **Single source of truth**: FastAPI backend state in [backend/core/store.py](backend/core/store.py)
* **Live dashboard**: React UI connected to [backend/main.py](backend/main.py) via `/ws`
* **Discord bot**: Command responses from REST plus proactive alert polling in [bot/bot.py](bot/bot.py)

The architecture diagram is provided as both source and rendered output: [diagrams/architecture.dot](diagrams/architecture.dot), [diagrams/architecture.png](diagrams/architecture.png), and [diagrams/architecture.svg](diagrams/architecture.svg). The matching arrow reference table and regeneration instructions are in [diagrams/architecture.md](diagrams/architecture.md).

For the conceptual ESP32 wiring, relay logic, ACS712 current sensing, and opto-isolated feedback, see [circuit/circuit_design.md](circuit/circuit_design.md).

## 📂 Folder Structure

```text
project-root/
├── backend/          # FastAPI app (WebSocket endpoint, REST API, Async Simulator)
│   ├── main.py       # App entrypoint and connection manager
│   ├── requirements.txt
│   ├── core/         # Business logic (models, store, alerts, simulator)
│   └── routes/       # REST API endpoints
├── dashboard/        # React (Vite) frontend for live monitoring
│   ├── src/          # React components (FloorPlan, PowerMeter, etc.)
│   └── package.json  # NPM dependencies
├── bot/              # Discord.py bot
│   ├── bot.py        # Client setup and automated alert polling
│   ├── commands.py   # User commands (!status, !room, !usage)
│   └── requirements.txt
├── circuit/          # ESP32 + relay + ACS712 hardware schematic
│   └── circuit_design.md
├── diagrams/         # System architecture diagram (DOT source + rendered PNG/SVG)
│   ├── architecture.dot
│   ├── architecture.png
│   ├── architecture.svg
│   └── architecture.md
├── .env.example      # Environment variables template
├── Hackathon Problem Statement (Preliminary Round) v1.1.pdf
└── README.md         # This file
```

## Setup

Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```
The canonical template contains 8 variables:
```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token-here
BACKEND_API_URL=http://localhost:8000
DISCORD_ALERT_CHANNEL_ID=optional-channel-id-here
GROQ_API_KEY=your-groq-api-key-here            # optional; bot falls back to deterministic strings if unset

# Dashboard
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

### Backend
Requires Python 3.9+.
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend starts the simulator automatically on launch.

### Dashboard
Requires Node.js 18+.
```bash
cd dashboard
npm install
npm run dev -- --port 5173
```
Open `http://localhost:5173` to view the live dashboard.

### Discord Bot
Requires Python 3.9+.
```bash
cd bot
pip install -r requirements.txt
python bot.py
```
The bot listens for `!status`, `!room`, and `!usage`, and it polls backend alerts for proactive channel posts.

## Demo Flow

For judging or a recorded walkthrough:
1. Start the backend, dashboard, and bot in separate terminals.
2. Open the dashboard and confirm the WebSocket badge shows `connected`.
3. Toggle a device from the dashboard and verify the updated state appears immediately in the UI and in `!usage`.
4. Run `!status`, `!room drawing`, and `!usage` in Discord to confirm the bot is reading live backend data.
5. Trigger an alert condition and show the alert appear in both the dashboard and Discord.

The simulator and alert rules match the problem statement: 15 devices total, 3 rooms, 2 fans + 3 lights per room, after-hours alerts, and a continuous full-room-on rule.

---

## Codebase Notes

- **Conventional commits** are used for repository history.
- **Pydantic v2** models enforce the 15-device inventory invariant in [backend/core/models.py](backend/core/models.py).
- **WebSocket snapshot-on-connect** ensures the dashboard renders immediately without a loading flash.
- **Singleton store** is the only mutable backend state; dashboard and bot both read from it indirectly.

---

## Video Demo

A 3-minute walkthrough is included with the submission link. It demonstrates:

1. Launching the backend, dashboard, and bot side-by-side in three terminals
2. The dashboard connecting over WebSocket and rendering live device state
3. Toggling a device from the dashboard and verifying the change in Discord
4. The bot responding to `!status`, `!room drawing`, and `!usage`
5. A critical alert appearing on the dashboard and as a Discord channel notification
6. A short tour of the architecture diagram and circuit design

---
