import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { sfxFlip, sfxMatch, sfxWrong, sfxWin } from '@/lib/sounds';

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
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const { records, setRecord } = useGameStore();

  const initGame = useCallback(() => {
    const pairs = [...Array(8)].flatMap((_, i) => [
      { id: i * 2, gradientIdx: i, flipped: false, matched: false },
      { id: i * 2 + 1, gradientIdx: i, flipped: false, matched: false },
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
    setMoves(0);
    setSelected([]);
    setLocked(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

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
          setRecord('memory', Math.max(1, 100 - moves));
        }
      } else {
        sfxWrong();
        setTimeout(() => {
          newCards[a].flipped = false;
          newCards[b].flipped = false;
          setCards([...newCards]);
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every(c => c.matched);

  return (
    <GameContainer
      title="MEMORY CARDS"
      score={moves}
      highScore={records.memory?.score}
      onRestart={initGame}
    >
      <div className="p-4 md:p-6 w-full max-w-lg mx-auto">
        {allMatched && (
          <div className="text-center mb-4 animate-scale-in">
            <p className="text-2xl font-bold text-gradient-primary">🎉 Complete in {moves} moves!</p>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 md:gap-3">
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
                  <span className="text-2xl text-muted-foreground">?</span>
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
      </div>
    </GameContainer>
  );
};

export default MemoryCards;
