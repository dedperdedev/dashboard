import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sanitizeUserName, getSafeInitial, getDisplayName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  fullName: string;
  tonBalance: number;
  pltBalance: number;
  referralCode: string;
  referrals: number;
  status: "active" | "blocked";
  lastLogin: string;
  roles?: string[];
  isInfl?: boolean;
  totalDeposits?: number;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "infl">("all");
  const [sortBy, setSortBy] = useState<"tonBalance" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const limit = 20;

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, sortBy, sortOrder],
    queryFn: () => api.getUsers(page, limit, search, roleFilter === "all" ? "" : roleFilter, sortBy, sortOrder),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['users-stats'],
    queryFn: () => api.getUserStats(),
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortByBalance = () => {
    if (sortBy === "tonBalance") {
      // Переключаем порядок сортировки
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      // Устанавливаем сортировку по балансу
      setSortBy("tonBalance");
      setSortOrder("desc"); // По умолчанию от большего к меньшему
    }
    setPage(1); // Сбрасываем на первую страницу при изменении сортировки
  };

  return (
    <DashboardLayout title="Пользователи" showExport>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Всего пользователей</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.total?.toLocaleString('ru-RU') || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Активных сегодня</p>
            <p className="text-2xl font-bold text-foreground">
              {statsLoading ? "..." : stats?.activeToday?.toLocaleString('ru-RU') || "0"}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Новых за неделю</p>
            <p className="text-2xl font-bold text-success">
              {statsLoading ? "..." : `+${stats?.newThisWeek?.toLocaleString('ru-RU') || "0"}`}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Заблокировано</p>
            <p className="text-2xl font-bold text-destructive">
              {statsLoading ? "..." : stats?.blocked?.toLocaleString('ru-RU') || "0"}
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
                placeholder="Поиск по имени, username или ID..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                <button
                  onClick={() => {
                    setRoleFilter("all");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => {
                    setRoleFilter("user");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === "user"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Пользователи
                </button>
                <button
                  onClick={() => {
                    setRoleFilter("infl");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === "infl"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Инфлюенсеры
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {usersLoading ? (
              <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Пользователи не найдены</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-5 py-4 font-medium">Пользователь</th>
                    <th className="px-5 py-4 font-medium">ID</th>
                    <th className="px-5 py-4 font-medium text-right">Сумма депозитов</th>
                    <th className="px-5 py-4 font-medium text-right">
                      <button
                        onClick={handleSortByBalance}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        TON Баланс
                        {sortBy === "tonBalance" ? (
                          sortOrder === "desc" ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-4 font-medium text-right">PLT Баланс</th>
                    <th className="px-5 py-4 font-medium">Реф. код</th>
                    <th className="px-5 py-4 font-medium text-center">Рефералы</th>
                    <th className="px-5 py-4 font-medium">Статус</th>
                    <th className="px-5 py-4 font-medium">Посл. вход</th>
                    <th className="px-5 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="table-row cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/users/${user.id}`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-foreground">
                            {getSafeInitial(user.fullName, user.username)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground text-sm">{getDisplayName(user.fullName, user.username, user.id)}</p>
                              {user.isInfl && (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-accent/20 text-accent">
                                  infl
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{sanitizeUserName(user.username) || `@user_${user.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground font-mono">{user.id}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-success text-sm">
                          {(user.totalDeposits || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-foreground text-sm">{user.tonBalance.toLocaleString('ru-RU')} TON</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm text-muted-foreground">{user.pltBalance.toLocaleString('ru-RU')} PLT</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-primary font-mono">{user.referralCode}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm text-foreground">{user.referrals}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.status === "active" 
                            ? "bg-success/15 text-success" 
                            : "bg-destructive/15 text-destructive"
                        }`}>
                          {user.status === "active" ? "Активен" : "Заблокирован"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">{user.lastLogin}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button 
                          className="action-btn w-8 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${user.id}`);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
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
                Показано {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total.toLocaleString('ru-RU')} пользователей
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

export default UsersPage;
