import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchLanSessions,
  getLanServerUrl,
  LanSessionInfo,
  sendTopupCommand,
} from "@/lib/lanSession";

const Admin = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LanSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amountBySession, setAmountBySession] = useState<Record<string, string>>({});
  const [busySession, setBusySession] = useState<string | null>(null);
  const serverUrl = useMemo(() => getLanServerUrl(), []);

  const loadSessions = async () => {
    try {
      setError(null);
      const response = await fetchLanSessions();
      setSessions(response.sessions);
    } catch {
      setError(
        "LAN-сервер недоступен. Запусти `npm run lan:server` и проверь VITE_LAN_SERVER_URL."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (!cancelled) {
        await loadSessions();
        timer = window.setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const topupSession = async (sessionId: string) => {
    const amount = Number(amountBySession[sessionId] || "0");
    if (!Number.isFinite(amount) || amount <= 0) return;

    try {
      setBusySession(sessionId);
      await sendTopupCommand(sessionId, Math.floor(amount));
      setAmountBySession((s) => ({ ...s, [sessionId]: "" }));
      await loadSessions();
    } catch {
      setError("Не удалось отправить пополнение для выбранной сессии.");
    } finally {
      setBusySession(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="glass-strong rounded-2xl p-4 md:p-6 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono">LAN Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Сервер: <span className="font-mono">{serverUrl}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSessions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </div>
        )}

        <div className="glass rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-neon-cyan" />
            <p className="font-mono text-sm">
              Активных сессий: <span className="font-bold">{sessions.length}</span>
            </p>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Загрузка сессий...</p>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground">Сейчас нет активных клиентских сессий.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="rounded-xl border border-border/60 p-3 md:p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3"
                >
                  <div>
                    <p className="font-bold font-mono">{session.label}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      ID: {session.sessionId}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      IP: {session.ip} • Route: {session.path}
                    </p>
                    <p className="text-sm mt-1">
                      Баланс: <span className="text-neon-yellow font-bold">{session.coins}</span> 🪙
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Сумма"
                      value={amountBySession[session.sessionId] ?? ""}
                      onChange={(e) =>
                        setAmountBySession((s) => ({
                          ...s,
                          [session.sessionId]: e.target.value,
                        }))
                      }
                      className="w-28"
                    />
                    <Button
                      onClick={() => topupSession(session.sessionId)}
                      disabled={busySession === session.sessionId}
                    >
                      Пополнить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

