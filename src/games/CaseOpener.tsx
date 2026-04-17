import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore, InventoryItem } from '@/stores/useGameStore';
import { Package, ArrowUp, Sparkles } from 'lucide-react';
import { sfxClick, sfxWin, sfxUpgrade, sfxCrash, sfxTick, sfxCollect } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';

const ITEMS: Omit<InventoryItem, 'id'>[] = [
  { name: 'Обычный Осколок', rarity: 'common', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', value: 10 },
  { name: 'Обычный Кристалл', rarity: 'common', gradient: 'linear-gradient(135deg, #78716c, #a8a29e)', value: 15 },
  { name: 'Зелёная Призма', rarity: 'uncommon', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', value: 30 },
  { name: 'Океанская Волна', rarity: 'uncommon', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', value: 40 },
  { name: 'Синяя Нова', rarity: 'rare', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', value: 80 },
  { name: 'Янтарное Пламя', rarity: 'rare', gradient: 'linear-gradient(135deg, #f97316, #ef4444)', value: 100 },
  { name: 'Фиолетовая Туманность', rarity: 'epic', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)', value: 250 },
  { name: 'Розовый Космос', rarity: 'epic', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', value: 300 },
  { name: 'Золотой Дракон', rarity: 'legendary', gradient: 'linear-gradient(135deg, #eab308, #f59e0b)', value: 1000 },
  { name: 'Алмазная Звезда', rarity: 'legendary', gradient: 'linear-gradient(135deg, #e2e8f0, #a5f3fc)', value: 2000 },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-400',
};

const CASE_TIER_CONFIG = {
  budget: { cost: 80, weights: { common: 55, uncommon: 25, rare: 13, epic: 6, legendary: 1 } },
  standard: { cost: 150, weights: { common: 40, uncommon: 25, rare: 20, epic: 10, legendary: 5 } },
  premium: { cost: 300, weights: { common: 25, uncommon: 23, rare: 27, epic: 18, legendary: 7 } },
} as const;

const UPGRADE_PRESETS = {
  safe: 55,
  balanced: 35,
  risky: 20,
} as const;

/** Neon Case Opener & Upgrader */
const CaseOpener = () => {
  const GAME_ID = 'cases';
  const [mode, setMode] = useState<'open' | 'upgrade' | 'inventory'>('open');
  const [reelItems, setReelItems] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<Omit<InventoryItem, 'id'> | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const controls = useAnimation();
  const { coins, spendCoins, addItem, inventory, removeItem, gameSettings, setGameSettings, setRecord, getRecord } = useGameStore();
  const caseTier = (gameSettings[GAME_ID]?.caseTier as keyof typeof CASE_TIER_CONFIG) ?? 'standard';
  const upgradePreset = (gameSettings[GAME_ID]?.upgradePreset as keyof typeof UPGRADE_PRESETS) ?? 'balanced';
  const caseCost = CASE_TIER_CONFIG[caseTier].cost;
  const profileId = buildProfileId({ caseTier, upgradePreset });
  const profileRecord = getRecord(GAME_ID, profileId);

  const generateReel = useCallback((tier: keyof typeof CASE_TIER_CONFIG) => {
    // Generate 40 items weighted by rarity
    const weights = CASE_TIER_CONFIG[tier].weights;
    const pool: Omit<InventoryItem, 'id'>[] = [];
    for (let i = 0; i < 40; i++) {
      const r = Math.random() * 100;
      let rarity: string;
      if (r < weights.common) rarity = 'common';
      else if (r < weights.common + weights.uncommon) rarity = 'uncommon';
      else if (r < weights.common + weights.uncommon + weights.rare) rarity = 'rare';
      else if (r < weights.common + weights.uncommon + weights.rare + weights.epic) rarity = 'epic';
      else rarity = 'legendary';
      const filtered = ITEMS.filter(i => i.rarity === rarity);
      pool.push(filtered[Math.floor(Math.random() * filtered.length)]);
    }
    return pool;
  }, []);

  const openCase = async () => {
    if (!spendCoins(caseCost) || spinning) return;
    setWonItem(null);
    setShowConfetti(false);

    const reel = generateReel(caseTier);
    const winnerIdx = 35;
    setReelItems(reel);
    setSpinning(true);
    sfxClick();

    // Play ticks during spin
    const tickInterval = setInterval(() => sfxTick(), 120);

    await controls.start({
      x: -(winnerIdx * 110 - 150),
      transition: { duration: 3, ease: [0.15, 0.85, 0.35, 1.02] },
    });

    clearInterval(tickInterval);

    const won = reel[winnerIdx];
    setWonItem(won);
    addItem({ ...won, id: crypto.randomUUID() });
    setRecord(GAME_ID, profileId, won.value);
    setSpinning(false);

    if (won.rarity === 'epic' || won.rarity === 'legendary') {
      sfxWin();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      sfxCollect();
    }
  };

  const [upgradeItem, setUpgradeItem] = useState<InventoryItem | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<'pending' | 'success' | 'fail' | null>(null);
  const [customChance, setCustomChance] = useState(UPGRADE_PRESETS[upgradePreset]);

  useEffect(() => {
    setCustomChance(UPGRADE_PRESETS[upgradePreset]);
  }, [upgradePreset]);

  const tryUpgrade = () => {
    if (!upgradeItem) return;
    setUpgradeResult('pending');

    setTimeout(() => {
      if (Math.random() * 100 < customChance) {
        removeItem(upgradeItem.id);
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const nextR = rarities[Math.min(rarities.indexOf(upgradeItem.rarity) + 1, rarities.length - 1)];
        const candidates = ITEMS.filter(i => i.rarity === nextR);
        const won = candidates[Math.floor(Math.random() * candidates.length)];
        addItem({ ...won, id: crypto.randomUUID() });
        setRecord(GAME_ID, profileId, won.value);
        sfxUpgrade();
        setUpgradeResult('success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      } else {
        removeItem(upgradeItem.id);
        sfxCrash();
        setUpgradeResult('fail');
      }
      setUpgradeItem(null);
    }, 1500);
  };

  const sellItem = (item: InventoryItem) => {
    removeItem(item.id);
    useGameStore.getState().addCoins(item.value);
    sfxCollect();
  };

  return (
    <GameContainer
      title="NEON CASE OPENER"
      score={coins}
      highScore={profileRecord?.score}
      onRestart={() => { setWonItem(null); setMode('open'); }}
      profileLabel={`Профиль: ${caseTier.toUpperCase()} / ${upgradePreset.toUpperCase()}`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Тип кейса</p>
            <div className="flex gap-2">
              {(['budget', 'standard', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setGameSettings(GAME_ID, { caseTier: tier })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase transition-colors ${
                    caseTier === tier ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Пресет улучшения</p>
            <div className="flex gap-2">
              {(['safe', 'balanced', 'risky'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setGameSettings(GAME_ID, { upgradePreset: preset })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase transition-colors ${
                    upgradePreset === preset ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full h-full p-4 md:p-6 flex flex-col overflow-hidden relative">
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  background: ['#a855f7', '#ec4899', '#eab308', '#06b6d4', '#22c55e'][i % 5],
                  animation: `confetti-fall ${1.5 + Math.random()}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          {(['open', 'upgrade', 'inventory'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                mode === m ? 'btn-neon text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}>
              {m === 'open' ? '📦 Открыть' : m === 'upgrade' ? '⬆️ Улучшить' : '🎒 Инвентарь'}
            </button>
          ))}
        </div>

        {/* OPEN MODE */}
        {mode === 'open' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Reel container */}
            <div className="w-full max-w-md overflow-hidden glass-strong rounded-xl p-4 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neon-pink z-10" />
              <div className="overflow-hidden">
                <motion.div className="flex gap-2.5" animate={controls} initial={{ x: 0 }}>
                  {reelItems.map((item, i) => (
                    <div key={i}
                      className={`w-[100px] h-[100px] flex-shrink-0 rounded-lg border-2 ${RARITY_COLORS[item.rarity]} flex items-center justify-center`}
                      style={{ background: item.gradient }}>
                      <Sparkles className="w-6 h-6 text-white/80" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {wonItem && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`text-center glass-strong p-4 rounded-xl border-2 ${RARITY_COLORS[wonItem.rarity]}`}>
                <p className="font-bold text-lg">{wonItem.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{wonItem.rarity} — {wonItem.value}💰</p>
              </motion.div>
            )}

            <button onClick={openCase} disabled={spinning || coins < caseCost}
              className="btn-neon px-8 py-3 rounded-xl text-primary-foreground font-bold text-lg disabled:opacity-50">
              <Package className="inline w-5 h-5 mr-2" />
              Открыть кейс ({caseCost} 💰)
            </button>
          </div>
        )}

        {/* UPGRADE MODE */}
        {mode === 'upgrade' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-sm">Выбери предмет из инвентаря для улучшения</p>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto w-full">
              {inventory.map(item => (
                <motion.button key={item.id} whileTap={{ scale: 0.9 }}
                  onClick={() => { setUpgradeItem(item); setUpgradeResult(null); }}
                  className={`aspect-square rounded-lg border-2 ${RARITY_COLORS[item.rarity]} ${
                    upgradeItem?.id === item.id ? 'ring-2 ring-neon-cyan' : ''
                  }`}
                  style={{ background: item.gradient }}>
                  <Sparkles className="w-4 h-4 text-white/80 mx-auto" />
                </motion.button>
              ))}
            </div>
            {upgradeItem && (
              <div className="glass-strong p-4 rounded-xl text-center space-y-3">
                <p className="font-bold">{upgradeItem.name}</p>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Шанс улучшения: {customChance}%</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="95" 
                    value={customChance}
                    onChange={(e) => setCustomChance(Number(e.target.value))}
                    className="w-full accent-neon-cyan"
                  />
                </div>
                <button onClick={tryUpgrade} disabled={upgradeResult === 'pending'}
                  className="btn-neon px-6 py-2 rounded-lg text-primary-foreground font-bold disabled:opacity-50">
                  <ArrowUp className="inline w-4 h-4 mr-1" /> Улучшить
                </button>
              </div>
            )}
            {upgradeResult === 'success' && <p className="text-neon-green font-bold animate-scale-in">✅ Улучшение успешно!</p>}
            {upgradeResult === 'fail' && <p className="text-destructive font-bold animate-scale-in">💥 Предмет уничтожен!</p>}
          </div>
        )}

        {/* INVENTORY */}
        {mode === 'inventory' && (
          <div className="flex-1 overflow-y-auto">
            {inventory.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10">Пусто. Открой несколько кейсов!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {inventory.map(item => (
                  <div key={item.id} className={`rounded-xl border-2 ${RARITY_COLORS[item.rarity]} p-3 text-center`}
                    style={{ background: item.gradient }}>
                    <Sparkles className="w-6 h-6 text-white/80 mx-auto mb-1" />
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/70 mb-2">{item.value}💰</p>
                    <button 
                      onClick={() => sellItem(item)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded font-bold transition-colors"
                    >
                      Продать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </GameContainer>
  );
};

export default CaseOpener;
