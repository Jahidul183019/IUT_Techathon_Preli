"""
Shared timezone helpers.

The simulator and alert engine need a *local* notion of "work hours"
because the office this is modelling is in Bangladesh (BST = UTC+6).
Computing `now.hour` from naive UTC would make 09:00–17:00 local
behave as 03:00–11:00 UTC — silently wrong.

The local zone is configurable via the `LOCAL_TZ` env var so anyone
running the demo in another timezone (or in UTC by choice) can
override it without touching code.
"""

import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


# Default to Bangladesh (Asia/Dhaka) since the office this models is at IUT.
# Override with `LOCAL_TZ=UTC` (or any IANA name) before launching the backend.
DEFAULT_LOCAL_TZ = "Asia/Dhaka"


def get_local_tz():
    """Return the configured ZoneInfo, falling back to default on bad config."""
    name = os.getenv("LOCAL_TZ", DEFAULT_LOCAL_TZ)
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError:
        # Bad config — fall back to the default rather than crashing the app.
        return ZoneInfo(DEFAULT_LOCAL_TZ)


def now_local() -> datetime:
    """Current wall-clock time in the configured local timezone."""
    return datetime.now(get_local_tz())


def now_utc() -> datetime:
    """Current UTC time (tz-aware). Kept for storage / log timestamps."""
    return datetime.now(timezone.utc)