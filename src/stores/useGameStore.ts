import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Запись рекорда для конкретной игры */
export interface GameRecord {
  score: number;
  date: string;
}

export type GameSettingsValue = string | number | boolean;
export type GameSettings = Record<string, GameSettingsValue>;
export type ProfileRecords = Record<string, GameRecord>;
export type GameRecords = Record<string, ProfileRecords>;

/** Предмет в инвентаре (для Case Opener) */
export interface InventoryItem {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  gradient: string;
  value: number;
}

interface GameState {
  /** Рекорды по играм */
  records: GameRecords;
  /** Настройки игр */
  gameSettings: Record<string, GameSettings>;
  /** Баланс монет (общий для всех игр) */
  coins: number;
  /** Инвентарь предметов */
  inventory: InventoryItem[];

  setRecord: (game: string, profileId: string, score: number) => void;
  getRecord: (game: string, profileId: string) => GameRecord | undefined;
  getBestRecord: (game: string) => GameRecord | undefined;
  setGameSettings: (game: string, patch: GameSettings) => void;
  resetGameSettings: (game: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      records: {},
      gameSettings: {},
      coins: 1000,
      inventory: [],

      setRecord: (game, profileId, score) => {
        const current = get().records[game]?.[profileId];
        if (!current || score > current.score) {
          set((s) => ({
            records: {
              ...s.records,
              [game]: {
                ...(s.records[game] ?? {}),
                [profileId]: { score, date: new Date().toISOString() },
              },
            },
          }));
        }
      },

      getRecord: (game, profileId) => get().records[game]?.[profileId],

      getBestRecord: (game) => {
        const gameRecords = Object.values(get().records[game] ?? {});
        if (gameRecords.length === 0) return undefined;
        return gameRecords.reduce((best, item) => (item.score > best.score ? item : best));
      },

      setGameSettings: (game, patch) =>
        set((s) => ({
          gameSettings: {
            ...s.gameSettings,
            [game]: {
              ...(s.gameSettings[game] ?? {}),
              ...patch,
            },
          },
        })),

      resetGameSettings: (game) =>
        set((s) => {
          const next = { ...s.gameSettings };
          delete next[game];
          return { gameSettings: next };
        }),

      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      spendCoins: (amount) => {
        if (get().coins >= amount) {
          set((s) => ({ coins: s.coins - amount }));
          return true;
        }
        return false;
      },

      addItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),

      removeItem: (id) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),

      resetAll: () => set({ records: {}, gameSettings: {}, coins: 1000, inventory: [] }),
    }),
    { name: 'gamehub-storage' }
  )
);
