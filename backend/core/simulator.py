"""
Device simulator — generates fake sensor data for testing.
Will be wired up as a FastAPI background task.
"""

import asyncio
import random
from datetime import datetime

from core.models import DeviceReading
from core.store import store


async def simulate_readings(interval: float = 5.0):
    """
    Periodically generate random readings for all registered devices.
    Meant to run as an asyncio background task.
    """
    while True:
        for device_id in list(store.devices.keys()):
            reading = DeviceReading(
                device_id=device_id,
                temperature=round(random.uniform(18.0, 45.0), 1),
                humidity=round(random.uniform(30.0, 90.0), 1),
                timestamp=datetime.utcnow(),
            )
            store.add_reading(reading)
        await asyncio.sleep(interval)
