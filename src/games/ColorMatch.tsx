import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { sfxCollect, sfxWrong, sfxWin, sfxCountdown } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const GAME_ID = 'colormatch';
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [displayText, setDisplayText] = useState(COLORS[1]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef<number>(0);
  const { gameSettings, getRecord, setRecord, setGameSettings } = useGameStore();
  const roundTime = Number(gameSettings[GAME_ID]?.roundTime ?? 30);
  const optionsCount = Number(gameSettings[GAME_ID]?.optionsCount ?? 3);
  const isMobile = useIsMobile();
  const profileId = buildProfileId({ roundTime, optionsCount });
  const profileRecord = getRecord(GAME_ID, profileId);
  const optionColumns = isMobile && optionsCount >= 4 ? 2 : Math.min(optionsCount, 3);

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
    opts.push(...remaining.slice(0, Math.max(1, optionsCount - 1)));
    setOptions(opts.sort(() => Math.random() - 0.5));
  }, [optionsCount]);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(roundTime);
    setGameActive(true);
    setFeedback(null);
    generateRound();
  }, [generateRound, roundTime]);

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
      setRecord(GAME_ID, profileId, score);
    }
  }, [GAME_ID, gameActive, profileId, score, setRecord, timeLeft]);

  useEffect(() => {
    if (!gameActive) {
      setTimeLeft(roundTime);
    }
  }, [gameActive, roundTime]);

  const applySetting = (patch: { roundTime?: number; optionsCount?: number }) => {
    setGameSettings(GAME_ID, patch);
    setGameActive(false);
    setTimeLeft(Number(patch.roundTime ?? roundTime));
    setScore(0);
    setFeedback(null);
  };

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
      highScore={profileRecord?.score}
      onRestart={startGame}
      profileLabel={`Профиль: ${roundTime}s / ${optionsCount} варианта`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Длительность раунда</p>
            <div className="flex gap-2 flex-wrap">
              {[30, 45, 60].map((value) => (
                <button
                  key={value}
                  onClick={() => applySetting({ roundTime: value })}
                  className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                    roundTime === value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {value}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Количество вариантов</p>
            <div className="flex gap-2 flex-wrap">
              {[3, 4].map((value) => (
                <button
                  key={value}
                  onClick={() => applySetting({ optionsCount: value })}
                  className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                    optionsCount === value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center gap-6 md:gap-8 p-4 md:p-6 w-full max-w-md mx-auto">
        {!gameActive && timeLeft === roundTime ? (
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
              className={`text-4xl sm:text-5xl md:text-7xl font-black font-mono select-none text-center break-words ${
                feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'screen-shake' : ''
              }`}
              style={{ color: textColor.hsl }}
            >
              {displayText.name}
            </motion.div>

            <div className="grid gap-2.5 md:gap-3 w-full" style={{ gridTemplateColumns: `repeat(${optionColumns}, minmax(0, 1fr))` }}>
              {options.map((opt) => (
                <motion.button
                  key={opt.name}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleChoice(opt)}
                  className="glass p-3 md:p-4 min-h-12 rounded-xl font-bold transition-all hover:scale-105 text-sm sm:text-base"
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
