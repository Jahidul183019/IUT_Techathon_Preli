"""
Device REST routes.

All endpoints read from the shared `device_store` singleton —
the same instance the simulator mutates and WebSocket broadcasts from.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from core.models import RoomId, ROOM_DISPLAY_NAMES
from core.store import device_store

router = APIRouter()


# ── GET /devices — all 15 devices ──────────────────────────────────────

@router.get("/")
async def list_devices():
    """Return all 15 devices with current state."""
    devices = device_store.get_all_devices()
    return {
        "count": len(devices),
        "devices": [d.model_dump(mode="json") for d in devices],
    }


# ── GET /devices/contacts — dummy contacts ──────────────────────────

@router.get("/contacts")
async def get_contacts():
    return {

        "contacts": [
            { "name": "IT Support Desk", "email": "it-support@office.local", "phone": "Ext. 101" },
            { "name": "Facilities Manager", "email": "facilities@office.local", "phone": "Ext. 102" }
        ]
    }


# ── GET /devices/{room} — devices for one room ────────────────────────

@router.get("/{room}")
async def get_room_devices(room: str):
    """
    Return devices for a specific room.
    Accepts room slugs: drawing_room, work_room_1, work_room_2
    """
    # Validate room ID
    try:
        room_id = RoomId(room)
    except ValueError:
        valid = [r.value for r in RoomId]
        raise HTTPException(
            status_code=404,
            detail=f"Room '{room}' not found. Valid rooms: {valid}",
        )

    devices = device_store.get_devices_by_room(room_id)
    return {
        "room_id": room_id.value,
        "room_name": ROOM_DISPLAY_NAMES[room_id],
        "count": len(devices),
        "devices": [d.model_dump(mode="json") for d in devices],
    }


# ── POST /devices/{device_id}/toggle — toggle a device ────────────────

@router.post("/{device_id}/toggle")
async def toggle_device(device_id: str):
    """
    Toggle a device's status (ON↔OFF).
    Returns the updated device. The WebSocket broadcast is handled
    by main.py's connection manager after this returns.
    """
    from main import manager  # Lazy import to avoid circular dependency

    device = device_store.toggle_device(device_id)
    if device is None:
        raise HTTPException(
            status_code=404,
            detail=f"Device '{device_id}' not found.",
        )

    # Broadcast the toggle to all WebSocket clients
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

    return {
        "message": f"{device.name} turned {'ON' if device.status else 'OFF'}",
        "device": device.model_dump(mode="json"),
    }


# ── GET /usage — power consumption stats ──────────────────────────────

@router.get("/stats/usage")
async def get_usage():
    """
    Return total watts currently drawn, per-room breakdown,
    and today's estimated kWh.

    Estimated kWh = current_watts × hours_elapsed_today / 1000
    This is a rough estimate assuming current draw has been constant —
    fine for a demo, not for production billing.
    """
    usage = device_store.get_usage()

    # Estimate today's kWh
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    hours_elapsed = (now - midnight).total_seconds() / 3600

    estimated_kwh = round((usage.total_watts * hours_elapsed) / 1000, 2)

    return {
        "total_watts": usage.total_watts,
        "total_devices": usage.total_devices,
        "active_devices": usage.active_devices,
        "estimated_kwh_today": estimated_kwh,
        "hours_elapsed_today": round(hours_elapsed, 1),
        "rooms": [r.model_dump(mode="json") for r in usage.rooms],
    }


# ── GET /alerts — active alerts ────────────────────────────────────────

@router.get("/stats/alerts")
async def get_alerts(limit: int = 20):
    """Return the most recent alerts, newest first."""
    alerts = device_store.get_alerts(limit=limit)
    return {
        "count": len(alerts),
        "alerts": [a.model_dump(mode="json") for a in alerts],
    }

