import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, PlusCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/stores/useGameStore";
import { toast } from "@/components/ui/use-toast";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const TopUp = () => {
  const navigate = useNavigate();
  const { coins, addCoins } = useGameStore();
  const [amount, setAmount] = useState("");

  const formattedCoins = useMemo(
    () => new Intl.NumberFormat("ru-RU").format(coins),
    [coins]
  );

  const submitTopUp = (rawAmount: number) => {
    const normalized = Math.floor(rawAmount);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      toast({
        variant: "destructive",
        title: "Неверная сумма",
        description: "Введи сумму больше 0.",
      });
      return;
    }

    addCoins(normalized);
    toast({
      title: "Баланс пополнен",
      description: `Добавлено ${new Intl.NumberFormat("ru-RU").format(normalized)} монет.`,
    });
    setAmount("");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pt-safe pb-safe">
      <div className="max-w-2xl mx-auto">
        <div className="glass-strong rounded-2xl p-4 md:p-6 mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold font-mono flex items-center gap-2">
              <Wallet className="w-6 h-6 text-neon-yellow" />
              Пополнение баланса
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Текущий баланс: <span className="font-mono font-bold">{formattedCoins}</span> 🪙
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6">
          <p className="font-mono text-sm text-muted-foreground mb-3">Быстрое пополнение</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="secondary"
                onClick={() => submitTopUp(quickAmount)}
                className="font-mono"
              >
                +{new Intl.NumberFormat("ru-RU").format(quickAmount)}
              </Button>
            ))}
          </div>

          <p className="font-mono text-sm text-muted-foreground mb-2">Своя сумма</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Например, 750"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
            <Button onClick={() => submitTopUp(Number(amount))} className="sm:min-w-44">
              <PlusCircle className="w-4 h-4 mr-2" />
              Пополнить
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 p-3 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <Coins className="w-4 h-4 text-neon-yellow" />
              Монеты сразу добавляются в общий баланс профиля.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUp;
