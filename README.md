# IUT Techathon Preli

> Hackathon monorepo — IoT device monitoring platform

## Architecture

```
project/
├── backend/      — FastAPI server (REST + WebSocket, async tasks, in-memory store)
├── bot/          — Discord bot (discord.py, talks to backend via REST/WS)
├── dashboard/    — React dashboard (Vite, connects to backend via native WebSocket)
├── diagrams/     — Architecture & flow diagrams
├── circuit/      — Hardware schematics / circuit designs
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn main:app --reload --port 8000
```

### 2. Discord Bot

```bash
cd bot
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

### 3. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` → `.env` and fill in the values.

## Team

- Built for IUT Techathon Preliminary Round
