"""
Pydantic models for the IoT Smart Office Monitor.

Device inventory: 3 rooms × 5 devices/room = 15 total
  Each room: 2 fans + 3 lights
"""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────

class DeviceType(str, Enum):
    FAN = "fan"
    LIGHT = "light"


class RoomId(str, Enum):
    DRAWING_ROOM = "drawing_room"
    WORK_ROOM_1 = "work_room_1"
    WORK_ROOM_2 = "work_room_2"


# ── Device Model ───────────────────────────────────────────────────────

class Device(BaseModel):
    """A single IoT device (fan or light) in a room."""

    id: str                                          # e.g. "dr_fan_1"
    name: str                                        # e.g. "Drawing Room Fan 1"
    type: DeviceType
    room: RoomId
    status: bool = False                             # True = ON, False = OFF
    wattage: int = 0                                 # rated wattage when ON
    last_changed: datetime = Field(default_factory=datetime.utcnow)

    @property
    def current_draw(self) -> int:
        """Wattage currently being consumed (0 if OFF)."""
        return self.wattage if self.status else 0


# ── Room Model ─────────────────────────────────────────────────────────

ROOM_DISPLAY_NAMES: dict[RoomId, str] = {
    RoomId.DRAWING_ROOM: "Drawing Room",
    RoomId.WORK_ROOM_1: "Work Room 1",
    RoomId.WORK_ROOM_2: "Work Room 2",
}


class Room(BaseModel):
    """A room containing exactly 2 fans and 3 lights (5 devices)."""

    id: RoomId
    name: str
    devices: list[Device] = []

    @property
    def active_power(self) -> int:
        """Total wattage of all ON devices in this room."""
        return sum(d.current_draw for d in self.devices)

    @property
    def device_count(self) -> int:
        return len(self.devices)

    @property
    def on_count(self) -> int:
        return sum(1 for d in self.devices if d.status)


# ── Usage Stats ────────────────────────────────────────────────────────

class RoomUsage(BaseModel):
    """Power usage summary for a single room."""

    room_id: str
    room_name: str
    active_devices: int
    total_devices: int
    current_watts: int


class UsageStats(BaseModel):
    """Aggregate power usage across all rooms."""

    total_watts: int
    total_devices: int
    active_devices: int
    rooms: list[RoomUsage]


# ── Alert Model ────────────────────────────────────────────────────────

class AlertSeverity(str, Enum):
    WARNING = "warning"
    CRITICAL = "critical"
    INFO = "info"


class Alert(BaseModel):
    """An alert triggered by the system (power threshold, rapid toggling, etc.)."""

    id: str
    device_id: str
    message: str
    severity: AlertSeverity = AlertSeverity.WARNING
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False


# ── Device Seed Data ───────────────────────────────────────────────────
# Wattage references (from problem statement):
#   Fan          = 60W
#   Light        = 15W

DEVICE_SEED: list[dict] = []

_ROOM_PREFIXES = {
    RoomId.DRAWING_ROOM: ("dr", "Drawing Room"),
    RoomId.WORK_ROOM_1: ("wr1", "Work Room 1"),
    RoomId.WORK_ROOM_2: ("wr2", "Work Room 2"),
}

for room_id, (prefix, display) in _ROOM_PREFIXES.items():
    # 2 fans per room
    for i in range(1, 3):
        DEVICE_SEED.append({
            "id": f"{prefix}_fan_{i}",
            "name": f"{display} Fan {i}",
            "type": DeviceType.FAN,
            "room": room_id,
            "wattage": 60,
        })
    # 3 lights per room
    for i in range(1, 4):
        DEVICE_SEED.append({
            "id": f"{prefix}_light_{i}",
            "name": f"{display} Light {i}",
            "type": DeviceType.LIGHT,
            "room": room_id,
            "wattage": 15,
        })

assert len(DEVICE_SEED) == 15, f"Expected 15 devices, got {len(DEVICE_SEED)}"
