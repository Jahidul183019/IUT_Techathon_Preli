"""
Alert engine — checks readings against thresholds and creates alerts.
"""

import uuid
from datetime import datetime

from core.models import Alert, DeviceReading
from core.store import store

# Default thresholds
TEMP_THRESHOLD = 40.0
HUMIDITY_THRESHOLD = 85.0


def check_reading(reading: DeviceReading) -> Alert | None:
    """Evaluate a reading and return an Alert if thresholds are breached."""
    if reading.temperature > TEMP_THRESHOLD:
        alert = Alert(
            alert_id=str(uuid.uuid4()),
            device_id=reading.device_id,
            message=f"High temperature: {reading.temperature}°C",
            severity="critical",
            timestamp=datetime.utcnow(),
        )
        store.add_alert(alert)
        return alert

    if reading.humidity > HUMIDITY_THRESHOLD:
        alert = Alert(
            alert_id=str(uuid.uuid4()),
            device_id=reading.device_id,
            message=f"High humidity: {reading.humidity}%",
            severity="warning",
            timestamp=datetime.utcnow(),
        )
        store.add_alert(alert)
        return alert

    return None
