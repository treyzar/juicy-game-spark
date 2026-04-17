import { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainer } from '@/components/GameContainer';
import { useGameStore } from '@/stores/useGameStore';
import { sfxCollect, sfxCrash } from '@/lib/sounds';
import { buildProfileId } from '@/lib/gameProfiles';

/** Направление змейки */
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Point {
  x: number;
  y: number;
}

const GRID = 20;
const SPEED_PRESETS = {
  easy: { initial: 150, increment: 4 },
  normal: { initial: 120, increment: 5 },
  hard: { initial: 95, increment: 7 },
} as const;

/** Neon Snake — Canvas-игра с эффектом свечения */
const NeonSnake = () => {
  const GAME_ID = 'snake';
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirRef = useRef<Direction>('RIGHT');
  const snakeRef = useRef<Point[]>([{ x: 5, y: 5 }]);
  const foodRef = useRef<Point>({ x: 10, y: 10 });
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const { gameSettings, getRecord, setRecord, setGameSettings } = useGameStore();
  const difficulty = (gameSettings[GAME_ID]?.difficulty as keyof typeof SPEED_PRESETS) ?? 'normal';
  const wallMode = (gameSettings[GAME_ID]?.wallMode as 'wrap' | 'solid') ?? 'wrap';
  const profileId = buildProfileId({ difficulty, wallMode });
  const profileRecord = getRecord(GAME_ID, profileId);

  const spawnFood = useCallback((cols: number, rows: number) => {
    let p: Point;
    do {
      p = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    } while (snakeRef.current.some((s) => s.x === p.x && s.y === p.y));
    foodRef.current = p;
  }, []);

  const restart = useCallback(() => {
    snakeRef.current = [{ x: 5, y: 5 }];
    dirRef.current = 'RIGHT';
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const cols = Math.floor(w / GRID);
    const rows = Math.floor(h / GRID);

    spawnFood(cols, rows);

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      };
      const nd = map[e.key];
      if (!nd) return;
      const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      if (opp[nd] !== dirRef.current) dirRef.current = nd;
    };
    window.addEventListener('keydown', onKey);

    let lastTime = 0;

    const tick = (time: number) => {
      const speedPreset = SPEED_PRESETS[difficulty];
      const speed = Math.max(35, speedPreset.initial - scoreRef.current * speedPreset.increment);
      if (time - lastTime < speed) {
        loopRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTime = time;

      const snake = snakeRef.current;
      const head = { ...snake[0] };

      switch (dirRef.current) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }

      if (wallMode === 'wrap') {
        if (head.x < 0) head.x = cols - 1;
        if (head.x >= cols) head.x = 0;
        if (head.y < 0) head.y = rows - 1;
        if (head.y >= rows) head.y = 0;
      } else if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        setRecord(GAME_ID, profileId, scoreRef.current);
        sfxCrash();
        setGameOver(true);
        return;
      }

      // Self collision only
      if (snake.some((s) => s.x === head.x && s.y === head.y)) {
        setRecord(GAME_ID, profileId, scoreRef.current);
        sfxCrash();
        setGameOver(true);
        return;
      }

      snake.unshift(head);

      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current++;
        setScore(scoreRef.current);
        sfxCollect();
        spawnFood(cols, rows);
      } else {
        snake.pop();
      }

      // Draw
      ctx.fillStyle = 'hsl(240 15% 6%)';
      ctx.fillRect(0, 0, w, h);

      // Grid dots
      ctx.fillStyle = 'hsl(240 10% 12%)';
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          ctx.fillRect(x * GRID + GRID / 2, y * GRID + GRID / 2, 1, 1);
        }
      }

      // Food glow
      const fx = foodRef.current.x * GRID + GRID / 2;
      const fy = foodRef.current.y * GRID + GRID / 2;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(fx, fy, GRID / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      snake.forEach((seg, i) => {
        const t = 1 - i / snake.length;
        ctx.shadowColor = `hsl(${270 + i * 3} 100% 65%)`;
        ctx.shadowBlur = 15 * t;
        ctx.fillStyle = `hsl(${270 + i * 3} 100% ${50 + t * 20}%)`;
        ctx.beginPath();
        ctx.roundRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2, 4);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(loopRef.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [difficulty, gameOver, profileId, setRecord, spawnFood, wallMode]);

  const applySetting = (patch: { difficulty?: keyof typeof SPEED_PRESETS; wallMode?: 'wrap' | 'solid' }) => {
    setGameSettings(GAME_ID, patch);
    restart();
  };

  return (
    <GameContainer
      title="NEON SNAKE"
      score={score}
      highScore={profileRecord?.score}
      onRestart={restart}
      profileLabel={`Профиль: ${difficulty.toUpperCase()} / ${wallMode === 'wrap' ? 'WRAP' : 'WALLS'}`}
      settingsContent={
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Сложность</p>
            <div className="flex gap-2">
              {(['easy', 'normal', 'hard'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => applySetting({ difficulty: mode })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase transition-colors ${
                    difficulty === mode ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">Стены</p>
            <div className="flex gap-2">
              {([
                { value: 'wrap', label: 'Телепорт' },
                { value: 'solid', label: 'Твёрдые' },
              ] as const).map((item) => (
                <button
                  key={item.value}
                  onClick={() => applySetting({ wallMode: item.value })}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                    wallMode === item.value ? 'btn-neon text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="rounded-lg max-w-full max-h-full"
        />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center animate-scale-in">
              <p className="text-4xl font-bold text-gradient-primary mb-2">GAME OVER</p>
              <p className="text-muted-foreground font-mono">Score: {score}</p>
              <button onClick={restart} className="mt-4 btn-neon px-6 py-2 rounded-lg text-primary-foreground">
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </GameContainer>
  );
};

export default NeonSnake;
