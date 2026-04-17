import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { Rocket } from 'lucide-react';
import { sfxCrash, sfxCashOut, sfxHeartbeat, sfxClick } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';

const RISK_CONFIG = {
  safe: { crashFactor: 1.05, growth: 0.38 },
  normal: { crashFactor: 0.97, growth: 0.5 },
  insane: { crashFactor: 0.9, growth: 0.62 },
} as const;

/** CRASH: To the Moon — игра на множитель */
const CrashGame = () => {
  const GAME_ID = 'crash';
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState<'betting' | 'flying' | 'crashed' | 'cashed'>('betting');
  const [bet, setBet] = useState(100);
  const [crashPoint, setCrashPoint] = useState(1);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const { gameSettings, getRecord, setRecord, setGameSettings, coins, addCoins, spendCoins } = useGameStore();
  const riskMode = (gameSettings[GAME_ID]?.riskMode as keyof typeof RISK_CONFIG) ?? 'normal';
  const autoCashoutEnabled = Boolean(gameSettings[GAME_ID]?.autoCashoutEnabled ?? false);
  const autoCashoutX = Number(gameSettings[GAME_ID]?.autoCashoutX ?? 2);
  const profileId = buildProfileId({ riskMode, autoCashoutEnabled, autoCashoutX });
  const profileRecord = getRecord(GAME_ID, profileId);

  const generateCrashPoint = (risk: keyof typeof RISK_CONFIG) => {
    const r = Math.random();
    return Math.max(1.01, RISK_CONFIG[risk].crashFactor / (1 - r));
  };

  const startRound = useCallback(() => {
    if (!spendCoins(bet)) return;
    sfxClick();
    setCrashPoint(generateCrashPoint(riskMode));
    setMultiplier(1.0);
    setPhase('flying');
    setShakeIntensity(0);
    startRef.current = performance.now();
  }, [bet, riskMode, spendCoins]);

  const cashOut = useCallback(() => {
    if (phase !== 'flying') return;
    sfxCashOut();
    const winnings = Math.floor(bet * multiplier);
    addCoins(winnings);
    setRecord(GAME_ID, profileId, Math.round(multiplier * 100));
    setPhase('cashed');
  }, [GAME_ID, phase, bet, multiplier, addCoins, profileId, setRecord]);

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
      const m = Math.pow(Math.E, elapsed * RISK_CONFIG[riskMode].growth);

      if (m >= crashPoint) {
        setMultiplier(crashPoint);
        sfxCrash();
        setPhase('crashed');
        setShakeIntensity(10);
        setTimeout(() => setShakeIntensity(0), 300);
        return;
      }

      if (autoCashoutEnabled && m >= autoCashoutX) {
        const cashoutAt = autoCashoutX;
        setMultiplier(cashoutAt);
        sfxCashOut();
        addCoins(Math.floor(bet * cashoutAt));
        setRecord(GAME_ID, profileId, Math.round(cashoutAt * 100));
        setPhase('cashed');
        return;
      }

      setMultiplier(m);
      setShakeIntensity(Math.min(5, (m - 1) * 2));

      // Heartbeat at high multipliers
      if (m > 3 && Math.random() < 0.02) sfxHeartbeat();

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
  }, [GAME_ID, addCoins, autoCashoutEnabled, autoCashoutX, bet, crashPoint, phase, profileId, riskMode, setRecord]);

  const applySetting = (patch: { riskMode?: keyof typeof RISK_CONFIG; autoCashoutEnabled?: boolean; autoCashoutX?: number }) => {
    setGameSettings(GAME_ID, patch);
    restart();
  };

  const multiplierColor =
    multiplier < 2 ? 'text-neon-cyan' :
    multiplier < 5 ? 'text-neon-green' :
    multiplier < 10 ? 'text-neon-yellow' : 'text-neon-pink';

  return (
    <GameContainer
      title="CRASH: TO THE MOON"
      score={coins}
      highScore={profileRecord?.score ? profileRecord.score / 100 : undefined}
      onRestart={restart}
      profileLabel={`Профиль: ${riskMode.toUpperCase()} / ${autoCashoutEnabled ? `AUTO ${autoCashoutX}x` : 'MANUAL'}`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Риск-режим</p>
            <div className="flex gap-2 flex-wrap">
              {(['safe', 'normal', 'insane'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => applySetting({ riskMode: mode })}
                  className={`px-3 py-2 rounded-lg font-mono text-xs uppercase transition-colors min-h-11 ${
                    riskMode === mode ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-mono text-muted-foreground">Авто-кэшаут</label>
            <button
              onClick={() => applySetting({ autoCashoutEnabled: !autoCashoutEnabled })}
              className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                autoCashoutEnabled ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
              }`}
            >
              {autoCashoutEnabled ? 'Включен' : 'Выключен'}
            </button>
            <div className="flex gap-2">
              {[1.5, 2, 3].map((value) => (
                <button
                  key={value}
                  onClick={() => applySetting({ autoCashoutX: value })}
                  className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors min-h-11 ${
                    autoCashoutX === value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden"
        style={{
          transform: shakeIntensity > 0
            ? `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)`
            : 'none',
        }}
      >
        {/* Multiplier display */}
        <motion.div
          className={`text-5xl sm:text-6xl md:text-8xl font-black font-mono ${multiplierColor} transition-colors`}
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
            className="text-2xl sm:text-3xl font-bold text-destructive mt-4 text-center"
          >
            💥 КРАШ на {crashPoint.toFixed(2)}x
          </motion.p>
        )}
        {phase === 'cashed' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl sm:text-3xl font-bold text-neon-green mt-4 text-center"
          >
            ✅ +{Math.floor(bet * multiplier)} монет!
          </motion.p>
        )}

        {/* Controls */}
        <div className="mt-6 md:mt-8 glass-strong p-4 rounded-xl flex flex-col items-center gap-3 w-full max-w-xs">
          {phase === 'betting' && (
            <>
              <div className="flex items-center gap-2 w-full">
                <label className="text-sm text-muted-foreground font-mono">СТАВКА:</label>
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
                    className="flex-1 text-xs font-mono bg-muted/80 hover:bg-muted rounded-lg py-2.5 min-h-11 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={startRound}
                className="w-full btn-neon py-3 min-h-12 rounded-xl text-primary-foreground font-bold text-base sm:text-lg">
                🚀 ЗАПУСК
              </button>
            </>
          )}
          {phase === 'flying' && (
            <button onClick={cashOut}
              className="w-full py-3 sm:py-4 min-h-12 rounded-xl font-bold text-lg sm:text-xl transition-all"
              style={{ background: 'var(--gradient-success)', color: 'white' }}>
              ЗАБРАТЬ — {Math.floor(bet * multiplier)} 💰
            </button>
          )}
          {(phase === 'crashed' || phase === 'cashed') && (
            <button onClick={restart}
              className="w-full btn-neon py-3 rounded-xl text-primary-foreground font-bold">
              Новый раунд
            </button>
          )}
        </div>
      </div>
    </GameContainer>
  );
};

export default CrashGame;
