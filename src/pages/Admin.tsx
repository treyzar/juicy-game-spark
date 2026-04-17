import { useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Admin = () => {
  const [amount, setAmount] = useState("");
  const { coins, addCoins } = useGameStore();
  const navigate = useNavigate();

  const handleAdd = () => {
    const num = parseInt(amount);
    if (!isNaN(num) && num > 0) {
      addCoins(num);
      setAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-6">Admin Panel</h1>
          
          <div className="mb-6">
            <p className="text-gray-300 mb-2">Текущий баланс:</p>
            <p className="text-4xl font-bold text-yellow-400">{coins} 🪙</p>
          </div>

          <div className="space-y-4">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Сумма пополнения"
              className="bg-gray-800 border-purple-500/50 text-white"
            />
            <Button 
              onClick={handleAdd}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Пополнить баланс
            </Button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-purple-500/50"
            >
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
