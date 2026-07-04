<div align="center">

# Smart Office IoT Monitor
### *Sense it. Stream it. Act on it.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Discord.py](https://img.shields.io/badge/Discord.py-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discordpy.readthedocs.io/)

<p align="center">
  <strong>A real-time smart office energy and device-monitoring platform</strong><br>
  <em>FastAPI backend + React dashboard + Discord bot sharing one live IoT state store</em>
</p>

---

</div>

## Team

**DU_AlgoArchitects**

| # | Member |
|---|--------|
| 1 | Md. Jahidul Islam Sarkar |
| 2 | Shadman Zaman Sajid |
| 3 | Md. Irfan Iqbal |
| 4 | Swarlok Samadder |

## Project Links

| Service | URL |
|---------|-----|
| Dashboard | [https://iot-smart-home-dashboard.onrender.com](https://iot-smart-home-dashboard.onrender.com) |
| Backend | [https://iot-smart-home-backend-8au0.onrender.com](https://iot-smart-home-backend-8au0.onrender.com) |
| Swagger UI | [https://iot-smart-home-backend-8au0.onrender.com/docs](https://iot-smart-home-backend-8au0.onrender.com/docs) |
| Bot Service | [https://iot-smart-home-bot.onrender.com](https://iot-smart-home-bot.onrender.com) |
| Hardware Schematic | [https://wokwi.com/projects/468536088941998081](https://wokwi.com/projects/468536088941998081) |
| Video Demo | [https://drive.google.com/drive/folders/1tdfbYcPZ4_oGMTihkv7ReNgwHAaDRog3?fbclid=IwY2xjawS12IFleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEe9QOT6k1cN5Dx0rmuqPwGhSnM2WRg66-5kXd65cYhiKJNKRTQbaPVlVh_RgM_aem_zeLnqgz5Wc2lrehkZGILNw](https://drive.google.com/drive/folders/1tdfbYcPZ4_oGMTihkv7ReNgwHAaDRog3?fbclid=IwY2xjawS12IFleHRuA2FlbQIxMQBzcnRjBmFwcF9pZAEwAAEe9QOT6k1cN5Dx0rmuqPwGhSnM2WRg66-5kXd65cYhiKJNKRTQbaPVlVh_RgM_aem_zeLnqgz5Wc2lrehkZGILNw) |

## Project Highlights

- **15-device IoT simulation**: 3 rooms, each with 2 fans, 3 lights.
- **Single source of truth**: all device state lives in the FastAPI in-memory store.
- **Live dashboard**: React/Vite interface receives snapshots, device updates, and alerts over WebSocket.
- **Discord operations bot**: `!status`, `!room`, and `!usage` commands read the same backend data through REST.
- **Automated alerts**: after-hours device activity and continuously active rooms are detected and broadcast.
- **Hardware-aware design**: Wokwi ESP32 circuit models relay outputs, manual switches, and current sensing.

## Introduction

Smart Office IoT Monitor was built for the IUT Techathon preliminary round. It demonstrates how an office automation system can monitor fans and lights in real time, estimate current power draw, surface actionable alerts, and expose the same state to both a web dashboard and a Discord bot.

The backend is intentionally the authority. The simulator, dashboard toggles, REST routes, WebSocket broadcasts, and bot commands all read from or mutate the same `DeviceStore` singleton in [backend/core/store.py](backend/core/store.py). This keeps the dashboard and bot synchronized without separate client-side state machines.

### Key Objectives

| Objective | Description |
|-----------|-------------|
| **Device Monitoring** | Track ON/OFF state for 15 simulated fans, lights across 3 rooms. |
| **Real-Time Visibility** | Push state changes instantly to the dashboard through WebSocket events. |
| **Power Awareness** | Estimate live watts, active devices, room-level load, and daily kWh usage. |
| **Alerting** | Flag after-hours device usage and full-room continuous-load conditions. |
| **Operational Access** | Provide Discord commands and proactive channel alerts for quick remote checks. |
| **Circuit Reasoning** | Document a realistic ESP32 relay/sensor design for physical deployment. |

---

## Key Features

<table>
<tr>
<td width="50%">

### Live Backend Simulation

- FastAPI application with REST and WebSocket APIs
- Async simulator ticks every few seconds
- Time-of-day bias for realistic ON/OFF behavior
- Pydantic models for devices, rooms, usage, and alerts
- Shared in-memory store for all consumers

</td>
<td width="50%">

### Interactive React Dashboard

- WebSocket snapshot-on-connect
- Live device toggles from the floorplan
- Power insight cards and room load bars
- Alerts panel with severity states
- Map, analytics, device, security, support, and logs views

</td>
</tr>
<tr>
<td width="50%">

### Discord Bot

- `!status` for whole-office status
- `!room drawing`, `!room work1`, `!room work2`
- `!usage` / `!power` for current load and kWh estimate
- Alert polling every minute
- Gemini primary response generation with Groq fallback keys

</td>
<td width="50%">

### Hardware Concept

- ESP32-based one-room representative circuit
- 5 relay outputs mapped to 3 lights and 2 fans
- Slide switches as manual wall-switch inputs
- Potentiometer as ACS712 current-sensor stand-in
- Wokwi simulation and circuit rationale included

</td>
</tr>
</table>

---

## System Architecture

![IoT Smart Office Monitor architecture](diagrams/architecture.png)

The architecture diagram is maintained in [diagrams/](diagrams/) with committed PNG/SVG outputs and notes in [diagrams/architecture.md](diagrams/architecture.md). A Graphviz DOT version is also included for anyone who wants a more detailed render.

### Data Flow

1. The simulator in [backend/core/simulator.py](backend/core/simulator.py) periodically changes device state.
2. The store in [backend/core/store.py](backend/core/store.py) keeps the authoritative 15-device inventory.
3. Alert checks in [backend/core/alerts.py](backend/core/alerts.py) generate warning and critical alerts.
4. REST routes in [backend/routes/devices.py](backend/routes/devices.py) expose devices, room data, usage, alerts, and toggles.
5. The WebSocket endpoint in [backend/main.py](backend/main.py) sends `snapshot`, `device_update`, and `alert` messages.
6. The React dashboard mirrors backend state and sends toggle commands.
7. The Discord bot polls REST endpoints for commands and proactive alert notifications.

---

## Tech Stack

| Layer | Technologies |
|:------|:-------------|
| **Backend** | Python 3, FastAPI, Uvicorn, Pydantic v2, WebSockets |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion, Recharts |
| **Bot** | discord.py, httpx, python-dotenv, Google Gemini API, Groq API |
| **Simulation** | Async Python simulator, in-memory store, time-of-day alert rules |
| **Hardware Design** | ESP32, Wokwi, relay logic, slide switches, ACS712-style sensing model |
| **Deployment Targets** | Render for backend/bot, Vercel for dashboard |

---

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Discord bot token, only if running the bot
- Gemini or Groq API key, optional for LLM-generated bot responses
- Graphviz, optional for regenerating the architecture diagram

### Quick Start

From the project root:

```bash
cp .env.example .env
./shell.sh
```

The script creates a backend virtual environment if needed, installs backend/frontend dependencies, and starts:

- Backend: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Dashboard: `http://localhost:3000`

It also exports local dashboard URLs so the frontend points at your local backend instead of the deployed Render backend.

### Run Services Individually

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Dashboard:

```bash
cd dashboard
npm install
npm run dev
```

For local backend integration without `./shell.sh`, set dashboard environment variables:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

Discord bot:

```bash
cd bot
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python bot.py
```

### Configuration

Copy [.env.example](.env.example) to `.env` and fill in the values you need:

```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token-here
BACKEND_API_URL=http://localhost:8000
DISCORD_ALERT_CHANNEL_ID=optional-channel-id-here
GROQ_API_KEY_1=your-groq-api-key-1-here
GROQ_API_KEY_2=your-groq-api-key-2-here
GROQ_API_KEY_3=your-groq-api-key-3-here
GEMINI_API_KEY=your-gemini-api-key-here

# Dashboard
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

If dashboard variables are unset, [dashboard/src/hooks/useBackendDevices.ts](dashboard/src/hooks/useBackendDevices.ts) falls back to the deployed Render backend.

---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Backend health, device count, and connected WebSocket clients |
| `/ws` | WebSocket | Live `snapshot`, `device_update`, `alert`, and `pong` messages |
| `/api/devices/` | GET | All 18 devices with current state |
| `/api/devices/{room}` | GET | Devices for `drawing_room`, `work_room_1`, or `work_room_2` |
| `/api/devices/{device_id}/toggle` | POST | Toggle one device and broadcast the update |
| `/api/devices/stats/usage` | GET | Total watts, active devices, room usage, and estimated kWh today |
| `/api/devices/stats/alerts?limit=20` | GET | Recent alerts, newest first |

WebSocket client toggle message:

```json
{
  "type": "toggle",
  "data": {
    "device_id": "dr_fan_1"
  }
}
```

---

## Discord Commands

| Command | Description |
|---------|-------------|
| `!status` | Summarizes all room device states. |
| `!room drawing` | Shows Drawing Room fan/light state. |
| `!room work1` | Shows Work Room 1 fan/light state. |
| `!room work2` | Shows Work Room 2 fan/light state. |
| `!usage` | Reports current watts and estimated kWh today. |
| `!power` | Alias for `!usage`. |

When Gemini or Groq keys are configured, bot responses are rewritten into short conversational summaries. If no LLM provider is available, the bot falls back to deterministic formatted responses.

---

## Project Structure

```text
project-root/
├── backend/                         # FastAPI backend and simulator
│   ├── main.py                      # App entrypoint, CORS, health, WebSocket
│   ├── requirements.txt
│   ├── core/
│   │   ├── alerts.py                # After-hours and continuous-load alert rules
│   │   ├── models.py                # Pydantic models and 18-device seed data
│   │   ├── simulator.py             # Async background device simulator
│   │   ├── store.py                 # DeviceStore singleton
│   │   └── time_utils.py
│   └── routes/
│       └── devices.py               # REST endpoints
├── dashboard/                       # React/Vite dashboard
│   ├── src/
│   │   ├── components/              # Dashboard panels, modals, floorplan, views
│   │   ├── hooks/
│   │   │   └── useBackendDevices.ts # REST + WebSocket integration
│   │   ├── App.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── bot/                             # Discord bot
│   ├── bot.py                       # Client setup, health server, alert polling
│   ├── commands.py                  # !status, !room, !usage commands
│   └── requirements.txt
├── circuit/                         # ESP32 circuit documentation
│   ├── circuit_design.md
│   └── diagram.json
├── diagrams/                        # Architecture source and rendered outputs
│   ├── architecture.dot
│   ├── architecture.md
│   ├── architecture.png
│   └── architecture.svg
├── .env.example
├── shell.sh                         # Starts backend and dashboard together
├── Hackathon Problem Statement (Preliminary Round) v1.1.pdf
└── README.md
```

---

## Demo Flow

1. Copy `.env.example` to `.env` and start the backend/dashboard with `./shell.sh`.
2. Open `http://localhost:3000` and confirm the connection badge shows `connected`.
3. Toggle a fan or light from the office floorplan.
4. Verify the power insight panel and device inventory update immediately.
5. Run `!status`, `!room drawing`, and `!usage` in Discord after starting the bot.
6. Wait for or trigger alert conditions and show the alert in both the dashboard and Discord channel.
7. Open the hardware documentation in [circuit/circuit_design.md](circuit/circuit_design.md) and the live Wokwi simulation linked there.

---

## Engineering Notes

- The backend has no database by design; state resets when the backend process restarts.
- WebSocket clients receive a full state snapshot immediately after connecting.
- Dashboard toggles prefer WebSocket and fall back to REST if the socket is unavailable.
- Alert deduplication uses a cooldown window to avoid repeated messages for the same condition.
- The bot polls alerts once per minute, so Discord proactive alerts may lag the dashboard slightly.
- The fixed inventory is enforced by seed data: 3 rooms x 5 devices = 15 devices.

---

## Additional Documentation

- [System architecture](diagrams/architecture.md)
- [Architecture DOT source](diagrams/architecture.dot)
- [Circuit design and Wokwi simulation](circuit/circuit_design.md)
- [Dashboard-specific README](dashboard/README.md)
- [Hackathon problem statement](Hackathon%20Problem%20Statement%20%28Preliminary%20Round%29%20v1.1.pdf)

---

## Future Roadmap

- Persist device history and alerts in a database.
- Add alert acknowledgement APIs and dashboard state.
- Bridge the simulator to physical ESP32 telemetry.
- Replace mock historical analytics with stored time-series data.
- Add authentication for production dashboard and bot operations.
