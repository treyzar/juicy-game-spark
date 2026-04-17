import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { sfxTradeOpen, sfxProfit, sfxLoss, sfxWin } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';

interface FloatingPnl {
  id: number;
  value: number;
  x: number;
}

const VOLATILITY = {
  low: 1.8,
  normal: 3,
  high: 4.8,
} as const;

/** Turbo Trader — симулятор скальпинга */
const TurboTrader = () => {
  const GAME_ID = 'trader';
  const [prices, setPrices] = useState<number[]>([100]);
  const [balance, setBalance] = useState(1000);
  const [position, setPosition] = useState<'long' | 'short' | null>(null);
  const [entryPrice, setEntryPrice] = useState(0);
  const [pnl, setPnl] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [trades, setTrades] = useState(0);
  const [wins, setWins] = useState(0);
  const [floatingPnls, setFloatingPnls] = useState<FloatingPnl[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameSettings, getRecord, setRecord, setGameSettings } = useGameStore();
  const sessionTime = Number(gameSettings[GAME_ID]?.sessionTime ?? 30);
  const volatility = (gameSettings[GAME_ID]?.volatility as keyof typeof VOLATILITY) ?? 'normal';
  const profileId = buildProfileId({ sessionTime, volatility });
  const profileRecord = getRecord(GAME_ID, profileId);

  const currentPrice = prices[prices.length - 1];

  const startGame = useCallback(() => {
    setPrices([100]);
    setBalance(1000);
    setPosition(null);
    setPnl(0);
    setTotalPnl(0);
    setTrades(0);
    setWins(0);
    setTimeLeft(sessionTime);
    setGameActive(true);
    setFloatingPnls([]);
  }, [sessionTime]);

  // Price generation
  useEffect(() => {
    if (!gameActive) return;
    const iv = setInterval(() => {
      setPrices(p => {
        const last = p[p.length - 1];
        const change = (Math.random() - 0.48) * VOLATILITY[volatility];
        const next = Math.max(10, last + change);
        return [...p.slice(-200), next];
      });
    }, 100);
    return () => clearInterval(iv);
  }, [gameActive, volatility]);

  // Timer
  useEffect(() => {
    if (!gameActive) return;
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [gameActive]);

  // Update PnL
  useEffect(() => {
    if (!position) return;
    const diff = position === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice;
    setPnl(Math.round(diff * 10));
  }, [currentPrice, position, entryPrice]);

  // Save record on end
  useEffect(() => {
    if (!gameActive && timeLeft === 0 && totalPnl !== 0) {
      sfxWin();
      setRecord(GAME_ID, profileId, Math.max(0, totalPnl + 1000));
    }
  }, [GAME_ID, gameActive, profileId, setRecord, timeLeft, totalPnl]);

  useEffect(() => {
    if (!gameActive) setTimeLeft(sessionTime);
  }, [gameActive, sessionTime]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, w, h);

    if (prices.length < 2) return;

    const displayPrices = prices.slice(-100);
    const min = Math.min(...displayPrices) - 2;
    const max = Math.max(...displayPrices) + 2;
    const range = max - min || 1;

    // Grid lines
    ctx.strokeStyle = 'hsl(240 10% 15%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Price line
    ctx.lineWidth = 2.5;
    const isUp = displayPrices[displayPrices.length - 1] >= displayPrices[0];
    ctx.strokeStyle = isUp ? 'hsl(145 100% 50%)' : 'hsl(0 80% 55%)';
    ctx.shadowColor = isUp ? 'hsl(145 100% 50%)' : 'hsl(0 80% 55%)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    displayPrices.forEach((p, i) => {
      const x = (i / (displayPrices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Entry line
    if (position) {
      const ey = h - ((entryPrice - min) / range) * h;
      ctx.strokeStyle = 'hsl(50 90% 50%)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, ey);
      ctx.lineTo(w, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [prices, position, entryPrice]);

  const openPosition = (dir: 'long' | 'short') => {
    if (!gameActive || position) return;
    sfxTradeOpen();
    setPosition(dir);
    setEntryPrice(currentPrice);
    setPnl(0);
  };

  const closePosition = () => {
    if (!position) return;
    if (pnl > 0) { sfxProfit(); } else { sfxLoss(); }
    setTotalPnl(t => t + pnl);
    setBalance(b => b + pnl);
    setTrades(t => t + 1);
    if (pnl > 0) setWins(w => w + 1);

    setFloatingPnls(f => [...f.slice(-5), { id: Date.now(), value: pnl, x: 50 + Math.random() * 20 - 10 }]);

    setPosition(null);
    setPnl(0);
  };

  return (
    <GameContainer
      title="TURBO TRADER"
      score={balance}
      highScore={profileRecord?.score}
      onRestart={startGame}
      profileLabel={`Профиль: ${sessionTime}s / ${volatility.toUpperCase()}`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Длительность сессии</p>
            <div className="flex gap-2">
              {[30, 60, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setGameSettings(GAME_ID, { sessionTime: value })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                    sessionTime === value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {value}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Волатильность</p>
            <div className="flex gap-2">
              {(['low', 'normal', 'high'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setGameSettings(GAME_ID, { volatility: value })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase transition-colors ${
                    volatility === value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
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
      <div className="w-full h-full flex flex-col p-4 md:p-6 relative">
        {!gameActive && timeLeft === sessionTime ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <p className="text-3xl font-bold mb-2">📈 Турбо Трейдер</p>
              <p className="text-muted-foreground mb-6">Покупай или продавай — предскажи цену!</p>
              <button onClick={startGame} className="btn-neon px-8 py-3 rounded-xl text-primary-foreground text-lg">
                Начать торговлю
              </button>
            </div>
          </div>
        ) : !gameActive ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-scale-in">
              <p className="text-4xl font-bold text-gradient-primary mb-2">СЕССИЯ ОКОНЧЕНА</p>
              <p className="font-mono text-xl mb-1">P&L: <span className={totalPnl >= 0 ? 'text-neon-green' : 'text-destructive'}>{totalPnl >= 0 ? '+' : ''}{totalPnl}</span></p>
              <p className="text-muted-foreground">Процент побед: {trades > 0 ? ((wins / trades) * 100).toFixed(0) : 0}% ({wins}/{trades})</p>
              <button onClick={startGame} className="mt-4 btn-neon px-6 py-2 rounded-lg text-primary-foreground">
                Торговать снова
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex justify-between items-center mb-3 text-sm font-mono">
              <span className="text-muted-foreground">⏱ {timeLeft}s</span>
              <span className="text-neon-cyan">${currentPrice.toFixed(2)}</span>
              <span className={totalPnl >= 0 ? 'text-neon-green' : 'text-destructive'}>
                P&L: {totalPnl >= 0 ? '+' : ''}{totalPnl}
              </span>
            </div>

            {/* Chart */}
            <div className="flex-1 glass-strong rounded-xl overflow-hidden relative mb-4">
              <canvas ref={canvasRef} width={600} height={300} className="w-full h-full" />

              {/* Floating PnL */}
              <AnimatePresence>
                {floatingPnls.map(fp => (
                  <motion.div key={fp.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -60 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className={`absolute font-mono font-bold text-lg ${fp.value >= 0 ? 'text-neon-green' : 'text-destructive'}`}
                    style={{ left: `${fp.x}%`, top: '40%' }}>
                    {fp.value >= 0 ? '+' : ''}{fp.value}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Position indicator */}
              {position && (
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full font-mono text-sm font-bold ${
                  pnl >= 0 ? 'bg-neon-green/20 text-neon-green' : 'bg-destructive/20 text-destructive'
                }`}>
                  {position.toUpperCase()} {pnl >= 0 ? '+' : ''}{pnl}
                </div>
              )}
            </div>

            {/* Trade buttons */}
            <div className="flex gap-3">
              {!position ? (
                <>
                  <button onClick={() => openPosition('long')}
                    className="flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--gradient-success)', color: 'white' }}>
                    <TrendingUp className="w-5 h-5" /> КУПИТЬ
                  </button>
                  <button onClick={() => openPosition('short')}
                    className="flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--gradient-danger)', color: 'white' }}>
                    <TrendingDown className="w-5 h-5" /> ПРОДАТЬ
                  </button>
                </>
              ) : (
                <button onClick={closePosition}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] ${
                    pnl >= 0 ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' : 'bg-destructive/20 text-destructive border border-destructive/40'
                  }`}>
                  ЗАКРЫТЬ ({pnl >= 0 ? '+' : ''}{pnl})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </GameContainer>
  );
};

export default TurboTrader;
