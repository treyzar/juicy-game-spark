import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, QrCode } from "lucide-react";

const QrShare = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const SHARE_URL = "https://agent-69e1e7c67badbd7--frabjous-bombolone-27cb21.netlify.app/";

  const gameUrl = useMemo(() => SHARE_URL, []);
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=${encodeURIComponent(gameUrl)}`,
    [gameUrl]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pt-safe pb-safe">
      <div className="max-w-5xl mx-auto">
        <div className="glass-strong rounded-2xl p-4 md:p-6 mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold font-mono flex items-center gap-2">
              <QrCode className="w-6 h-6 text-neon-cyan" />
              Играй С Телефона
            </h1>
            <p className="text-sm text-muted-foreground mt-1 break-all">{gameUrl}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors inline-flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Скопировано" : "Копировать"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-4 items-start">
          <div className="glass rounded-2xl p-4 md:p-6">
            <img
              src={qrSrc}
              alt="QR код на главную GameHub"
              className="w-full rounded-xl bg-white p-3"
            />
          </div>

          <div className="glass rounded-2xl p-4 md:p-6">
            <h2 className="text-xl font-bold font-mono mb-2">Как подключиться</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
              <li>Открой камеру на телефоне и наведи на QR-код.</li>
              <li>Перейди по ссылке и выбери игру на телефоне.</li>
              <li>Если QR не считывается, нажми кнопку “Копировать”.</li>
            </ol>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <a
                href={gameUrl}
                className="btn-neon px-5 py-3 rounded-xl text-primary-foreground font-bold text-center inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть Игры На Этом Устройстве
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrShare;
