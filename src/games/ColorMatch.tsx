import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { sfxCollect, sfxWrong, sfxWin, sfxCountdown } from '@/lib/sounds';

const COLORS = [
  { name: 'КРАСНЫЙ', hsl: 'hsl(0 80% 55%)' },
  { name: 'СИНИЙ', hsl: 'hsl(220 90% 55%)' },
  { name: 'ЗЕЛЁНЫЙ', hsl: 'hsl(145 80% 45%)' },
  { name: 'ЖЁЛТЫЙ', hsl: 'hsl(50 90% 50%)' },
  { name: 'РОЗОВЫЙ', hsl: 'hsl(330 90% 60%)' },
  { name: 'ГОЛУБОЙ', hsl: 'hsl(190 90% 50%)' },
];

/** Color Match — Stroop-эффект, игра на реакцию */
const ColorMatch = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [displayText, setDisplayText] = useState(COLORS[1]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef<number>(0);
  const { records, setRecord } = useGameStore();

  const generateRound = useCallback(() => {
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const correctColor = shuffled[0]; // actual color to display text in
    let wrongText: typeof COLORS[0];
    do {
      wrongText = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (wrongText.name === correctColor.name);

    setTextColor(correctColor);
    setDisplayText(wrongText); // text says one color...
    
    // Options: include the correct answer (the COLOR the text is displayed in)
    const opts = [correctColor];
    const remaining = COLORS.filter(c => c.name !== correctColor.name).sort(() => Math.random() - 0.5);
    opts.push(remaining[0], remaining[1]);
    setOptions(opts.sort(() => Math.random() - 0.5));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setFeedback(null);
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (!gameActive) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive && timeLeft === 0 && score > 0) {
      sfxWin();
      setRecord('colormatch', score);
    }
  }, [gameActive, timeLeft, score, setRecord]);

  const handleChoice = (color: typeof COLORS[0]) => {
    if (!gameActive) return;
    if (color.name === textColor.name) {
      setScore(s => s + 1);
      sfxCollect();
      setFeedback('correct');
    } else {
      setScore(s => Math.max(0, s - 1));
      sfxWrong();
      setFeedback('wrong');
    }
    setTimeout(() => setFeedback(null), 300);
    generateRound();
  };

  return (
    <GameContainer
      title="COLOR MATCH"
      score={score}
      highScore={records.colormatch?.score}
      onRestart={startGame}
    >
      <div className="flex flex-col items-center justify-center gap-8 p-6 w-full max-w-md mx-auto">
        {!gameActive && timeLeft === 30 ? (
          <div className="text-center animate-fade-in">
            <p className="text-2xl font-bold mb-2">Выбери ЦВЕТ текста</p>
            <p className="text-muted-foreground mb-6">Не читай слово — смотри на цвет!</p>
            <button onClick={startGame} className="btn-neon px-8 py-3 rounded-xl text-primary-foreground text-lg">
              Старт
            </button>
          </div>
        ) : !gameActive ? (
          <div className="text-center animate-scale-in">
            <p className="text-4xl font-bold text-gradient-primary mb-2">ВРЕМЯ ВЫШЛО!</p>
            <p className="text-muted-foreground font-mono text-xl">Счёт: {score}</p>
            <button onClick={startGame} className="mt-4 btn-neon px-6 py-2 rounded-lg text-primary-foreground">
              Играть снова
            </button>
          </div>
        ) : (
          <>
            <div className="text-sm font-mono text-muted-foreground">
              ⏱ {timeLeft}s
            </div>

            <motion.div
              key={displayText.name + textColor.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl md:text-7xl font-black font-mono select-none ${
                feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'screen-shake' : ''
              }`}
              style={{ color: textColor.hsl }}
            >
              {displayText.name}
            </motion.div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {options.map((opt) => (
                <motion.button
                  key={opt.name}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleChoice(opt)}
                  className="glass p-4 rounded-xl font-bold transition-all hover:scale-105"
                  style={{ backgroundColor: opt.hsl, color: 'white' }}
                >
                  {opt.name}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
    </GameContainer>
  );
};

export default ColorMatch;
