import { ArrowUpRight, ArrowDownLeft, ArrowUpLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function EarningsDonut() {
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: () => api.getBalance(),
  });

  const balance = balanceData?.balance || 0;
  const totalDeposits = balanceData?.totalDeposits || 0;
  const totalWithdrawals = balanceData?.totalWithdrawals || 0;

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-secondary rounded w-32 mb-4"></div>
        <div className="h-8 bg-secondary rounded w-40 mb-6"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-24 w-24 bg-secondary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">Обзор баланса</h3>
        <button className="action-btn">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Value */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground tracking-tight">
            {formatNumber(balance)} TON
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-success">
            <ArrowUpLeft className="w-4 h-4" />
            <span className="text-muted-foreground">Депозиты:</span>
            <span className="font-semibold">{formatNumber(totalDeposits)} TON</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-destructive">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-muted-foreground">Выводы:</span>
            <span className="font-semibold">{formatNumber(totalWithdrawals)} TON</span>
          </div>
        </div>
      </div>

      {/* Balance indicator */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Баланс</div>
          <div className={`text-4xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {balance >= 0 ? '+' : ''}{formatNumber(balance)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">TON</div>
        </div>
      </div>
    </div>
  );
}
