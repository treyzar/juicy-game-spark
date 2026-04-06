import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';

interface GameContainerProps {
  title: string;
  score: number;
  highScore?: number;
  onRestart: () => void;
  children: ReactNode;
  accentColor?: string;
}

/** Универсальная обёртка для всех мини-игр */
export const GameContainer = ({
  title,
  score,
  highScore,
  onRestart,
  children,
  accentColor = 'neon-purple',
}: GameContainerProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col p-4 md:p-6"
    >
      {/* Header */}
      <div className="glass-strong p-3 md:p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold font-mono">{title}</h1>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {highScore !== undefined && (
            <div className="flex items-center gap-1.5 text-neon-yellow">
              <Trophy className="w-4 h-4" />
              <span className="font-mono text-sm">{highScore}</span>
            </div>
          )}
          <div className="font-mono text-lg md:text-2xl font-bold text-neon-cyan">
            {score}
          </div>
          <button
            onClick={onRestart}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 glass rounded-xl overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
};
