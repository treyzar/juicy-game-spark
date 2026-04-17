import type { GameSettings } from '@/stores/useGameStore';

/** Делает стабильный ключ профиля из настроек игры */
export const buildProfileId = (settings: GameSettings) => {
  const entries = Object.entries(settings).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return 'default';
  return entries.map(([k, v]) => `${k}:${String(v)}`).join('|');
};

