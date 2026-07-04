"""
In-memory device store — the Single Source of Truth.

Singleton pattern: import `device_store` from anywhere (routes, bot, simulator)
and you get the same instance with the same state.
"""

from datetime import datetime, timezone

from core.models import (
    Alert,
    Device,
    DEVICE_SEED,
    DeviceType,
    Room,
    RoomId,
    RoomUsage,
    ROOM_DISPLAY_NAMES,
    UsageStats,
)


class DeviceStore:
    """
    Holds all 15 devices in memory.

    Seeded on init with a realistic mixed initial state:
      - Drawing Room: fans ON, lights 2/3 ON  (occupied daytime room)
      - Work Room 1:  fan 1 ON, lights all ON  (active workspace)
      - Work Room 2:  everything OFF            (unoccupied)
    """

    def __init__(self) -> None:
        self._devices: dict[str, Device] = {}
        self._alerts: list[Alert] = []
        self._turned_on_at: dict[str, datetime] = {}
        self._seed()

    # ── Seeding ────────────────────────────────────────────────────────

    def _seed(self) -> None:
        """Create all 15 devices with a realistic mixed initial state."""
        # Define which devices start as ON for a natural-looking demo
        initially_on: set[str] = {
            # Drawing Room — occupied, most things on
            "dr_fan_1", "dr_fan_2", "dr_light_1", "dr_light_3",
            # Work Room 1 — one person working
            "wr1_fan_1", "wr1_light_1", "wr1_light_2", "wr1_light_3",
            # Work Room 2 — empty, everything off
            # (nothing added)
        }

        now = datetime.now(timezone.utc)
        for seed in DEVICE_SEED:
            device = Device(
                id=seed["id"],
                name=seed["name"],
                type=seed["type"],
                room=seed["room"],
                wattage=seed["wattage"],
                status=seed["id"] in initially_on,
                last_changed=now,
            )
            self._devices[device.id] = device
            if device.id in initially_on:
                self._turned_on_at[device.id] = now

        assert len(self._devices) == 15, (
            f"Store must hold exactly 15 devices, got {len(self._devices)}"
        )

    # ── Read Operations ────────────────────────────────────────────────

    def get_all_devices(self) -> list[Device]:
        """Return all 15 devices."""
        return list(self._devices.values())

    def get_device(self, device_id: str) -> Device | None:
        """Return a single device by ID, or None."""
        return self._devices.get(device_id)

    def get_devices_by_room(self, room_id: RoomId) -> list[Device]:
        """Return all devices (5) in a given room."""
        return [d for d in self._devices.values() if d.room == room_id]

    def get_devices_by_type(self, device_type: DeviceType) -> list[Device]:
        """Return all devices of a given type across all rooms."""
        return [d for d in self._devices.values() if d.type == device_type]

    def get_room(self, room_id: RoomId) -> Room:
        """Build a Room object with its devices."""
        return Room(
            id=room_id,
            name=ROOM_DISPLAY_NAMES[room_id],
            devices=self.get_devices_by_room(room_id),
        )

    def get_all_rooms(self) -> list[Room]:
        """Return all 3 rooms with their devices."""
        return [self.get_room(rid) for rid in RoomId]

    # ── Write Operations ───────────────────────────────────────────────

    def toggle_device(self, device_id: str) -> Device | None:
        """
        Flip a device's status (ON↔OFF), update last_changed.
        Returns the updated device, or None if not found.
        """
        device = self._devices.get(device_id)
        if device is None:
            return None

        # Pydantic models are immutable by default — rebuild with new values
        updated = device.model_copy(update={
            "status": not device.status,
            "last_changed": datetime.now(timezone.utc),
        })
        if updated.status and not device.status:   # OFF → ON transition
            self._turned_on_at[updated.id] = datetime.now(timezone.utc)
        elif not updated.status:                    # any → OFF transition
            self._turned_on_at.pop(updated.id, None)
        self._devices[device_id] = updated
        return updated

    def set_device_status(self, device_id: str, status: bool) -> Device | None:
        """
        Explicitly set a device's status.
        Returns the updated device, or None if not found.
        """
        device = self._devices.get(device_id)
        if device is None:
            return None

        if device.status == status:
            return device  # No change needed

        updated = device.model_copy(update={
            "status": status,
            "last_changed": datetime.now(timezone.utc),
        })
        if updated.status and not device.status:   # OFF → ON transition
            self._turned_on_at[updated.id] = datetime.now(timezone.utc)
        elif not updated.status:                    # any → OFF transition
            self._turned_on_at.pop(updated.id, None)
        self._devices[device_id] = updated
        return updated

    def get_turned_on_at(self, device_id: str) -> datetime | None:
        """Return when the device was most recently turned ON, or None."""
        return self._turned_on_at.get(device_id)

    # ── Usage / Stats ──────────────────────────────────────────────────

    def get_usage(self) -> UsageStats:
        """Compute total and per-room power usage."""
        room_usages: list[RoomUsage] = []

        for room_id in RoomId:
            devices = self.get_devices_by_room(room_id)
            active = [d for d in devices if d.status]
            room_usages.append(RoomUsage(
                room_id=room_id.value,
                room_name=ROOM_DISPLAY_NAMES[room_id],
                active_devices=len(active),
                total_devices=len(devices),
                current_watts=sum(d.current_draw for d in devices),
            ))

        all_devices = self.get_all_devices()
        return UsageStats(
            total_watts=sum(d.current_draw for d in all_devices),
            total_devices=len(all_devices),
            active_devices=sum(1 for d in all_devices if d.status),
            rooms=room_usages,
        )

    # ── Alerts ─────────────────────────────────────────────────────────

    def add_alert(self, alert: Alert) -> Alert:
        """Store an alert and return it."""
        self._alerts.append(alert)
        # Keep only the last 100 alerts to prevent unbounded growth
        if len(self._alerts) > 100:
            self._alerts = self._alerts[-100:]
        return alert

    def get_alerts(self, limit: int = 20) -> list[Alert]:
        """Return the most recent alerts, newest first."""
        return list(reversed(self._alerts[-limit:]))

    def acknowledge_alert(self, alert_id: str) -> Alert | None:
        """Mark an alert as acknowledged."""
        for i, alert in enumerate(self._alerts):
            if alert.id == alert_id:
                updated = alert.model_copy(update={"acknowledged": True})
                self._alerts[i] = updated
                return updated
        return None

    # ── Snapshot (for WebSocket initial sync) ──────────────────────────

    def snapshot(self) -> dict:
        """
        Full state dump for sending to a newly connected WebSocket client.
        Both dashboard and bot receive this identical snapshot.
        """
        return {
            "devices": [d.model_dump(mode="json") for d in self.get_all_devices()],
            "usage": self.get_usage().model_dump(mode="json"),
            "alerts": [a.model_dump(mode="json") for a in self.get_alerts(10)],
        }


# ── Singleton instance ─────────────────────────────────────────────────
# Import this from anywhere: `from core.store import device_store`
# Routes, simulator, and bot all share the same object.

device_store = DeviceStore()
