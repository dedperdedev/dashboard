import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Search, Filter, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  orderId: string;
  type: "deposit" | "withdraw";
  currency: string;
  amount: number;
  status: "completed" | "inProgress" | "cancelled";
  userId: number;
  sourceWallet?: string;
  targetWallet?: string;
  createdAt: string;
  withdrawalType?: "position_earnings" | "deposit_without_position";
}

const statusConfig = {
  completed: { label: "Выполнено", className: "bg-success/15 text-success" },
  inProgress: { label: "В процессе", className: "bg-warning/15 text-warning" },
  cancelled: { label: "Отменено", className: "bg-destructive/15 text-destructive" },
};

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const limit = 20;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано",
        description: `${label} скопирован в буфер обмена`,
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать",
        variant: "destructive",
      });
    }
  };

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', page, typeFilter, statusFilter, currencyFilter],
    queryFn: () => api.getTransactions(page, limit, {
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      currency: currencyFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['transactions-stats'],
    queryFn: () => api.getTransactionStats(),
  });

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  return (
    <DashboardLayout title="Транзакции" showExport>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Всего транзакций</p>
            <p className="text-2xl font-bold text-foreground">
              {stats?.total?.toLocaleString('ru-RU') || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Выполнено</p>
            <p className="text-2xl font-bold text-success">
              {stats?.byStatus?.completed || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">В процессе</p>
            <p className="text-2xl font-bold text-warning">
              {stats?.byStatus?.inProgress || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Отменено</p>
            <p className="text-2xl font-bold text-destructive">
              {stats?.byStatus?.cancelled || "0"}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card">
          {/* Search & Filters */}
          <div className="p-5 border-b border-border flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Поиск по ID заказа или пользователю..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все типы</option>
                <option value="deposit">Депозиты</option>
                <option value="withdraw">Выводы</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все статусы</option>
                <option value="completed">Выполнено</option>
                <option value="inProgress">В процессе</option>
                <option value="cancelled">Отменено</option>
              </select>
              <select 
                value={currencyFilter}
                onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все валюты</option>
                <option value="TON">TON</option>
                <option value="stars">Stars</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Транзакции не найдены</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-5 py-4 font-medium">Тип</th>
                    <th className="px-5 py-4 font-medium">ID заказа</th>
                    <th className="px-5 py-4 font-medium">Пользователь</th>
                    <th className="px-5 py-4 font-medium text-right">Сумма</th>
                    <th className="px-5 py-4 font-medium">Тип вывода</th>
                    <th className="px-5 py-4 font-medium">Кошелёк</th>
                    <th className="px-5 py-4 font-medium">Статус</th>
                    <th className="px-5 py-4 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: Transaction) => (
                    <tr 
                      key={tx.id} 
                      className={cn(
                        "table-row",
                        (tx.type === "withdraw" || tx.type === "withdrawal") && "cursor-pointer hover:bg-secondary/50"
                      )}
                      onClick={() => {
                        if (tx.type === "withdraw" || tx.type === "withdrawal") {
                          navigate(`/transactions/${tx.id}`);
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === "deposit" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        )}>
                          {tx.type === "deposit" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-foreground">{tx.orderId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-muted-foreground">
                          ID:{" "}
                          <button
                            onClick={() => navigate(`/users/${tx.userId}`)}
                            className="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer font-medium"
                          >
                            {tx.userId}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "font-semibold text-sm",
                          tx.type === "deposit" ? "text-success" : "text-foreground"
                        )}>
                          {tx.type === "deposit" ? "+" : "-"}{typeof tx.amount === 'number' ? tx.amount.toLocaleString('ru-RU') : tx.amount} {tx.currency}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {tx.type === "withdraw" && tx.withdrawalType && (
                          <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                            tx.withdrawalType === "position_earnings" 
                              ? "bg-primary/15 text-primary" 
                              : "bg-muted/15 text-muted-foreground"
                          )}>
                            {tx.withdrawalType === "position_earnings" 
                              ? "Доход" 
                              : "Депозит"}
                          </span>
                        )}
                        {tx.type === "deposit" && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {tx.type === "withdraw" && !tx.withdrawalType && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-mono">
                            {(() => {
                              // Для депозитов показываем sourceWallet (откуда пришло)
                              // Для выводов показываем targetWallet (куда выводится)
                              const wallet = tx.type === "deposit" 
                                ? tx.sourceWallet 
                                : tx.targetWallet;
                              return wallet ? `${wallet.substring(0, 20)}...` : "—";
                            })()}
                          </span>
                          {(() => {
                            const wallet = tx.type === "deposit" 
                              ? tx.sourceWallet 
                              : tx.targetWallet;
                            return wallet ? (
                              <button
                                onClick={() => copyToClipboard(wallet, "Адрес кошелька")}
                                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                title="Копировать адрес кошелька"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                          statusConfig[tx.status as keyof typeof statusConfig]?.className || "bg-secondary text-foreground"
                        )}>
                          {statusConfig[tx.status as keyof typeof statusConfig]?.label || tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{tx.createdAt}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="p-5 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total.toLocaleString('ru-RU')} транзакций
              </p>
              <div className="flex items-center gap-2">
                <button 
                  className="action-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      className={`w-9 h-9 rounded-xl text-sm font-medium ${
                        pageNum === page
                          ? "bg-primary text-primary-foreground"
                          : "action-btn"
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  className="action-btn"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPage;
