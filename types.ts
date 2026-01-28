
export interface TrafficNode {
  id: string;
  x: number;
  y: number;
  label: string;
  congestion: number; // 0 to 1
}

export interface TrafficLink {
  id: string;
  source: string;
  target: string;
  speed: number;
  status: 'normal' | 'slow' | 'congested' | 'blocked';
}

export interface TrafficStats {
  averageSpeed: number;
  activeVehicles: number;
  congestionIndex: number;
  incidentsReported: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface TrafficViolation {
  id: string;
  type: 'speeding' | 'red_light' | 'wrong_way' | 'invalid_plate';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  location: string;
  details: string;
}
