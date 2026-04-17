import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '@/stores/useGameStore';
import { getLanPlayerLabel, getLanSessionId, sendHeartbeat } from '@/lib/lanSession';

/** Синхронизация с LAN-сервером сессий: heartbeat + удалённые пополнения */
export const LanSessionBridge = () => {
  const location = useLocation();
  const { coins, addCoins } = useGameStore();
  const sessionId = useMemo(() => getLanSessionId(), []);
  const label = useMemo(() => getLanPlayerLabel(), []);
  const latestRef = useRef({ coins, path: location.pathname });

  useEffect(() => {
    latestRef.current = { coins, path: location.pathname };
  }, [coins, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const { commands } = await sendHeartbeat({
          sessionId,
          label,
          coins: latestRef.current.coins,
          path: latestRef.current.path,
        });

        if (!cancelled) {
          commands
            .filter((cmd) => cmd.type === 'topup' && cmd.amount > 0)
            .forEach((cmd) => addCoins(Math.floor(cmd.amount)));
        }
      } catch {
        // Сервер может быть не запущен — просто пропускаем цикл.
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(tick, 3000);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [addCoins, label, sessionId]);

  return null;
};

