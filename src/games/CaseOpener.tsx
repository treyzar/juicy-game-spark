import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore, InventoryItem } from '@/stores/useGameStore';
import { Package, ArrowUp, Sparkles } from 'lucide-react';
import { sfxClick, sfxWin, sfxUpgrade, sfxCrash, sfxTick } from '@/lib/sounds';

const ITEMS: Omit<InventoryItem, 'id'>[] = [
  { name: 'Common Shard', rarity: 'common', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', value: 10 },
  { name: 'Common Crystal', rarity: 'common', gradient: 'linear-gradient(135deg, #78716c, #a8a29e)', value: 15 },
  { name: 'Green Prism', rarity: 'uncommon', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', value: 30 },
  { name: 'Ocean Wave', rarity: 'uncommon', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', value: 40 },
  { name: 'Blue Nova', rarity: 'rare', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', value: 80 },
  { name: 'Amber Flame', rarity: 'rare', gradient: 'linear-gradient(135deg, #f97316, #ef4444)', value: 100 },
  { name: 'Purple Nebula', rarity: 'epic', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)', value: 250 },
  { name: 'Pink Cosmos', rarity: 'epic', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', value: 300 },
  { name: 'Golden Dragon', rarity: 'legendary', gradient: 'linear-gradient(135deg, #eab308, #f59e0b)', value: 1000 },
  { name: 'Diamond Star', rarity: 'legendary', gradient: 'linear-gradient(135deg, #e2e8f0, #a5f3fc)', value: 2000 },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-400',
};

const CASE_COST = 150;

/** Neon Case Opener & Upgrader */
const CaseOpener = () => {
  const [mode, setMode] = useState<'open' | 'upgrade' | 'inventory'>('open');
  const [reelItems, setReelItems] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<Omit<InventoryItem, 'id'> | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const controls = useAnimation();
  const { coins, spendCoins, addItem, inventory, removeItem } = useGameStore();

  const generateReel = useCallback(() => {
    // Generate 40 items weighted by rarity
    const weights: Record<string, number> = { common: 40, uncommon: 25, rare: 20, epic: 10, legendary: 5 };
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
    if (!spendCoins(CASE_COST) || spinning) return;
    setWonItem(null);
    setShowConfetti(false);

    const reel = generateReel();
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

  const tryUpgrade = () => {
    if (!upgradeItem) return;
    const chance = Math.max(5, 30 - upgradeItem.value / 20);
    setUpgradeResult('pending');

    setTimeout(() => {
      if (Math.random() * 100 < chance) {
        removeItem(upgradeItem.id);
        // Give next rarity item
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const nextR = rarities[Math.min(rarities.indexOf(upgradeItem.rarity) + 1, rarities.length - 1)];
        const candidates = ITEMS.filter(i => i.rarity === nextR);
        const won = candidates[Math.floor(Math.random() * candidates.length)];
        addItem({ ...won, id: crypto.randomUUID() });
        setUpgradeResult('success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      } else {
        removeItem(upgradeItem.id);
        setUpgradeResult('fail');
      }
      setUpgradeItem(null);
    }, 1500);
  };

  return (
    <GameContainer title="NEON CASE OPENER" score={coins} onRestart={() => { setWonItem(null); setMode('open'); }}>
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
              {m === 'open' ? '📦 Open' : m === 'upgrade' ? '⬆️ Upgrade' : '🎒 Inventory'}
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

            <button onClick={openCase} disabled={spinning || coins < CASE_COST}
              className="btn-neon px-8 py-3 rounded-xl text-primary-foreground font-bold text-lg disabled:opacity-50">
              <Package className="inline w-5 h-5 mr-2" />
              Open Case ({CASE_COST} 💰)
            </button>
          </div>
        )}

        {/* UPGRADE MODE */}
        {mode === 'upgrade' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-sm">Select an item from inventory to upgrade</p>
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
              <div className="glass-strong p-4 rounded-xl text-center">
                <p className="font-bold">{upgradeItem.name}</p>
                <p className="text-sm text-muted-foreground mb-3">Chance: ~{Math.max(5, 30 - upgradeItem.value / 20).toFixed(0)}%</p>
                <button onClick={tryUpgrade} disabled={upgradeResult === 'pending'}
                  className="btn-neon px-6 py-2 rounded-lg text-primary-foreground font-bold disabled:opacity-50">
                  <ArrowUp className="inline w-4 h-4 mr-1" /> Upgrade
                </button>
              </div>
            )}
            {upgradeResult === 'success' && <p className="text-neon-green font-bold animate-scale-in">✅ Upgrade successful!</p>}
            {upgradeResult === 'fail' && <p className="text-destructive font-bold animate-scale-in">💥 Item destroyed!</p>}
          </div>
        )}

        {/* INVENTORY */}
        {mode === 'inventory' && (
          <div className="flex-1 overflow-y-auto">
            {inventory.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10">Empty. Open some cases!</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {inventory.map(item => (
                  <div key={item.id} className={`rounded-xl border-2 ${RARITY_COLORS[item.rarity]} p-3 text-center`}
                    style={{ background: item.gradient }}>
                    <Sparkles className="w-6 h-6 text-white/80 mx-auto mb-1" />
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/70">{item.value}💰</p>
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
