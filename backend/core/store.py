"""
In-memory data store.
Provides thread-safe access to devices, readings, and alerts.
"""

from core.models import DeviceInfo, DeviceReading, Alert


class Store:
    """Simple in-memory store — replace with a real DB later."""

    def __init__(self):
        self.devices: dict[str, DeviceInfo] = {}
        self.readings: list[DeviceReading] = []
        self.alerts: list[Alert] = []

    def add_device(self, device: DeviceInfo) -> DeviceInfo:
        self.devices[device.device_id] = device
        return device

    def get_device(self, device_id: str) -> DeviceInfo | None:
        return self.devices.get(device_id)

    def list_devices(self) -> list[DeviceInfo]:
        return list(self.devices.values())

    def add_reading(self, reading: DeviceReading) -> DeviceReading:
        self.readings.append(reading)
        return reading

    def get_readings(self, device_id: str) -> list[DeviceReading]:
        return [r for r in self.readings if r.device_id == device_id]

    def add_alert(self, alert: Alert) -> Alert:
        self.alerts.append(alert)
        return alert

    def list_alerts(self) -> list[Alert]:
        return self.alerts


# Singleton instance
store = Store()
