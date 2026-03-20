import { ArrowUpRight, Filter, ArrowDownLeft, ArrowUpRight as ArrowOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function RecentTransactions() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'deposit' | 'withdraw' | 'all'>('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['recent-transactions', sortBy],
    queryFn: () => api.getTransactions(1, 5, {
      status: 'completed', // только со статусом «выполнено»
      ...(sortBy !== 'all' && { type: sortBy === 'deposit' ? 'deposit' : 'withdraw' }),
    }),
  });

  const transactions = data?.transactions || [];
  
  // Уже приходят только выполненные; дополнительно по типу (deposit/withdraw) если sortBy не 'all'
  const filteredTransactions = transactions;
  
  const handleSortClick = () => {
    if (sortBy === 'all') {
      setSortBy('deposit');
    } else if (sortBy === 'deposit') {
      setSortBy('withdraw');
    } else {
      setSortBy('all');
    }
  };

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Транзакции</h3>
        <div className="flex gap-2">
          <button 
            className="action-btn"
            onClick={handleSortClick}
            title={sortBy === 'all' ? 'Показать депозиты' : sortBy === 'deposit' ? 'Показать выводы' : 'Показать все'}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/transactions')}
            title="Открыть страницу транзакций"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Загрузка...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {sortBy === 'all' ? 'Нет транзакций' : sortBy === 'deposit' ? 'Нет депозитов' : 'Нет выводов'}
          </div>
        ) : (
          filteredTransactions.map((tx: any) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === "deposit"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                )}
              >
                {tx.type === "deposit" ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowOut className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {tx.type === "deposit" ? "Депозит" : "Вывод"} {tx.currency}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {tx.userId}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-semibold text-sm",
                  tx.type === "deposit" ? "text-success" : "text-foreground"
                )}
              >
                {tx.type === "deposit" ? "+" : "-"}
                {typeof tx.amount === 'number' ? tx.amount.toLocaleString('ru-RU') : tx.amount} {tx.currency}
              </p>
              <p className="text-xs text-muted-foreground">{tx.createdAt || tx.date}</p>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
