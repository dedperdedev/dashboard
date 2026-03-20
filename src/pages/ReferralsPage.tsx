import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Users, TrendingUp, Award, Search, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sanitizeUserName, getSafeInitial } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const { data: levelsData } = useQuery({
    queryKey: ['referral-levels'],
    queryFn: () => api.getReferralLevels(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => api.getReferralStats(),
  });

  const referralLevels = levelsData?.levels || [];
  const stats = statsData || {};
  const topReferrers = stats.topReferrers || [];
  const levelsStats = stats.levelsStats || {};
  const totalTonEarned = stats.totalTonEarned || 0;
  
  // Вычисляем новых рефералов за неделю
  const newReferralsLastWeek = stats.newReferralsLastWeek || 0;

  return (
    <DashboardLayout title="Рефералы" showExport>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Всего рефералов</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalReferrals || 0}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Выплачено PLT</p>
            <p className="text-2xl font-bold text-success">{stats.totalEarned || 0}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Coins className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Заработано TON</p>
            <p className="text-2xl font-bold text-accent">{totalTonEarned.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <Award className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Награда за реферала</p>
            <p className="text-2xl font-bold text-foreground">5 PLT</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Новых за неделю</p>
            <p className="text-2xl font-bold text-foreground">{stats.newReferralsLastWeek || 0}</p>
          </div>
        </div>

        {/* Levels */}
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Уровни программы</h3>
            <div className="space-y-4">
              {referralLevels.map((level) => {
                const levelStats = levelsStats[`level${level.level}`] || { count: 0, totalDeposits: 0, totalTonDeposits: 0, totalEarnings: 0 };
                const totalAllLevels = (levelsStats.level1?.count || 0) + (levelsStats.level2?.count || 0) + (levelsStats.level3?.count || 0);
                const percent = totalAllLevels > 0 ? ((levelStats.count / totalAllLevels) * 100).toFixed(1) : 0;
                
                return (
                  <div key={level.level} className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground">Уровень {level.level}</span>
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: level.color }}
                      >
                        {percent}%
                      </span>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Рефералов:</span>
                        <span className="font-semibold text-foreground">{levelStats.count}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Депозиты TON:</span>
                        <span className="font-semibold text-foreground">{levelStats.totalTonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Заработано TON:</span>
                        <span className="font-semibold text-success">{levelStats.totalEarnings.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${percent}%`,
                          backgroundColor: level.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
        </div>

        {/* Table */}
        <div className="glass-card">
          <div className="p-5 border-b border-border flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground">Топ рефереров</h3>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Поиск..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="px-5 py-4 font-medium">Пользователь</th>
                  <th className="px-5 py-4 font-medium">Реферальный код</th>
                  <th className="px-5 py-4 font-medium text-center">Рефералов</th>
                  <th className="px-5 py-4 font-medium text-right">Заработано TON</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.map((user: any) => (
                  <tr key={user.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-foreground">
                          {getSafeInitial(user.fullName, user.username)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{sanitizeUserName(user.fullName || user.username) || `@user_${user.id}`}</p>
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            ID: <span className="text-primary hover:underline font-medium">{user.id}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-primary font-mono">{user.referralCode}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-semibold text-foreground">{user.referrals}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-success">{user.earned.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {topReferrers.length > 0 && (
            <div className="p-5 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Показано 1-{topReferrers.length} из {topReferrers.length} рефереров
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralsPage;
