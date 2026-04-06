import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { Rocket } from 'lucide-react';

/** CRASH: To the Moon — игра на множитель */
const CrashGame = () => {
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState<'betting' | 'flying' | 'crashed' | 'cashed'>('betting');
  const [bet, setBet] = useState(100);
  const [crashPoint, setCrashPoint] = useState(1);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const { records, setRecord, coins, addCoins, spendCoins } = useGameStore();

  const generateCrashPoint = () => {
    // House edge ~3%: crash = 0.97 / (1 - random())
    const r = Math.random();
    return Math.max(1.01, 0.97 / (1 - r));
  };

  const startRound = useCallback(() => {
    if (!spendCoins(bet)) return;
    setCrashPoint(generateCrashPoint());
    setMultiplier(1.0);
    setPhase('flying');
    setShakeIntensity(0);
    startRef.current = performance.now();
  }, [bet, spendCoins]);

  const cashOut = useCallback(() => {
    if (phase !== 'flying') return;
    const winnings = Math.floor(bet * multiplier);
    addCoins(winnings);
    setRecord('crash', Math.round(multiplier * 100));
    setPhase('cashed');
  }, [phase, bet, multiplier, addCoins, setRecord]);

  const restart = useCallback(() => {
    setPhase('betting');
    setMultiplier(1.0);
    setShakeIntensity(0);
  }, []);

  // Main game loop
  useEffect(() => {
    if (phase !== 'flying') return;

    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const m = Math.pow(Math.E, elapsed * 0.5); // exponential growth

      if (m >= crashPoint) {
        setMultiplier(crashPoint);
        setPhase('crashed');
        setShakeIntensity(10);
        setTimeout(() => setShakeIntensity(0), 300);
        return;
      }

      setMultiplier(m);
      setShakeIntensity(Math.min(5, (m - 1) * 2));

      // Spawn rocket particles
      if (Math.random() > 0.5) {
        setParticles(p => [
          ...p.slice(-20),
          { id: Date.now() + Math.random(), x: 50 + Math.random() * 10 - 5, y: 50 + m * 2 },
        ]);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, crashPoint]);

  const multiplierColor =
    multiplier < 2 ? 'text-neon-cyan' :
    multiplier < 5 ? 'text-neon-green' :
    multiplier < 10 ? 'text-neon-yellow' : 'text-neon-pink';

  return (
    <GameContainer
      title="CRASH: TO THE MOON"
      score={coins}
      highScore={records.crash?.score ? records.crash.score / 100 : undefined}
      onRestart={restart}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{
          transform: shakeIntensity > 0
            ? `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)`
            : 'none',
        }}
      >
        {/* Multiplier display */}
        <motion.div
          className={`text-6xl md:text-8xl font-black font-mono ${multiplierColor} transition-colors`}
          animate={{ scale: phase === 'flying' ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {multiplier.toFixed(2)}x
        </motion.div>

        {/* Rocket */}
        {phase === 'flying' && (
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            className="mt-4"
          >
            <Rocket className="w-12 h-12 text-neon-orange rotate-[-45deg]" />
          </motion.div>
        )}

        {/* Status */}
        {phase === 'crashed' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-destructive mt-4"
          >
            💥 CRASHED at {crashPoint.toFixed(2)}x
          </motion.p>
        )}
        {phase === 'cashed' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-neon-green mt-4"
          >
            ✅ +{Math.floor(bet * multiplier)} coins!
          </motion.p>
        )}

        {/* Controls */}
        <div className="mt-8 glass-strong p-4 rounded-xl flex flex-col items-center gap-3 w-full max-w-xs">
          {phase === 'betting' && (
            <>
              <div className="flex items-center gap-2 w-full">
                <label className="text-sm text-muted-foreground font-mono">BET:</label>
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 10))}
                  className="bg-muted rounded-lg px-3 py-2 font-mono text-center w-full"
                />
              </div>
              <div className="flex gap-2 w-full">
                {[50, 100, 250, 500].map(v => (
                  <button key={v} onClick={() => setBet(v)}
                    className="flex-1 text-xs font-mono bg-muted/80 hover:bg-muted rounded-lg py-1.5 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={startRound}
                className="w-full btn-neon py-3 rounded-xl text-primary-foreground font-bold text-lg">
                🚀 LAUNCH
              </button>
            </>
          )}
          {phase === 'flying' && (
            <button onClick={cashOut}
              className="w-full py-4 rounded-xl font-bold text-xl transition-all"
              style={{ background: 'var(--gradient-success)', color: 'white' }}>
              CASH OUT — {Math.floor(bet * multiplier)} 💰
            </button>
          )}
          {(phase === 'crashed' || phase === 'cashed') && (
            <button onClick={restart}
              className="w-full btn-neon py-3 rounded-xl text-primary-foreground font-bold">
              New Round
            </button>
          )}
        </div>
      </div>
    </GameContainer>
  );
};

export default CrashGame;
