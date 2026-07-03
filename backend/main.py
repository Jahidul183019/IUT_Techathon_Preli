"""
FastAPI backend — entry point.
Provides REST endpoints, WebSocket support, and async background tasks.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from routes.devices import router as devices_router

app = FastAPI(title="IoT Monitor API", version="0.1.0")

# ── CORS (allow dashboard & bot) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(devices_router, prefix="/api/devices", tags=["devices"])


# ── Health check ──
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── WebSocket endpoint (stub) ──
connected_clients: list[WebSocket] = []


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    try:
        while True:
            data = await ws.receive_text()
            # Echo back for now
            await ws.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        connected_clients.remove(ws)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
