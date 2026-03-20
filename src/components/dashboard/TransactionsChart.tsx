import { ArrowUpRight, ArrowDownLeft, ArrowUpLeft } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 border-primary/30">
        <p className="text-xs text-muted-foreground mb-2">День {label}</p>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">
            Накопленный баланс: {data.accumulatedBalance?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} TON
          </p>
          <p className="text-xs text-success">
            Депозиты: +{(data.deposits || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
          </p>
          <p className="text-xs text-destructive">
            Выводы: -{(data.withdrawals || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function TransactionsChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['transactions-chart'],
    queryFn: () => api.getTransactionsChart(),
  });

  const data = chartData?.data || [];
  
  // Вычисляем общие суммы депозитов и выводов за период
  const totalDeposits = data.reduce((sum: number, item: any) => sum + (item.deposits || 0), 0);
  const totalWithdrawals = data.reduce((sum: number, item: any) => sum + (item.withdrawals || 0), 0);
  const totalBalance = totalDeposits - totalWithdrawals;
  
  // Вычисляем накопленный баланс для графика
  let accumulatedBalance = 0;
  const chartDataWithAccumulated = data.map((item: any) => {
    accumulatedBalance += (item.balance || 0);
    return {
      ...item,
      accumulatedBalance: accumulatedBalance
    };
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 h-full animate-pulse">
        <div className="h-6 bg-secondary rounded w-32 mb-4"></div>
        <div className="h-8 bg-secondary rounded w-40 mb-6"></div>
        <div className="h-44 bg-secondary rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">График баланса</h3>
        <button className="action-btn">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold text-foreground tracking-tight">
          {formatNumber(totalBalance)} TON
        </span>
        <span className="text-sm text-muted-foreground">
          за последние 14 дней
        </span>
      </div>

      {/* Stats badges */}
      <div className="flex gap-3 mb-6">
        <span className="stat-badge">
          <ArrowUpLeft className="w-3.5 h-3.5" />
          Депозиты: {formatNumber(totalDeposits)} TON
        </span>
        <span className="stat-badge">
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Выводы: {formatNumber(totalWithdrawals)} TON
        </span>
      </div>

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartDataWithAccumulated}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(225, 25%, 15%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              stroke="hsl(220, 15%, 50%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(220, 15%, 50%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="accumulatedBalance"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
