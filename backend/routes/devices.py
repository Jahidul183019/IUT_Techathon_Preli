"""
Device REST routes.
"""

from fastapi import APIRouter

from core.store import store
from core.models import DeviceInfo

router = APIRouter()


@router.get("/")
async def list_devices():
    """Return all registered devices."""
    return store.list_devices()


@router.get("/{device_id}")
async def get_device(device_id: str):
    """Return a single device by ID."""
    device = store.get_device(device_id)
    if device is None:
        return {"error": "Device not found"}, 404
    return device


@router.post("/")
async def register_device(device: DeviceInfo):
    """Register a new device."""
    return store.add_device(device)


@router.get("/{device_id}/readings")
async def get_device_readings(device_id: str):
    """Return all readings for a device."""
    return store.get_readings(device_id)
