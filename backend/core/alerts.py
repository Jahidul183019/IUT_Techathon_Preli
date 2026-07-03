"""
Alert engine — runs alongside the simulator to detect anomalous conditions.

Alert rules:
  (a) Any device ON outside work hours (09:00–17:00)
  (b) Any room where ALL devices have been continuously ON for 2+ hours

Each alert is a timestamped object with a human-readable message.
Deduplication: the same alert condition won't fire again within a cooldown window.
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta

from core.models import (
    Alert,
    AlertSeverity,
    DeviceType,
    RoomId,
    ROOM_DISPLAY_NAMES,
)
from core.store import device_store

logger = logging.getLogger("alerts")

# ── Configuration ──────────────────────────────────────────────────────

WORK_HOUR_START: int = 9   # 09:00
WORK_HOUR_END: int = 17    # 17:00
CONTINUOUS_ON_THRESHOLD: timedelta = timedelta(hours=2)
ALERT_COOLDOWN: timedelta = timedelta(minutes=10)  # same alert won't re-fire within this

# Track recently fired alerts to avoid spam: { rule_key: last_fired_utc }
_cooldowns: dict[str, datetime] = {}


# ── Helpers ────────────────────────────────────────────────────────────

def _is_work_hours(now: datetime | None = None) -> bool:
    """Check if current hour is within work hours."""
    if now is None:
        now = datetime.now(timezone.utc)
    return WORK_HOUR_START <= now.hour < WORK_HOUR_END


def _is_on_cooldown(rule_key: str, now: datetime) -> bool:
    """Check if this alert rule has fired recently."""
    last = _cooldowns.get(rule_key)
    if last is None:
        return False
    return (now - last) < ALERT_COOLDOWN


def _fire_alert(rule_key: str, device_id: str, message: str,
                severity: AlertSeverity, now: datetime) -> Alert:
    """Create, store, and return an alert. Update cooldown."""
    alert = Alert(
        id=str(uuid.uuid4()),
        device_id=device_id,
        message=message,
        severity=severity,
        timestamp=now,
    )
    device_store.add_alert(alert)
    _cooldowns[rule_key] = now
    logger.info("Alert fired [%s]: %s", severity.value, message)
    return alert


# ── Rule (a): Device ON outside work hours ─────────────────────────────

def check_after_hours(now: datetime | None = None) -> list[Alert]:
    """
    Flag any device that is ON outside 09:00–17:00.
    Fans are CRITICAL (fire hazard), lights are WARNING (wasteful).
    """
    if now is None:
        now = datetime.now(timezone.utc)

    if _is_work_hours(now):
        return []  # No after-hours alerts during work hours

    alerts: list[Alert] = []
    for device in device_store.get_all_devices():
        if not device.status:
            continue  # Device is OFF — no concern

        rule_key = f"after_hours:{device.id}"
        if _is_on_cooldown(rule_key, now):
            continue

        if device.type == DeviceType.FAN:
            severity = AlertSeverity.CRITICAL
            emoji = "🔴"
        else:
            severity = AlertSeverity.WARNING
            emoji = "🟡"

        room_name = ROOM_DISPLAY_NAMES.get(device.room, device.room.value)
        alert = _fire_alert(
            rule_key=rule_key,
            device_id=device.id,
            message=(
                f"{emoji} {device.name} is ON after hours "
                f"({room_name}, {now.strftime('%H:%M')} UTC)"
            ),
            severity=severity,
            now=now,
        )
        alerts.append(alert)

    return alerts


# ── Rule (b): All devices in a room ON for 2+ hours ───────────────────

def check_continuous_full_room(now: datetime | None = None) -> list[Alert]:
    """
    Flag any room where ALL 5 devices have been continuously ON
    for at least 2 hours. This suggests someone forgot to turn things off.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    alerts: list[Alert] = []

    for room_id in RoomId:
        devices = device_store.get_devices_by_room(room_id)

        # All must be ON
        if not all(d.status for d in devices):
            continue

        # Check if the oldest last_changed is 2+ hours ago
        # (meaning all have been ON for at least that long)
        oldest_change = min(d.last_changed for d in devices)

        # Handle naive vs aware datetimes
        if oldest_change.tzinfo is None:
            oldest_change = oldest_change.replace(tzinfo=timezone.utc)

        duration = now - oldest_change
        if duration < CONTINUOUS_ON_THRESHOLD:
            continue

        rule_key = f"full_room:{room_id.value}"
        if _is_on_cooldown(rule_key, now):
            continue

        room_name = ROOM_DISPLAY_NAMES[room_id]
        hours = duration.total_seconds() / 3600
        total_watts = sum(d.current_draw for d in devices)

        alert = _fire_alert(
            rule_key=rule_key,
            device_id=f"room:{room_id.value}",
            message=(
                f"🔴 All {len(devices)} devices in {room_name} have been ON "
                f"for {hours:.1f}h — drawing {total_watts}W continuously"
            ),
            severity=AlertSeverity.CRITICAL,
            now=now,
        )
        alerts.append(alert)

    return alerts


# ── Main entry point (called by simulator each tick) ───────────────────

def run_alert_checks(now: datetime | None = None) -> list[Alert]:
    """
    Run all alert rules and return any newly generated alerts.
    Called by the simulator after each device state change.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    new_alerts: list[Alert] = []
    new_alerts.extend(check_after_hours(now))
    new_alerts.extend(check_continuous_full_room(now))
    return new_alerts
