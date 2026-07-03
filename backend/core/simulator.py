"""
Async device simulator — runs as a background task inside FastAPI.

Started via lifespan context manager in main.py:
    asyncio.create_task(run_simulator(broadcast_fn=manager.broadcast))

Behaviour:
  - Every TICK_SECONDS, picks a random device and flips its status.
  - Time-weighted randomness:
      • 09:00–17:00 → devices biased toward ON  (70% chance ON after flip)
      • 17:00–09:00 → devices biased toward OFF (70% chance OFF after flip)
  - After each state change, runs alert checks and broadcasts any new alerts.
  - Calls the broadcast callback so WebSocket clients get live updates.
"""

import asyncio
import random
import logging
from datetime import datetime, timezone

from core.models import DeviceType
from core.store import device_store

logger = logging.getLogger("simulator")

# ── Configuration ──────────────────────────────────────────────────────

TICK_SECONDS: float = 4.0          # seconds between state flips
ON_BIAS_DAYTIME: float = 0.70      # P(device ends up ON) during work hours
ON_BIAS_NIGHTTIME: float = 0.30    # P(device ends up ON) outside work hours
WORK_HOUR_START: int = 9           # 09:00
WORK_HOUR_END: int = 17            # 17:00


# ── Time-weighted bias ─────────────────────────────────────────────────

def _is_work_hours() -> bool:
    """Check if current UTC hour falls within work hours."""
    hour = datetime.now(timezone.utc).hour
    return WORK_HOUR_START <= hour < WORK_HOUR_END


def _biased_status() -> bool:
    """
    Return a target status weighted by time of day.

    During work hours:  70% chance → ON
    Outside work hours: 30% chance → ON (i.e., 70% chance → OFF)
    """
    bias = ON_BIAS_DAYTIME if _is_work_hours() else ON_BIAS_NIGHTTIME
    return random.random() < bias


# ── Main simulator loop ───────────────────────────────────────────────

async def run_simulator(
    broadcast_fn=None,
    tick_seconds: float = TICK_SECONDS,
) -> None:
    """
    Async background task: periodically flip a random device's state.

    Args:
        broadcast_fn: Optional async callback(event: str, data: dict)
                      Called after each state change to push updates to
                      all WebSocket clients. Injected by main.py.
        tick_seconds:  Interval between ticks.
    """
    # Import here to avoid circular imports at module level
    from core.alerts import run_alert_checks

    logger.info(
        "Simulator started — tick=%.1fs, %d devices",
        tick_seconds,
        len(device_store.get_all_devices()),
    )

    while True:
        await asyncio.sleep(tick_seconds)

        try:
            # 1. Pick a random device
            all_devices = device_store.get_all_devices()
            target = random.choice(all_devices)

            # 2. Decide new status with time-of-day bias
            desired = _biased_status()

            # Only flip if the desired state differs (makes changes meaningful)
            # But sometimes flip anyway (20% chance) for variety
            if target.status == desired and random.random() > 0.20:
                continue  # Skip this tick — no change

            # 3. Toggle the device
            updated = device_store.toggle_device(target.id)
            if updated is None:
                continue

            logger.info(
                "Flipped %s (%s) → %s",
                updated.name,
                updated.type.value,
                "ON" if updated.status else "OFF",
            )

            # 4. Broadcast device_update to all WS clients
            if broadcast_fn:
                await broadcast_fn("device_update", {
                    "device_id": updated.id,
                    "name": updated.name,
                    "type": updated.type.value,
                    "room": updated.room.value,
                    "status": updated.status,
                    "wattage": updated.wattage,
                    "current_draw": updated.current_draw,
                    "last_changed": updated.last_changed.isoformat(),
                })

            # 5. Run alert checks → broadcast any new alerts
            new_alerts = run_alert_checks()
            if broadcast_fn:
                for alert in new_alerts:
                    await broadcast_fn("alert", {
                        "id": alert.id,
                        "device_id": alert.device_id,
                        "message": alert.message,
                        "severity": alert.severity.value,
                        "timestamp": alert.timestamp.isoformat(),
                    })

        except Exception:
            logger.exception("Simulator tick failed")
            # Don't crash the loop — keep ticking
