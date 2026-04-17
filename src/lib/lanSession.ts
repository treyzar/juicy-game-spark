export interface LanCommand {
  id: string;
  type: 'topup';
  amount: number;
  reason?: string;
  createdAt: number;
}

export interface LanSessionInfo {
  sessionId: string;
  label: string;
  coins: number;
  path: string;
  ip: string;
  lastSeen: number;
}

const DEFAULT_LAN_SERVER_URL = 'http://localhost:8787';
const SESSION_ID_KEY = 'gamehub-lan-session-id';
const PLAYER_LABEL_KEY = 'gamehub-lan-player-label';

export const getLanServerUrl = () =>
  (import.meta.env.VITE_LAN_SERVER_URL as string | undefined)?.trim() || DEFAULT_LAN_SERVER_URL;

export const getLanSessionId = () => {
  const existing = sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_KEY, id);
  return id;
};

export const getLanPlayerLabel = () => {
  const existing = localStorage.getItem(PLAYER_LABEL_KEY);
  if (existing) return existing;
  const label = `Player-${Math.floor(Math.random() * 9000 + 1000)}`;
  localStorage.setItem(PLAYER_LABEL_KEY, label);
  return label;
};

export const sendHeartbeat = async (payload: {
  sessionId: string;
  label: string;
  coins: number;
  path: string;
}) => {
  const response = await fetch(`${getLanServerUrl()}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Heartbeat failed');
  return (await response.json()) as { ok: boolean; commands: LanCommand[] };
};

export const fetchLanSessions = async () => {
  const response = await fetch(`${getLanServerUrl()}/sessions`);
  if (!response.ok) throw new Error('Sessions fetch failed');
  return (await response.json()) as { ok: boolean; sessions: LanSessionInfo[] };
};

export const sendTopupCommand = async (sessionId: string, amount: number) => {
  const response = await fetch(`${getLanServerUrl()}/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, amount }),
  });
  if (!response.ok) throw new Error('Topup failed');
  return (await response.json()) as { ok: boolean };
};

