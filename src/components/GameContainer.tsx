import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Settings2, Trophy } from 'lucide-react';

interface GameContainerProps {
  title: string;
  score: number;
  highScore?: number;
  onRestart: () => void;
  children: ReactNode;
  accentColor?: string;
  settingsContent?: ReactNode;
  profileLabel?: string;
}

/** Универсальная обёртка для всех мини-игр */
export const GameContainer = ({
  title,
  score,
  highScore,
  onRestart,
  children,
  accentColor = 'neon-purple',
  settingsContent,
  profileLabel,
}: GameContainerProps) => {
  const navigate = useNavigate();
  const hasSettings = Boolean(settingsContent);
  const [showSettings, setShowSettings] = useState(hasSettings);
  const [isConfigured, setIsConfigured] = useState(!hasSettings);

  useEffect(() => {
    setShowSettings(hasSettings);
    setIsConfigured(!hasSettings);
  }, [hasSettings]);

  const handleStart = () => {
    setIsConfigured(true);
    setShowSettings(false);
    window.requestAnimationFrame(() => {
      onRestart();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col p-3 md:p-6 pb-safe"
    >
      {/* Header */}
      <div className="glass-strong p-3 md:p-4 mb-3 md:mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold font-mono truncate">{title}</h1>
            {profileLabel && (
              <p className="text-[11px] md:text-xs font-mono text-muted-foreground mt-0.5 truncate">{profileLabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
          {settingsContent && (
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
              title="Настройки"
              disabled={!isConfigured}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          )}
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
            className="p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            disabled={!isConfigured}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
      {settingsContent && showSettings && (
        <div className="glass-strong p-3 md:p-4 mb-4 rounded-xl">
          <p className="text-xs font-mono text-muted-foreground mb-3">
            Настрой игру под себя перед стартом
          </p>
          {settingsContent}
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 min-h-0 glass rounded-xl overflow-hidden flex items-center justify-center">
        {isConfigured ? (
          children
        ) : (
          <div className="text-center p-6">
            <p className="font-mono text-sm text-muted-foreground">Сначала настрой игру и нажми «Играть»</p>
          </div>
        )}
      </div>

      {settingsContent && !isConfigured && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-end md:items-center justify-center p-3 md:p-4">
          <div className="w-full max-w-xl glass-strong rounded-2xl p-4 md:p-6 max-h-[calc(100dvh-1.5rem)] overflow-y-auto pb-safe">
            <h2 className="text-xl font-bold font-mono mb-2">Перед стартом</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Настрой игру под себя, затем нажми «Играть».
            </p>
            <div className="mb-4">
              {settingsContent}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-muted/70 hover:bg-muted py-3 rounded-xl font-bold transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleStart}
                className="w-full btn-neon py-3 rounded-xl text-primary-foreground font-bold"
              >
                Играть
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
