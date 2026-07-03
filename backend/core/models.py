"""
Pydantic models for the IoT domain.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DeviceReading(BaseModel):
    """A single sensor reading from a device."""

    device_id: str
    temperature: float = 0.0
    humidity: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DeviceInfo(BaseModel):
    """Metadata about a registered device."""

    device_id: str
    name: str = "Unnamed Device"
    location: Optional[str] = None
    is_online: bool = False


class Alert(BaseModel):
    """An alert triggered by a threshold breach."""

    alert_id: str
    device_id: str
    message: str
    severity: str = "warning"  # warning | critical
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
