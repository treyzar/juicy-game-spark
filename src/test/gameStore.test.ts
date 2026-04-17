import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/useGameStore';

describe('useGameStore settings and profile records', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
  });

  it('merges game settings patches', () => {
    const state = useGameStore.getState();
    state.setGameSettings('snake', { difficulty: 'hard' });
    state.setGameSettings('snake', { wallMode: 'solid' });

    expect(useGameStore.getState().gameSettings.snake).toEqual({
      difficulty: 'hard',
      wallMode: 'solid',
    });
  });

  it('stores records independently by profile', () => {
    const state = useGameStore.getState();
    state.setRecord('snake', 'difficulty:easy', 10);
    state.setRecord('snake', 'difficulty:hard', 6);
    state.setRecord('snake', 'difficulty:hard', 8);
    state.setRecord('snake', 'difficulty:hard', 7);

    expect(state.getRecord('snake', 'difficulty:easy')?.score).toBe(10);
    expect(state.getRecord('snake', 'difficulty:hard')?.score).toBe(8);
  });

  it('returns best record across all profiles of one game', () => {
    const state = useGameStore.getState();
    state.setRecord('trader', 'session:30', 1200);
    state.setRecord('trader', 'session:90', 1800);
    state.setRecord('trader', 'session:60', 1600);

    expect(state.getBestRecord('trader')?.score).toBe(1800);
  });
});
