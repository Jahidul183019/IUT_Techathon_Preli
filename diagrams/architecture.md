# System Architecture — IoT Smart Home Monitor

## Overview

A real-time IoT monitoring platform with **15 simulated devices** across 3 rooms, a **FastAPI backend** as the single source of truth, and two consumer interfaces (React dashboard + Discord bot) that stay in sync via a shared WebSocket broadcast channel.

---

## Component Breakdown

### 1. Simulated Device Layer (inside backend process)

| Room | Fans | Lights | Total |
|------|------|--------|-------|
| Drawing Room | 2 | 3 | 5 |
| Work Room 1 | 2 | 3 | 5 |
| Work Room 2 | 2 | 3 | 5 |

- **Not** a separate service — runs as an `asyncio` background task inside the FastAPI process.
- The simulator loop ticks every N seconds:
  1. Randomly picks a device
  2. Flips its state (`on` ↔ `off`) or adjusts power consumption
  3. Writes the new state to the **in-memory store**
  4. Calls the **broadcast function** to push a `device_update` event to all WebSocket clients
  5. Checks alert thresholds (e.g., power > limit) → if triggered, broadcasts an `alert` event

### 2. FastAPI Backend (single process, single source of truth)

```
backend/
├── main.py              ← app entry, lifespan, WS endpoint
├── core/
│   ├── models.py        ← Pydantic: Device, Room, Alert, UsageStats
│   ├── store.py         ← InMemoryStore singleton (the SSOT)
│   ├── simulator.py     ← async loop that mutates store + broadcasts
│   └── alerts.py        ← threshold engine, generates Alert objects
└── routes/
    └── devices.py       ← REST endpoints
```

**REST API (HTTP — request/response)**

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/health` | GET | `{"status": "ok"}` |
| `/api/devices` | GET | All 15 devices with current state |
| `/api/devices/{room}` | GET | Devices filtered by room slug |
| `/api/devices/{id}/toggle` | POST | Toggle a specific device, returns new state |
| `/api/usage` | GET | Per-room and total power/energy stats |
| `/api/alerts` | GET | List of recent alerts |

**WebSocket Endpoint (`/ws`)**

- Accepts connections from **any** client (dashboard, bot, or future clients)
- On connect: sends a `snapshot` message with full device state
- On store mutation: broadcasts to **all** connected clients
- Message format (JSON):

```json
// Server → Client
{"event": "snapshot",       "data": { "devices": [...], "usage": {...} }}
{"event": "device_update",  "data": { "device_id": "dr_fan_1", "state": "on", "power": 45.2 }}
{"event": "alert",          "data": { "device_id": "wr1_light_2", "message": "...", "severity": "critical" }}

// Client → Server (dashboard only)
{"event": "toggle",         "data": { "device_id": "dr_fan_1" }}
```

### 3. React Dashboard (Vite)

- Connects to `ws://backend/ws` on mount
- Receives `snapshot` → renders initial state
- Receives `device_update` → patches local React state for that device
- Receives `alert` → shows toast notification
- User clicks toggle → sends `{"event": "toggle", ...}` over WS → backend mutates store → broadcasts `device_update` back to **all** clients (including this one)
- Also can call REST endpoints for historical data (`GET /api/usage`)

### 4. Discord Bot (discord.py)

- **REST consumer**: calls `GET /api/devices`, `GET /api/usage`, `POST /api/devices/{id}/toggle` via `aiohttp`
- **WebSocket listener**: connects to `ws://backend/ws` in a background task
  - On `alert` event → sends an embed to a configured Discord channel
  - On `device_update` → optionally logs or updates a status message
- Commands: `!devices`, `!room <name>`, `!toggle <id>`, `!usage`, `!alerts`

---

## Data Flow Diagram

```mermaid
graph TB
    subgraph Backend["FastAPI Backend (Single Process)"]
        SIM["Simulator Loop<br/>(async task, ticks every 3s)"]
        STORE[("In-Memory Store<br/><b>Single Source of Truth</b>")]
        ALERT["Alert Engine"]
        REST["REST Routes"]
        WS["WebSocket Hub"]
    end

    subgraph Devices["Simulated Devices (15)"]
        DR["Drawing Room<br/>2 fans + 3 lights"]
        WR1["Work Room 1<br/>2 fans + 3 lights"]
        WR2["Work Room 2<br/>2 fans + 3 lights"]
    end

    subgraph Clients["Consumer Interfaces"]
        DASH["React Dashboard<br/>(Vite)"]
        BOT["Discord Bot<br/>(discord.py)"]
    end

    %% Simulator flow
    SIM -- "random flip / adjust" --> STORE
    STORE -- "new reading" --> ALERT
    ALERT -- "alert object" --> STORE
    SIM -- "device_update via WS" --> WS
    ALERT -- "alert via WS" --> WS

    %% Device simulation is internal
    DR -. "simulated in" .-> SIM
    WR1 -. "simulated in" .-> SIM
    WR2 -. "simulated in" .-> SIM

    %% Dashboard
    DASH -- "toggle via WS" --> WS
    WS -- "snapshot via WS" --> DASH
    WS -- "device_update via WS" --> DASH
    WS -- "alert via WS" --> DASH
    DASH -- "GET /api/usage via HTTP" --> REST
    REST -- "JSON response via HTTP" --> DASH

    %% Bot
    BOT -- "GET /api/devices via HTTP" --> REST
    BOT -- "POST /api/devices/:id/toggle via HTTP" --> REST
    BOT -- "GET /api/usage via HTTP" --> REST
    REST -- "JSON response via HTTP" --> BOT
    WS -- "device_update via WS" --> BOT
    WS -- "alert via WS" --> BOT

    %% Store serves REST
    REST -- "read" --> STORE
    WS -- "toggle → mutate" --> STORE

    style STORE fill:#f59e0b,stroke:#d97706,color:#000
    style WS fill:#38bdf8,stroke:#0284c7,color:#000
    style REST fill:#a78bfa,stroke:#7c3aed,color:#000
    style SIM fill:#34d399,stroke:#059669,color:#000
    style ALERT fill:#f87171,stroke:#dc2626,color:#000
```

---

## Labelled Arrow Reference (for draw.io / Excalidraw)

Use this table to draw each arrow precisely:

| # | From | To | Label | Protocol |
|---|------|----|-------|----------|
| 1 | Simulator Loop | In-Memory Store | `write new state` | Internal function call |
| 2 | Simulator Loop | WebSocket Hub | `device_update` | Internal → WS broadcast |
| 3 | In-Memory Store | Alert Engine | `check thresholds` | Internal function call |
| 4 | Alert Engine | In-Memory Store | `store alert` | Internal function call |
| 5 | Alert Engine | WebSocket Hub | `alert` | Internal → WS broadcast |
| 6 | WebSocket Hub | React Dashboard | `snapshot` / `device_update` / `alert` | **WebSocket (JSON)** |
| 7 | React Dashboard | WebSocket Hub | `toggle` | **WebSocket (JSON)** |
| 8 | React Dashboard | REST Routes | `GET /api/usage` | **HTTP GET** |
| 9 | REST Routes | React Dashboard | JSON response | **HTTP 200** |
| 10 | WebSocket Hub | Discord Bot | `device_update` / `alert` | **WebSocket (JSON)** |
| 11 | Discord Bot | REST Routes | `GET /api/devices` | **HTTP GET** |
| 12 | Discord Bot | REST Routes | `GET /api/devices/{room}` | **HTTP GET** |
| 13 | Discord Bot | REST Routes | `POST /api/devices/{id}/toggle` | **HTTP POST** |
| 14 | Discord Bot | REST Routes | `GET /api/usage` | **HTTP GET** |
| 15 | REST Routes | In-Memory Store | `read / mutate` | Internal function call |
| 16 | WebSocket Hub | In-Memory Store | `toggle → mutate` | Internal function call |

---

## Single Source of Truth — Why Clients Never Diverge

```
┌─────────────────────────────────────────────────┐
│                 In-Memory Store                  │
│          (Python dict in backend process)        │
│                                                  │
│  • Only the backend mutates state               │
│  • REST reads are always from this store         │
│  • WebSocket broadcasts originate from mutations │
│    to this store                                 │
│  • Dashboard/Bot NEVER hold authoritative state  │
└─────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Both the dashboard and the bot are read-only mirrors.** Neither caches state independently. Every mutation (simulator tick, user toggle) goes through the backend, which:
> 1. Updates the store (single write path)
> 2. Broadcasts the change to **all** connected WS clients simultaneously
>
> This means the dashboard and bot always converge — they receive the **same** `device_update` event from the **same** broadcast call. There's no separate "bot state" vs "dashboard state."

### Why this is safe:

| Concern | Resolution |
|---------|------------|
| **Stale reads** | REST always reads from the live store, not a cache |
| **Split brain** | Impossible — only one process, one store, one broadcast |
| **Toggle race** | Toggle is a server-side mutation → broadcasts result to all → eventual consistency in < 1 tick |
| **Reconnection** | On WS connect, server sends `snapshot` with full current state |
| **Bot offline** | Misses events, but next REST call or WS reconnect gets fresh data |

---

## Sequence: User Toggles a Device from Dashboard

```mermaid
sequenceDiagram
    participant D as React Dashboard
    participant WS as WebSocket Hub
    participant S as In-Memory Store
    participant A as Alert Engine
    participant B as Discord Bot

    D->>WS: {"event": "toggle", "data": {"device_id": "dr_fan_1"}}
    WS->>S: store.toggle("dr_fan_1")
    S-->>WS: updated device object
    S->>A: check_thresholds(device)
    alt Threshold breached
        A->>S: store.add_alert(alert)
        A-->>WS: broadcast alert
        WS-->>D: {"event": "alert", ...}
        WS-->>B: {"event": "alert", ...}
    end
    WS-->>D: {"event": "device_update", "data": {...}}
    WS-->>B: {"event": "device_update", "data": {...}}
    Note over D,B: Both clients receive the same update simultaneously
```

## Sequence: Simulator Auto-Flips a Device

```mermaid
sequenceDiagram
    participant SIM as Simulator Loop
    participant S as In-Memory Store
    participant A as Alert Engine
    participant WS as WebSocket Hub
    participant D as React Dashboard
    participant B as Discord Bot

    loop Every 3 seconds
        SIM->>S: pick random device, flip state
        S->>A: check_thresholds(device)
        alt Alert triggered
            A->>S: store.add_alert(alert)
            A-->>WS: broadcast("alert", alert_data)
            WS-->>D: {"event": "alert", ...}
            WS-->>B: {"event": "alert", ...}
        end
        SIM-->>WS: broadcast("device_update", device_data)
        WS-->>D: {"event": "device_update", ...}
        WS-->>B: {"event": "device_update", ...}
    end
```
