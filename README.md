# Smart Home IoT Monitor

Smart Home IoT Monitor is a three-part IoT simulation for the IUT Techathon: a FastAPI backend, a React dashboard, and a Discord bot. The backend simulates 15 devices across three rooms, keeps all state in one in-memory store, and exposes that state to both clients so the dashboard and bot always reflect the same source of truth.

## Overview

The project is organized around a single backend state store in [backend/core/store.py](backend/core/store.py). The dashboard consumes live updates over WebSocket, while the Discord bot reads the same backend data through REST and posts proactive alert notifications to a Discord channel.

* **Single source of truth**: FastAPI backend state in [backend/core/store.py](backend/core/store.py)
* **Live dashboard**: React UI connected to [backend/main.py](backend/main.py) via `/ws`
* **Discord bot**: Command responses from REST plus proactive alert polling in [bot/bot.py](bot/bot.py)

For live deployment updates, check the deployed Backend at [Render](https://iot-smart-home-backend-8au0.onrender.com/) and the dashboard on Vercel.

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
│   ├── src/          # React components (OfficeFloorplan, PowerInsight, etc.)
│   └── package.json  # NPM dependencies
    ├── components/
    │   ├── OfficeFloorplan.tsx     # Visual 3-room layout with smart grid
    │   ├── PowerInsight.tsx        # Live wattage and kWh estimation
    │   ├── SupportModal.tsx        # Fetches dynamic /contacts
    │   └── ...                     # Other UI views
    ├── hooks/
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
GEMINI_API_KEY=your-gemini-api-key-here        # primary LLM key
GROQ_API_KEY_1=your-groq-api-key-1-here        # optional fallback key
GROQ_API_KEY_2=your-groq-api-key-2-here        # optional fallback key
GROQ_API_KEY_3=your-groq-api-key-3-here        # optional fallback key

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

## Engineering Process

As required by the problem statement, here is an outline of the engineering decisions behind the significant features of this system:

### 1. Simulated Device Layer & Backend
- **Assumptions**: The system requires simulating 15 devices across 3 rooms (2 fans + 3 lights per room). The backend must serve as the single source of truth for both the dashboard and the Discord bot.
- **Implementation Plan**: Built with FastAPI. A background async simulator randomly toggles devices based on time-of-day probabilities to simulate activity. State is kept in a centralized in-memory `device_store`.
- **Trade-offs**: An in-memory store is fast and easy to set up without external dependencies, but state is lost on restart. Given the hackathon simulation requirements, this is a pragmatic trade-off over configuring a full PostgreSQL/Redis database.
- **Validation Approach**: Verified via REST API endpoints and ensuring both the dashboard and Discord bot always reflect identical state changes in real-time.

### 2. Live Web Dashboard
- **Assumptions**: The dashboard needs to reflect real-time updates without manual page refreshes, display an active alerts panel, and visually represent device states.
- **Implementation Plan**: Built with React (Vite). Uses WebSockets to connect to the FastAPI backend, listening for instant `device_update` and `alert` events.
- **Trade-offs**: WebSockets require persistent connections, which can be slightly more complex to deploy and scale than simple HTTP polling. However, it perfectly meets the "no manual refresh" requirement with much lower latency and network overhead.
- **Validation Approach**: Tested by opening multiple dashboard tabs; toggling a device in one instantly reflects the state change across all open tabs.

### 3. Discord Bot
- **Assumptions**: The bot needs to fetch live data from the shared backend and proactively notify a channel when alerts occur. It should respond conversationally.
- **Implementation Plan**: Built with `discord.py`. Uses REST API calls (`/api/devices`, `/api/alerts`) for responding to commands (`!status`, `!usage`, `!room`). A background task polls the backend for new alerts. LLM-generated friendly responses (via a Gemini API primary and multiple Groq API fallbacks) are used to humanize the bot.
- **Trade-offs**: Polling for alerts (instead of using WebSockets for the bot) simplifies the bot architecture and avoids managing multiple persistent connection paradigms, though it introduces a slight delay in proactive alerts.
- **Validation Approach**: Tested commands in Discord to verify they fetch correct data from the backend. Triggered alert conditions in the backend and verified the bot proactively posts to the designated channel.
