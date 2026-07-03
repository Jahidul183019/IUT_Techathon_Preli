# Smart Home IoT Monitor

A comprehensive Smart Home Monitoring system built for the IUT Techathon. This project simulates a 15-device IoT network (fans and lights) distributed across three rooms. It features a FastAPI backend acting as the single source of truth, an interactive React Dashboard that visualizes real-time power consumption and device states via WebSockets, and a conversational Discord bot that allows users to check status and receive proactive anomaly alerts via REST.

## 🏗️ Architecture Overview

The system is built around a centralized, in-memory **DeviceStore** in the backend. This ensures that whether a command comes from the dashboard or the Discord bot, the state remains perfectly synchronized without divergence.

*   **Single Source of Truth**: FastAPI Backend (`backend/core/store.py`)
*   **Real-time Interface**: React Dashboard using native WebSockets (`ws://`)
*   **Conversational Interface**: Discord Bot using async REST polling (`http://`)

*(For conceptual ESP32 hardware wiring and relay logic for a physical build, see the [circuit design guidelines](circuit_design.md) if included in your repo).*

## 📂 Folder Structure

```text
project-root/
├── backend/          # FastAPI app (WebSocket endpoint, REST API, Async Simulator)
│   ├── main.py       # App entrypoint and connection manager
│   ├── core/         # Business logic (models, store, alerts, simulator)
│   └── routes/       # REST API endpoints
├── dashboard/        # React (Vite) frontend for live monitoring
│   ├── src/          # React components (FloorPlan, PowerMeter, etc.)
│   └── package.json  # NPM dependencies
├── bot/              # Discord.py bot
│   ├── bot.py        # Client setup and automated alert polling
│   └── commands.py   # User commands (!status, !room, !usage)
├── .env.example      # Environment variables template
└── README.md         # This file
```

## ⚙️ Setup & Configuration

First, copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_ALERT_CHANNEL_ID="optional_channel_id"
BACKEND_API_URL="http://localhost:8000"
VITE_WS_URL="ws://localhost:8000/ws"
```

### 1. Backend (FastAPI)
Requires Python 3.9+.
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The backend will start the simulator immediately, randomly toggling devices and generating usage data.*

### 2. Dashboard (React/Vite)
Requires Node.js 18+.
```bash
cd dashboard
npm install
npm run dev -- --port 5173
```
*Visit `http://localhost:5173` to see the live dashboard.*

### 3. Discord Bot (discord.py)
Requires Python 3.9+.
```bash
cd bot
pip install -r requirements.txt
python bot.py
```
*Invite the bot to your server. It will begin polling for alerts immediately.*

## 🚀 Running the Full Demo

To demonstrate the full power of the system during judging:
1. Start the **Backend**, **Dashboard**, and **Bot** in three separate terminal windows.
2. Open the React dashboard in your browser and have Discord open side-by-side.
3. In Discord, type `!usage` to see the current power consumption.
4. On the dashboard, click a fan or light icon to toggle it.
5. In Discord, type `!usage` again. The data will instantly reflect the change you made in the browser, proving the Single Source of Truth architecture.
6. Leave all devices ON in a single room for a few minutes (you may need to tweak `backend/core/alerts.py` to lower the threshold from 2 hours to 2 minutes for the demo).
7. Watch the red Critical Alert appear simultaneously on the dashboard and as a proactive ping in the Discord channel!

---

## 💡 Suggested Commit History for Hackathon Submission

A clean, logical commit history shows judges that your team worked methodically rather than dumping a massive zip file at the last minute. Here is a recommended structure for your Git history:

1. `init: Project scaffolding and blank component directories`
2. `feat(backend): Implement in-memory DeviceStore and Pydantic models`
3. `feat(backend): Add async simulator loop and alert detection engine`
4. `feat(backend): Expose REST endpoints and WebSocket ConnectionManager`
5. `feat(dashboard): Setup Vite/React and custom useDeviceSocket hook`
6. `feat(dashboard): Build live Device grid and Power Meter UI`
7. `feat(dashboard): Implement interactive FloorPlan SVG layout`
8. `feat(bot): Add discord.py client and alert polling loop`
9. `feat(bot): Implement !status and !usage REST commands`
10. `docs: Add architecture overview and setup instructions to README`
