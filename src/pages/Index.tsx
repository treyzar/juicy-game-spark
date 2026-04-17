import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/useGameStore';
import { Gamepad2, Coins, Trophy, Shield } from 'lucide-react';
import { EasterEgg67 } from '@/components/EasterEgg67';

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

/** Главная страница GameHub */
const Index = () => {
  const navigate = useNavigate();
  const { coins, records, getBestRecord } = useGameStore();

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
          <h1 className="text-4xl md:text-6xl font-black font-mono">
            <span className="text-gradient-primary">Game</span>
            <span className="text-gradient-secondary">Hub</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">Портал Микро-Приключений</p>

        {/* Stats bar */}
        <div className="mt-4 inline-flex gap-6 glass-strong px-6 py-3 rounded-full">
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
        <div className="mt-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 bg-muted/50 hover:bg-muted px-4 py-2 rounded-lg text-sm font-mono transition-colors"
          >
            <Shield className="w-4 h-4" />
            LAN Admin
          </button>
        </div>
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
            onClick={() => navigate(game.path)}
            className="glass group text-left p-5 rounded-2xl transition-shadow hover:neon-glow-purple cursor-pointer"
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
    </div>
  );
};

export default Index;
