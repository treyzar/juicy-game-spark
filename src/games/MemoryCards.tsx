import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { sfxFlip, sfxMatch, sfxWrong, sfxWin } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';

const GRADIENTS = [
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #22c55e, #06b6d4)',
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #eab308, #f97316)',
  'linear-gradient(135deg, #8b5cf6, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #f97316)',
  'linear-gradient(135deg, #14b8a6, #8b5cf6)',
];

interface Card {
  id: number;
  gradientIdx: number;
  flipped: boolean;
  matched: boolean;
}

/** Memory Cards — 16 карточек с градиентами и flip-эффектом */
const MemoryCards = () => {
  const GAME_ID = 'memory';
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const { gameSettings, getRecord, setRecord, setGameSettings } = useGameStore();
  const [gridSize, setGridSize] = useState(Number(gameSettings[GAME_ID]?.gridSize ?? 4));
  const flipBackDelayMs = Number(gameSettings[GAME_ID]?.flipBackDelayMs ?? 800);
  const profileId = buildProfileId({ gridSize, flipBackDelayMs });
  const profileRecord = getRecord(GAME_ID, profileId);

  useEffect(() => {
    const persisted = Number(gameSettings[GAME_ID]?.gridSize ?? 4);
    if (persisted !== gridSize) setGridSize(persisted);
  }, [GAME_ID, gameSettings, gridSize]);

  const initGame = useCallback(() => {
    const pairCount = (gridSize * gridSize) / 2;
    const pairs = [...Array(pairCount)].flatMap((_, i) => [
      { id: i * 2, gradientIdx: i % GRADIENTS.length, flipped: false, matched: false },
      { id: i * 2 + 1, gradientIdx: i % GRADIENTS.length, flipped: false, matched: false },
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
    setMoves(0);
    setSelected([]);
    setLocked(false);
  }, [gridSize]);

  const handleFlip = (idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched) return;
    sfxFlip();

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newSelected = [...selected, idx];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);

      const [a, b] = newSelected;
      if (newCards[a].gradientIdx === newCards[b].gradientIdx) {
        sfxMatch();
        newCards[a].matched = true;
        newCards[b].matched = true;
        setCards([...newCards]);
        setSelected([]);
        setLocked(false);

        if (newCards.every(c => c.matched)) {
          sfxWin();
          setRecord(GAME_ID, profileId, Math.max(1, 100 - moves));
        }
      } else {
        sfxWrong();
        setTimeout(() => {
          newCards[a].flipped = false;
          newCards[b].flipped = false;
          setCards([...newCards]);
          setSelected([]);
          setLocked(false);
        }, flipBackDelayMs);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every(c => c.matched);

  return (
    <GameContainer
      title="MEMORY CARDS"
      score={moves}
      highScore={profileRecord?.score}
      onRestart={initGame}
      profileLabel={`Профиль: ${gridSize}x${gridSize} / ${flipBackDelayMs}ms`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Размер поля</p>
            <div className="flex gap-2 flex-wrap">
              {[2, 4, 6].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setGridSize(size);
                    setGameSettings(GAME_ID, { gridSize: size });
                    setCards([]);
                  }}
                  className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                    gridSize === size ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Пауза после ошибки</p>
            <div className="flex gap-2 flex-wrap">
              {[600, 800, 1000].map((delay) => (
                <button
                  key={delay}
                  onClick={() => {
                    setGameSettings(GAME_ID, { flipBackDelayMs: delay });
                    setCards([]);
                  }}
                  className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                    flipBackDelayMs === delay ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {delay}ms
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="p-3 md:p-6 w-full max-w-lg mx-auto">
        {cards.length === 0 ? (
          <div className="text-center animate-fade-in">
            <p className="text-2xl font-bold mb-4">Карты Памяти</p>
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              {[2, 4, 6].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setGridSize(size);
                    setGameSettings(GAME_ID, { gridSize: size });
                  }}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all min-h-11 ${
                    gridSize === size ? 'btn-neon text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
            <button onClick={initGame} className="btn-neon px-8 py-3 rounded-xl text-primary-foreground text-lg">
              Старт
            </button>
          </div>
        ) : (
          <>
            {allMatched && (
              <div className="text-center mb-4 animate-scale-in">
                <p className="text-2xl font-bold text-gradient-primary">🎉 Завершено за {moves} ходов!</p>
              </div>
            )}
            <div className={`grid gap-1.5 sm:gap-2 md:gap-3`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              className="aspect-square cursor-pointer perspective-1000"
              onClick={() => handleFlip(idx)}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Back */}
                <div
                  className="absolute inset-0 rounded-xl glass border-2 border-border/30 flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-lg sm:text-2xl text-muted-foreground">?</span>
                </div>
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-xl border-2 border-border/30"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: GRADIENTS[card.gradientIdx],
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
          </>
        )}
      </div>
    </GameContainer>
  );
};

export default MemoryCards;
