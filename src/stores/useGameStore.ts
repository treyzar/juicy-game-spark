import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Запись рекорда для конкретной игры */
export interface GameRecord {
  score: number;
  date: string;
}

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
  records: Record<string, GameRecord>;
  /** Баланс монет (общий для всех игр) */
  coins: number;
  /** Инвентарь предметов */
  inventory: InventoryItem[];

  setRecord: (game: string, score: number) => void;
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
      coins: 1000,
      inventory: [],

      setRecord: (game, score) => {
        const current = get().records[game];
        if (!current || score > current.score) {
          set((s) => ({
            records: {
              ...s.records,
              [game]: { score, date: new Date().toISOString() },
            },
          }));
        }
      },

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

      resetAll: () => set({ records: {}, coins: 1000, inventory: [] }),
    }),
    { name: 'gamehub-storage' }
  )
);
