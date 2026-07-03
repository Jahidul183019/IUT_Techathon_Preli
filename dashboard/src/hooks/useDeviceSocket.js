import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const BACKOFF_FACTOR = 1.5;

/**
 * Custom hook: manages the WebSocket connection to the backend.
 *
 * Returns:
 *   { devices, usage, alerts, wsStatus, toggleDevice }
 *
 * - On connect → receives "snapshot" → populates all state
 * - On "device_update" → patches the single device in state
 * - On "alert" → prepends to alerts list
 * - Auto-reconnects with exponential backoff on disconnect
 */
export function useDeviceSocket() {
  const [devices, setDevices] = useState([]);
  const [usage, setUsage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');

  const wsRef = useRef(null);
  const retryRef = useRef(INITIAL_RETRY_MS);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Recompute usage from devices
  const computeUsage = useCallback((devs) => {
    const rooms = {};
    for (const d of devs) {
      if (!rooms[d.room]) {
        rooms[d.room] = { room_id: d.room, room_name: formatRoomName(d.room), active_devices: 0, total_devices: 0, current_watts: 0 };
      }
      rooms[d.room].total_devices++;
      if (d.status) {
        rooms[d.room].active_devices++;
        rooms[d.room].current_watts += d.wattage;
      }
    }
    const roomList = Object.values(rooms);
    return {
      total_watts: roomList.reduce((s, r) => s + r.current_watts, 0),
      total_devices: devs.length,
      active_devices: devs.filter(d => d.status).length,
      rooms: roomList,
    };
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        setWsStatus('connected');
        retryRef.current = INITIAL_RETRY_MS; // Reset backoff on success
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'snapshot':
              setDevices(msg.data.devices || []);
              setUsage(msg.data.usage || null);
              setAlerts(msg.data.alerts || []);
              break;

            case 'device_update':
              setDevices(prev => {
                const updated = prev.map(d =>
                  d.id === msg.data.device_id
                    ? { ...d, ...msg.data, id: msg.data.device_id }
                    : d
                );
                // Recompute usage from updated devices
                setUsage(computeUsage(updated));
                return updated;
              });
              break;

            case 'alert':
              setAlerts(prev => [msg.data, ...prev].slice(0, 50));
              break;

            case 'pong':
              break; // heartbeat response, ignore

            default:
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setWsStatus('disconnected');
      scheduleReconnect();
    }
  }, [computeUsage]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    const delay = retryRef.current;
    retryRef.current = Math.min(delay * BACKOFF_FACTOR, MAX_RETRY_MS);

    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  // Toggle a device via WebSocket
  const toggleDevice = useCallback((deviceId) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'toggle', data: { device_id: deviceId } }));
    }
  }, []);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { devices, usage, alerts, wsStatus, toggleDevice };
}

// Helper: "work_room_1" → "Work Room 1"
function formatRoomName(slug) {
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
