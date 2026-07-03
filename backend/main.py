"""
FastAPI backend — entry point.

Wires together:
  - ConnectionManager for WebSocket client tracking + broadcast
  - WebSocket endpoint at /ws (snapshot on connect, live updates)
  - REST routes from routes/devices.py
  - Simulator background task (started on app startup)
"""

import asyncio
import json
import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from core.store import device_store
from core.simulator import run_simulator
from routes.devices import router as devices_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-12s │ %(levelname)-5s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")


# ══════════════════════════════════════════════════════════════════════
#  Connection Manager — tracks active WebSocket clients
# ══════════════════════════════════════════════════════════════════════

class ConnectionManager:
    """
    Manages multiple active WebSocket connections.

    Usage:
        manager = ConnectionManager()
        await manager.connect(ws)       # adds client, sends snapshot
        manager.disconnect(ws)          # removes client
        await manager.broadcast(...)    # sends to ALL connected clients
    """

    def __init__(self) -> None:
        self._clients: list[WebSocket] = []

    @property
    def client_count(self) -> int:
        return len(self._clients)

    async def connect(self, ws: WebSocket) -> None:
        """Accept a WebSocket connection and send the full state snapshot."""
        await ws.accept()
        self._clients.append(ws)
        logger.info("WS client connected — %d total", self.client_count)

        # Send full snapshot so the client renders immediately
        snapshot = device_store.snapshot()
        await ws.send_text(json.dumps({
            "type": "snapshot",
            "data": snapshot,
        }))

    def disconnect(self, ws: WebSocket) -> None:
        """Remove a client from the active list."""
        if ws in self._clients:
            self._clients.remove(ws)
        logger.info("WS client disconnected — %d remaining", self.client_count)

    async def broadcast(self, event_type: str, data: dict) -> None:
        """
        Send a JSON message to ALL connected WebSocket clients.

        Message format:
            {"type": "device_update", "data": { ... }}
            {"type": "alert",         "data": { ... }}

        Silently drops clients that have gone stale.
        """
        if not self._clients:
            return

        message = json.dumps({"type": event_type, "data": data})
        stale: list[WebSocket] = []

        for client in self._clients:
            try:
                await client.send_text(message)
            except Exception:
                stale.append(client)

        # Clean up disconnected clients
        for client in stale:
            self.disconnect(client)


# Singleton — importable by routes for toggle broadcast
manager = ConnectionManager()


# ══════════════════════════════════════════════════════════════════════
#  App Lifespan — start simulator on startup
# ══════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the simulator background task when the app starts."""
    logger.info("Starting IoT simulator background task...")
    task = asyncio.create_task(
        run_simulator(broadcast_fn=manager.broadcast)
    )
    yield
    # Shutdown: cancel the simulator
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Simulator stopped.")


# ══════════════════════════════════════════════════════════════════════
#  FastAPI App
# ══════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="IoT Smart Home Monitor API",
    version="0.1.0",
    description="Real-time IoT device monitoring with WebSocket and REST",
    lifespan=lifespan,
)

# ── CORS — allow dashboard (Vite dev server) and bot ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount REST routes ──
app.include_router(devices_router, prefix="/api/devices", tags=["Devices"])


# ── Health check ──
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "devices": len(device_store.get_all_devices()),
        "ws_clients": manager.client_count,
    }


# ══════════════════════════════════════════════════════════════════════
#  WebSocket Endpoint
# ══════════════════════════════════════════════════════════════════════

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    WebSocket connection handler.

    On connect:
      → Server sends {"type": "snapshot", "data": { devices, usage, alerts }}

    Ongoing (server → client):
      → {"type": "device_update", "data": { device_id, name, status, ... }}
      → {"type": "alert",         "data": { id, message, severity, ... }}

    Client → server (optional):
      ← {"type": "toggle", "data": { "device_id": "dr_fan_1" }}
    """
    await manager.connect(ws)

    try:
        while True:
            # Listen for client messages (e.g., toggle commands from dashboard)
            raw = await ws.receive_text()

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Invalid JSON"},
                }))
                continue

            msg_type = msg.get("type")
            msg_data = msg.get("data", {})

            if msg_type == "toggle":
                device_id = msg_data.get("device_id")
                if not device_id:
                    await ws.send_text(json.dumps({
                        "type": "error",
                        "data": {"message": "Missing device_id"},
                    }))
                    continue

                device = device_store.toggle_device(device_id)
                if device is None:
                    await ws.send_text(json.dumps({
                        "type": "error",
                        "data": {"message": f"Device '{device_id}' not found"},
                    }))
                    continue

                # Broadcast to ALL clients (including the one that toggled)
                await manager.broadcast("device_update", {
                    "device_id": device.id,
                    "name": device.name,
                    "type": device.type.value,
                    "room": device.room.value,
                    "status": device.status,
                    "wattage": device.wattage,
                    "current_draw": device.current_draw,
                    "last_changed": device.last_changed.isoformat(),
                })

                logger.info(
                    "WS toggle: %s → %s",
                    device.name,
                    "ON" if device.status else "OFF",
                )

            elif msg_type == "ping":
                await ws.send_text(json.dumps({
                    "type": "pong",
                    "data": {"ws_clients": manager.client_count},
                }))

            else:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": f"Unknown message type: {msg_type}"},
                }))

    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        logger.exception("WebSocket error")
        manager.disconnect(ws)


# ── Run directly ──
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
