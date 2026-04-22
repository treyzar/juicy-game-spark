import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/useGameStore';
import { Gamepad2, Coins, Trophy, QrCode } from 'lucide-react';
import { EasterEgg67 } from '@/components/EasterEgg67';
import { toast } from '@/components/ui/use-toast';

interface GameCardData {
  id: string;
  title: string;
  description: string;
  path: string;
  gradient: string;
  icon: string;
}

const GAMES: GameCardData[] = [
  { id: 'snake', title: 'Змейка', description: 'Классическая змейка с неоновым свечением', path: '/snake', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)', icon: '🐍' },
  { id: 'colormatch', title: 'Угадай Цвет', description: 'Игра на реакцию с эффектом Струпа', path: '/colormatch', gradient: 'linear-gradient(135deg, #ec4899, #f97316)', icon: '🎨' },
  { id: 'memory', title: 'Карты Памяти', description: '16 карт с градиентами для поиска пар', path: '/memory', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', icon: '🃏' },
  { id: 'crash', title: 'РАКЕТКА', description: 'Забери выигрыш до краша!', path: '/crash', gradient: 'linear-gradient(135deg, #f97316, #ef4444)', icon: '🚀' },
  { id: 'cases', title: 'КЕЙСБАТЛ', description: 'Открывай кейсы, улучшай предметы', path: '/cases', gradient: 'linear-gradient(135deg, #eab308, #a855f7)', icon: '📦' },
  { id: 'trader', title: 'Турбо Трейдер', description: 'Торгуй на неоновом рынке', path: '/trader', gradient: 'linear-gradient(135deg, #22c55e, #06b6d4)', icon: '📈' },
];

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_TIMEOUT_SECONDS = Math.floor(IDLE_TIMEOUT_MS / 1000);
const ATTRACT_MESSAGES = [
  'Поиграй в меня, я скучаю',
  'Нажми на экран, и начнётся веселье',
  'Забери новый рекорд прямо сейчас',
  'Выбери игру, я уже готов',
];
const DAILY_BONUS_STORAGE_KEY = 'gamehub-daily-bonus-date';
const FLASH_CHALLENGE_INTERVAL_MS = 25_000;
const FLASH_CHALLENGE_DURATION_MS = 10_000;

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
  amount: number;
}

interface FlashChallenge {
  id: number;
  gameId: string;
  title: string;
  reward: number;
  expiresAt: number;
}

interface EmojiQuiz {
  emoji: string;
  correctGameId: string;
  options: string[];
}

const getTodayStamp = () => new Date().toISOString().slice(0, 10);
const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

/** Главная страница GameHub */
const Index = () => {
  const navigate = useNavigate();
  const { coins, records, getBestRecord, addCoins } = useGameStore();
  const [isIdle, setIsIdle] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [dailyBonusReady, setDailyBonusReady] = useState(false);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteIndex, setRouletteIndex] = useState<number | null>(null);
  const [floatingCoin, setFloatingCoin] = useState<FloatingCoin | null>(null);
  const [flashChallenge, setFlashChallenge] = useState<FlashChallenge | null>(null);
  const [challengeNow, setChallengeNow] = useState(Date.now());
  const [quiz, setQuiz] = useState<EmojiQuiz | null>(null);
  const [logoCombo, setLogoCombo] = useState(0);
  const [logoBurst, setLogoBurst] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const rouletteTimeoutRef = useRef<number | null>(null);
  const rouletteIntervalRef = useRef<number | null>(null);
  const challengeIntervalRef = useRef<number | null>(null);
  const challengeTimeoutRef = useRef<number | null>(null);
  const logoComboResetRef = useRef<number | null>(null);
  const logoBurstTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const bonusDate = window.localStorage.getItem(DAILY_BONUS_STORAGE_KEY);
    setDailyBonusReady(bonusDate !== getTodayStamp());
  }, []);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle((prev) => (prev ? false : prev));
    };

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'wheel',
      'touchstart',
      'scroll',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const idleCheckTimer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remainingSeconds = Math.max(0, IDLE_TIMEOUT_SECONDS - elapsedSeconds);

      console.log(
        `[IdleTimer] Прошло: ${elapsedSeconds}с, осталось: ${remainingSeconds}с до спящего режима`
      );

      if (remainingSeconds === 0) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.clearInterval(idleCheckTimer);
    };
  }, []);

  useEffect(() => {
    if (!isIdle) {
      setMessageIndex(0);
      return;
    }

    const messageTimer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ATTRACT_MESSAGES.length);
    }, 2500);

    return () => window.clearInterval(messageTimer);
  }, [isIdle]);

  useEffect(
    () => () => {
      if (rouletteTimeoutRef.current !== null) {
        window.clearTimeout(rouletteTimeoutRef.current);
      }
      if (rouletteIntervalRef.current !== null) {
        window.clearInterval(rouletteIntervalRef.current);
      }
      if (challengeIntervalRef.current !== null) {
        window.clearInterval(challengeIntervalRef.current);
      }
      if (challengeTimeoutRef.current !== null) {
        window.clearTimeout(challengeTimeoutRef.current);
      }
      if (logoComboResetRef.current !== null) {
        window.clearTimeout(logoComboResetRef.current);
      }
      if (logoBurstTimeoutRef.current !== null) {
        window.clearTimeout(logoBurstTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const spawnTimer = window.setInterval(() => {
      setFloatingCoin((current) => {
        if (current || isIdle) return current;
        return {
          id: Date.now(),
          x: 10 + Math.random() * 80,
          y: 22 + Math.random() * 58,
          amount: 40 + Math.floor(Math.random() * 111),
        };
      });
    }, 9000);

    return () => window.clearInterval(spawnTimer);
  }, [isIdle]);

  useEffect(() => {
    if (!floatingCoin) return;
    const hideTimer = window.setTimeout(() => {
      setFloatingCoin((current) => (current?.id === floatingCoin.id ? null : current));
    }, 5500);
    return () => window.clearTimeout(hideTimer);
  }, [floatingCoin]);

  useEffect(() => {
    if (isIdle) return;
    challengeIntervalRef.current = window.setInterval(() => {
      setFlashChallenge((current) => {
        if (current || isRouletteSpinning) return current;
        const game = pickRandom(GAMES);
        return {
          id: Date.now(),
          gameId: game.id,
          title: game.title,
          reward: 80 + Math.floor(Math.random() * 151),
          expiresAt: Date.now() + FLASH_CHALLENGE_DURATION_MS,
        };
      });
    }, FLASH_CHALLENGE_INTERVAL_MS);

    return () => {
      if (challengeIntervalRef.current !== null) {
        window.clearInterval(challengeIntervalRef.current);
        challengeIntervalRef.current = null;
      }
    };
  }, [isIdle, isRouletteSpinning]);

  useEffect(() => {
    if (!flashChallenge) return;

    setChallengeNow(Date.now());
    const countdownTimer = window.setInterval(() => setChallengeNow(Date.now()), 250);
    const ttl = Math.max(0, flashChallenge.expiresAt - Date.now());
    challengeTimeoutRef.current = window.setTimeout(() => {
      setFlashChallenge((current) => {
        if (current?.id !== flashChallenge.id) return current;
        toast({
          title: 'Флэш-челлендж завершён',
          description: 'Ты не успел выполнить задание.',
        });
        return null;
      });
    }, ttl);

    return () => {
      window.clearInterval(countdownTimer);
      if (challengeTimeoutRef.current !== null) {
        window.clearTimeout(challengeTimeoutRef.current);
        challengeTimeoutRef.current = null;
      }
    };
  }, [flashChallenge]);

  const claimDailyBonus = () => {
    if (!dailyBonusReady) return;
    const bonus = 120 + Math.floor(Math.random() * 381);
    addCoins(bonus);
    window.localStorage.setItem(DAILY_BONUS_STORAGE_KEY, getTodayStamp());
    setDailyBonusReady(false);
    toast({
      title: 'Ежедневный бонус получен',
      description: `+${bonus} монет уже на балансе.`,
    });
  };

  const startRoulette = () => {
    if (isRouletteSpinning) return;

    setIsRouletteSpinning(true);
    let ticks = 0;
    const maxTicks = 18 + Math.floor(Math.random() * 14);
    let current = Math.floor(Math.random() * GAMES.length);

    rouletteIntervalRef.current = window.setInterval(() => {
      current = (current + 1) % GAMES.length;
      ticks += 1;
      setRouletteIndex(current);

      if (ticks < maxTicks) return;
      if (rouletteIntervalRef.current !== null) {
        window.clearInterval(rouletteIntervalRef.current);
        rouletteIntervalRef.current = null;
      }
      setIsRouletteSpinning(false);
      const selectedGame = GAMES[current];

      toast({
        title: `Рулетка выбрала: ${selectedGame.title}`,
        description: 'Переходим в игру...',
      });

      rouletteTimeoutRef.current = window.setTimeout(() => {
        setRouletteIndex(null);
        openGame(selectedGame);
      }, 650);
    }, 90);
  };

  const catchFloatingCoin = () => {
    if (!floatingCoin) return;
    addCoins(floatingCoin.amount);
    toast({
      title: 'Быстрый трофей',
      description: `Ты поймал бонусную монету: +${floatingCoin.amount}`,
    });
    setFloatingCoin(null);
  };

  const startEmojiQuiz = () => {
    const correctGame = pickRandom(GAMES);
    const incorrect = shuffle(GAMES.filter((g) => g.id !== correctGame.id))
      .slice(0, 2)
      .map((g) => g.id);
    setQuiz({
      emoji: correctGame.icon,
      correctGameId: correctGame.id,
      options: shuffle([correctGame.id, ...incorrect]),
    });
  };

  const answerEmojiQuiz = (gameId: string) => {
    if (!quiz) return;
    const correctGame = GAMES.find((g) => g.id === quiz.correctGameId);
    if (!correctGame) return;

    if (gameId === quiz.correctGameId) {
      const reward = 70 + Math.floor(Math.random() * 91);
      addCoins(reward);
      toast({
        title: 'Верно!',
        description: `+${reward} монет за правильный ответ.`,
      });
    } else {
      toast({
        title: 'Почти угадал',
        description: `Правильный ответ: ${correctGame.title}`,
      });
    }
    setQuiz(null);
  };

  const triggerLogoCombo = () => {
    if (logoComboResetRef.current !== null) {
      window.clearTimeout(logoComboResetRef.current);
    }

    setLogoCombo((prev) => {
      const next = prev + 1;
      if (next < 7) return next;

      const reward = 220 + Math.floor(Math.random() * 341);
      addCoins(reward);
      setLogoBurst(true);
      if (logoBurstTimeoutRef.current !== null) {
        window.clearTimeout(logoBurstTimeoutRef.current);
      }
      logoBurstTimeoutRef.current = window.setTimeout(() => {
        setLogoBurst(false);
      }, 1300);
      toast({
        title: 'Секретный резонанс!',
        description: `Серия 7/7. Бонус: +${reward} монет.`,
      });
      return 0;
    });

    logoComboResetRef.current = window.setTimeout(() => {
      setLogoCombo(0);
    }, 1600);
  };

  const openGame = (game: GameCardData) => {
    if (flashChallenge) {
      if (flashChallenge.gameId === game.id) {
        addCoins(flashChallenge.reward);
        toast({
          title: 'Флэш-челлендж выполнен',
          description: `+${flashChallenge.reward} монет за быстрый выбор ${flashChallenge.title}.`,
        });
      } else {
        toast({
          title: 'Челлендж не засчитан',
          description: `Нужно было выбрать «${flashChallenge.title}».`,
        });
      }
      setFlashChallenge(null);
    }
    navigate(game.path);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <EasterEgg67 />
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <motion.h1
            onClick={triggerLogoCombo}
            animate={
              logoBurst
                ? { scale: [1, 1.08, 1], rotate: [0, -1, 1, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.45 }}
            className="text-4xl md:text-6xl font-black font-mono cursor-pointer select-none"
          >
            <span className="text-gradient-primary">Game</span>
            <span className="text-gradient-secondary">Hub</span>
          </motion.h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">Портал Микро-Приключений</p>
        {logoCombo > 0 && (
          <p className="mt-2 text-xs md:text-sm font-mono text-neon-cyan animate-pulse-neon">
            Резонанс: {logoCombo}/7
          </p>
        )}

        {/* Stats bar */}
        <div className="mt-4 inline-flex flex-wrap justify-center gap-4 md:gap-6 glass-strong px-4 md:px-6 py-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-neon-yellow" />
            <span className="font-mono font-bold">{coins}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-sm text-muted-foreground">
              {Object.keys(records).length} рекордов
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={claimDailyBonus}
            disabled={!dailyBonusReady}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-mono text-sm ${
              dailyBonusReady
                ? 'btn-neon text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
          >
            🎁 {dailyBonusReady ? 'Забрать бонус дня' : 'Бонус дня уже получен'}
          </button>
          <button
            onClick={startRoulette}
            disabled={isRouletteSpinning}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-mono text-sm ${
              isRouletteSpinning
                ? 'bg-muted/60 text-muted-foreground'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-300/25'
            }`}
          >
            🎲 {isRouletteSpinning ? 'Рулетка крутится...' : 'Случайная игра'}
          </button>
          <button
            onClick={startEmojiQuiz}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-100 border border-violet-300/25 transition-colors font-mono text-sm"
          >
            🧠 Мини-викторина
          </button>
          <button
            onClick={() => navigate('/qr')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors font-mono text-sm"
          >
            <QrCode className="w-4 h-4 text-neon-cyan" />
            QR для телефонов
          </button>
        </div>

        {flashChallenge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mx-auto max-w-2xl rounded-2xl border border-amber-300/40 bg-amber-400/15 px-4 py-3 text-sm font-mono"
          >
            ⚡ Флэш-челлендж: выбери игру <b>{flashChallenge.title}</b> за{' '}
            {Math.max(0, Math.ceil((flashChallenge.expiresAt - challengeNow) / 1000))}с и получи{' '}
            <b>+{flashChallenge.reward}</b> монет.
          </motion.div>
        )}

        {quiz && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 mx-auto max-w-2xl glass-strong rounded-2xl p-4"
          >
            <p className="text-sm text-muted-foreground font-mono mb-2">Угадай игру по эмодзи</p>
            <p className="text-4xl mb-3">{quiz.emoji}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quiz.options.map((optionId) => {
                const game = GAMES.find((g) => g.id === optionId);
                if (!game) return null;
                return (
                  <button
                    key={optionId}
                    onClick={() => answerEmojiQuiz(optionId)}
                    className="px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-sm font-mono"
                  >
                    {game.title}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Game Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {GAMES.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openGame(game)}
            className={`glass group text-left p-5 rounded-2xl transition-shadow hover:neon-glow-purple cursor-pointer ${
              rouletteIndex === i
                ? 'ring-2 ring-neon-cyan neon-glow-cyan scale-[1.03]'
                : ''
            }`}
          >
            <div className="w-full h-24 rounded-xl mb-4 flex items-center justify-center text-4xl"
              style={{ background: game.gradient }}>
              {game.icon}
            </div>
            <h2 className="font-bold text-lg font-mono mb-1 group-hover:text-primary transition-colors">
              {game.title}
            </h2>
            <p className="text-sm text-muted-foreground">{game.description}</p>
            {getBestRecord(game.id) && (
              <p className="mt-2 text-xs font-mono text-neon-yellow">
                🏆 Лучший: {getBestRecord(game.id)?.score}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {floatingCoin && !isIdle && (
          <motion.button
            key={floatingCoin.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -8, 0, -6, 0] }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={catchFloatingCoin}
            className="fixed z-40 w-16 h-16 rounded-full border border-yellow-200/60 bg-yellow-300/20 backdrop-blur-md shadow-[0_0_35px_rgba(251,191,36,0.55)] text-3xl"
            style={{ left: `${floatingCoin.x}%`, top: `${floatingCoin.y}%` }}
            aria-label="Поймать бонусную монету"
          >
            🪙
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-6"
          >
            <motion.div
              className="absolute -top-24 -left-12 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl"
              animate={{ x: [0, 40, -20, 0], y: [0, 20, -10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl"
              animate={{ x: [0, -35, 20, 0], y: [0, -30, 10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/3 right-1/3 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="absolute inset-0 bg-background/75 backdrop-blur-md" />

            <div className="relative z-10 text-center max-w-3xl w-full">
              <div className="rounded-3xl p-[1px] bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-300 shadow-[0_0_55px_rgba(168,85,247,0.45)]">
                <div className="rounded-3xl bg-card/85 backdrop-blur-2xl px-5 md:px-10 py-8 md:py-12">
                  <motion.p
                    key={ATTRACT_MESSAGES[messageIndex]}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="text-2xl md:text-5xl font-black font-mono text-gradient-primary"
                  >
                    {ATTRACT_MESSAGES[messageIndex]}
                  </motion.p>
                  <p className="mt-4 text-sm md:text-base text-foreground/85 font-mono animate-pulse-neon">
                    Коснись экрана, чтобы продолжить
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
