import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ConnectionStatus, Device, UsageStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://iot-smart-home-dashboard.onrender.com';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://iot-smart-home-dashboard.onrender.com/ws';

const ROOM_NAMES = {
  drawing_room: 'Drawing Room',
  work_room_1: 'Work Room 1',
  work_room_2: 'Work Room 2',
} as const;

type BackendRoomId = keyof typeof ROOM_NAMES;

interface BackendDevice {
  id?: string;
  device_id?: string;
  name: string;
  type: 'fan' | 'light';
  room: BackendRoomId;
  status: boolean;
  wattage: number;
  current_draw?: number;
  last_changed: string;
}

interface BackendAlert {
  id: string;
  device_id: string;
  message: string;
  severity: Alert['level'];
  timestamp: string;
}

interface BackendUsage {
  total_watts: number;
  total_devices: number;
  active_devices: number;
  estimated_kwh_today?: number;
  hours_elapsed_today?: number;
  rooms: Array<{
    room_id: BackendRoomId;
    room_name: string;
    active_devices: number;
    total_devices: number;
    current_watts: number;
  }>;
}

interface SnapshotPayload {
  devices?: BackendDevice[];
  usage?: BackendUsage;
  alerts?: BackendAlert[];
}

const formatTimestamp = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapDevice = (device: BackendDevice): Device => {
  const id = device.device_id || device.id || '';
  return {
    id,
    name: device.name,
    type: device.type,
    room: ROOM_NAMES[device.room],
    status: device.status ? 'ON' : 'OFF',
    wattage: device.wattage,
    currentDraw: device.status ? (device.current_draw ?? device.wattage) : 0,
    lastActivity: formatTimestamp(device.last_changed),
  };
};

const mapAlert = (alert: BackendAlert): Alert => ({
  id: alert.id,
  level: alert.severity,
  timestamp: formatTimestamp(alert.timestamp),
  message: alert.message,
});

const mapUsage = (usage: BackendUsage): UsageStats => ({
  total_watts: usage.total_watts,
  total_devices: usage.total_devices,
  active_devices: usage.active_devices,
  estimated_kwh_today: usage.estimated_kwh_today ?? 0,
  hours_elapsed_today: usage.hours_elapsed_today ?? 0,
  rooms: usage.rooms.map((room) => ({
    room_id: room.room_id,
    room_name: ROOM_NAMES[room.room_id],
    active_devices: room.active_devices,
    total_devices: room.total_devices,
    current_watts: room.current_watts,
  })),
});

const estimateTodayKwh = (watts: number) => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const hoursElapsed = (now.getTime() - midnight.getTime()) / 3_600_000;
  return {
    estimated_kwh_today: Math.round((watts * hoursElapsed) / 10) / 100,
    hours_elapsed_today: Math.round(hoursElapsed * 10) / 10,
  };
};

const computeUsageFromDevices = (devices: Device[]): UsageStats => {
  const roomNames: Device['room'][] = ['Drawing Room', 'Work Room 1', 'Work Room 2'];
  const rooms = roomNames.map((roomName) => {
    const roomDevices = devices.filter((device) => device.room === roomName);
    const activeDevices = roomDevices.filter((device) => device.status === 'ON');
    return {
      room_id: roomName.toLowerCase().replaceAll(' ', '_'),
      room_name: roomName,
      active_devices: activeDevices.length,
      total_devices: roomDevices.length,
      current_watts: activeDevices.reduce((sum, device) => sum + device.currentDraw, 0),
    };
  });
  const totalWatts = rooms.reduce((sum, room) => sum + room.current_watts, 0);
  return {
    total_watts: totalWatts,
    total_devices: devices.length,
    active_devices: devices.filter((device) => device.status === 'ON').length,
    ...estimateTodayKwh(totalWatts),
    rooms,
  };
};

export function useBackendDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryDelayRef = useRef(1000);
  const mountedRef = useRef(false);

  const applyDevices = useCallback((backendDevices: BackendDevice[], backendUsage?: BackendUsage) => {
    const mappedDevices = backendDevices.map(mapDevice);
    setDevices(mappedDevices);
    setUsage(backendUsage ? mapUsage(backendUsage) : computeUsageFromDevices(mappedDevices));
  }, []);

  const refreshFromRest = useCallback(async () => {
    const [devicesResponse, usageResponse, alertsResponse] = await Promise.all([
      fetch(`${API_URL}/api/devices/`),
      fetch(`${API_URL}/api/devices/stats/usage`),
      fetch(`${API_URL}/api/devices/stats/alerts?limit=20`),
    ]);

    if (!devicesResponse.ok) throw new Error(`Devices request failed: ${devicesResponse.status}`);
    if (!usageResponse.ok) throw new Error(`Usage request failed: ${usageResponse.status}`);
    if (!alertsResponse.ok) throw new Error(`Alerts request failed: ${alertsResponse.status}`);

    const devicesJson = await devicesResponse.json();
    const usageJson = await usageResponse.json();
    const alertsJson = await alertsResponse.json();

    applyDevices(devicesJson.devices || [], usageJson);
    setAlerts((alertsJson.alerts || []).map(mapAlert));
    setError(null);
  }, [applyDevices]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = retryDelayRef.current;
    retryDelayRef.current = Math.min(delay * 1.5, 30000);
    retryTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        connectWebSocket();
      }
    }, delay);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current) return;

    setWsStatus('connecting');
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      retryDelayRef.current = 1000;
      setWsStatus('connected');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'snapshot') {
          const data = message.data as SnapshotPayload;
          applyDevices(data.devices || [], data.usage);
          setAlerts((data.alerts || []).map(mapAlert));
          return;
        }

        if (message.type === 'device_update') {
          const nextDevice = mapDevice(message.data as BackendDevice);
          setDevices((previous) => {
            const nextDevices = previous.map((device) =>
              device.id === nextDevice.id ? nextDevice : device,
            );
            setUsage(computeUsageFromDevices(nextDevices));
            return nextDevices;
          });
          return;
        }

        if (message.type === 'alert') {
          setAlerts((previous) => [mapAlert(message.data as BackendAlert), ...previous].slice(0, 50));
        }
      } catch (parseError) {
        console.warn('Ignoring invalid WebSocket message', parseError);
      }
    };

    socket.onerror = () => {
      setError('WebSocket connection failed. Check that the backend is running.');
      socket.close();
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      if (!mountedRef.current) return;
      setWsStatus('disconnected');
      scheduleReconnect();
    };
  }, [applyDevices, scheduleReconnect]);

  const toggleDevice = useCallback(async (deviceId: string) => {
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'toggle', data: { device_id: deviceId } }));
      return;
    }

    const response = await fetch(`${API_URL}/api/devices/${deviceId}/toggle`, {
      method: 'POST',
    });
    if (!response.ok) {
      setError(`Toggle failed for ${deviceId}: ${response.status}`);
      return;
    }

    const payload = await response.json();
    const nextDevice = mapDevice(payload.device);
    setDevices((previous) => {
      const nextDevices = previous.map((device) =>
        device.id === nextDevice.id ? nextDevice : device,
      );
      setUsage(computeUsageFromDevices(nextDevices));
      return nextDevices;
    });
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    refreshFromRest().catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : 'Backend request failed');
    });
    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [connectWebSocket, refreshFromRest]);

  return {
    devices,
    alerts,
    usage,
    wsStatus,
    error,
    isLoading: devices.length === 0,
    setAlerts,
    toggleDevice,
  };
}
