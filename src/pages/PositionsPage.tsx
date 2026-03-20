import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Search, Filter, TrendingUp, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Position {
  id: string;
  userId: number;
  currency: string;
  deposit: number;
  status: "active" | "completed" | "pending";
  positionType?: string | null;
  iterationIntervalMs: number;
  positionTimeDurationMs?: number | null;
  lastActivatedAt: string | null;
  createdAt: string;
  isVirtualTon?: boolean;
}

const statusConfig = {
  active: { label: "Активна", className: "bg-success/15 text-success" },
  completed: { label: "Завершена", className: "bg-muted text-muted-foreground" },
  pending: { label: "Ожидание", className: "bg-warning/15 text-warning" },
};

const PositionsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [positionTypeFilter, setPositionTypeFilter] = useState("");
  const limit = 20;

  const { data: positionsData, isLoading } = useQuery({
    queryKey: ['positions', page, statusFilter, currencyFilter, positionTypeFilter],
    queryFn: () => api.getPositions(page, limit, {
      status: statusFilter || undefined,
      currency: currencyFilter || undefined,
      positionType: positionTypeFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['positions-stats'],
    queryFn: () => api.getPositionStats(),
  });

  const positions = positionsData?.positions || [];
  const pagination = positionsData?.pagination;

  const formatInterval = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours >= 24) {
      return `${hours / 24}д`;
    }
    return `${hours}ч`;
  };

  // Используем общую сумму депозитов из статистики (все позиции, не только на текущей странице)
  const totalDeposit = stats?.totalDeposits !== undefined && stats?.totalDeposits !== null 
    ? Number(stats.totalDeposits) 
    : 0;
  const virtualTonBalance = stats?.virtualTonBalance !== undefined && stats?.virtualTonBalance !== null
    ? Number(stats.virtualTonBalance)
    : 0;
  const activePositions = stats?.active || 0;

  return (
    <DashboardLayout title="Позиции" showExport>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Всего позиций</p>
            <p className="text-2xl font-bold text-foreground">
              {stats?.total?.toLocaleString('ru-RU') || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Сумма депозитов</p>
            <p className="text-2xl font-bold text-foreground">
              {totalDeposit > 0 
                ? totalDeposit.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '0.00'} TON
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Виртуальный TON</p>
            <p className="text-2xl font-bold text-foreground">{virtualTonBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Активных сейчас</p>
            <p className="text-2xl font-bold text-success">{activePositions}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">По валютам</p>
            <p className="text-2xl font-bold text-foreground">
              {stats?.byCurrency ? Object.keys(stats.byCurrency).length : "0"}
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
                placeholder="Поиск по пользователю..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="completed">Завершённые</option>
              </select>
              <select 
                value={currencyFilter}
                onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все валюты</option>
                <option value="TON">TON</option>
              </select>
              <select 
                value={positionTypeFilter}
                onChange={(e) => { setPositionTypeFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Все типы</option>
                <option value="forsage">Forsage (36ч)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
            ) : positions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Позиции не найдены</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-5 py-4 font-medium">Пользователь</th>
                    <th className="px-5 py-4 font-medium">Тип</th>
                    <th className="px-5 py-4 font-medium">Валюта</th>
                    <th className="px-5 py-4 font-medium text-right">Депозит</th>
                    <th className="px-5 py-4 font-medium">Интервал</th>
                    <th className="px-5 py-4 font-medium">Статус</th>
                    <th className="px-5 py-4 font-medium">Посл. активация</th>
                    <th className="px-5 py-4 font-medium">Создано</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position: Position) => (
                    <tr key={position.id} className="table-row">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-foreground">
                            {String(position.userId).charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              ID:{" "}
                              <button
                                onClick={() => navigate(`/users/${position.userId}`)}
                                className="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer font-medium"
                              >
                                {position.userId}
                              </button>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">
                          {position.positionType ? (position.positionType === 'forsage' ? 'Forsage (36ч)' : position.positionType) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{position.currency}</span>
                          {position.isVirtualTon && (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-accent/20 text-accent">
                              Virtual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-foreground text-sm">
                          {typeof position.deposit === 'number' ? position.deposit.toLocaleString('ru-RU') : position.deposit} {position.currency}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">
                          {position.iterationIntervalMs ? formatInterval(position.iterationIntervalMs) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                          statusConfig[position.status as keyof typeof statusConfig]?.className || "bg-secondary text-foreground"
                        )}>
                          {statusConfig[position.status as keyof typeof statusConfig]?.label || position.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">
                          {position.lastActivatedAt || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{position.createdAt}</span>
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
                Показано {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total.toLocaleString('ru-RU')} позиций
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

export default PositionsPage;
