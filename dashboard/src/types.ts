export interface Device {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'ac' | 'outlet' | 'sensor';
  room: 'Drawing Room' | 'Work Room 1' | 'Work Room 2';
  status: 'ON' | 'OFF';
  wattage: number; // Wattage when ON
  currentDraw: number;
  lastActivity: string;
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  timestamp: string;
  message: string;
}

export type ActiveTab = 'dashboard' | 'map' | 'analytics' | 'devices' | 'security';

export interface RoomPower {
  name: string;
  value: number;
  max: number;
  color: string;
}

export interface UsageRoom {
  room_id: string;
  room_name: Device['room'];
  active_devices: number;
  total_devices: number;
  current_watts: number;
}

export interface UsageStats {
  total_watts: number;
  total_devices: number;
  active_devices: number;
  estimated_kwh_today: number;
  hours_elapsed_today: number;
  rooms: UsageRoom[];
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
