import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionsChart } from "@/components/dashboard/TransactionsChart";
import { EarningsDonut } from "@/components/dashboard/EarningsDonut";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PositionsOverview } from "@/components/dashboard/PositionsOverview";
import { TopUsersTable } from "@/components/dashboard/TopUsersTable";
import { Users, ArrowLeftRight, TrendingUp, ListTodo } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const formatNumber = (num: number) => {
    return num?.toLocaleString('ru-RU') || '0';
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-4 bg-secondary rounded w-24 mb-4"></div>
                <div className="h-8 bg-secondary rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Ошибка загрузки данных</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Не удалось загрузить статистику дашборда. Проверьте консоль браузера (F12) для деталей ошибки.
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground">
                API URL: {import.meta.env.VITE_API_URL || 'не настроен'}
              </p>
              {error instanceof Error && (
                <p className="text-xs text-destructive">
                  Ошибка: {error.message}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="animate-slide-up cursor-pointer" onClick={() => navigate('/users')}>
            <StatCard
              title="Всего пользователей"
              value={formatNumber(stats?.users?.total || 0)}
              change={stats?.users?.newLast30Days ? calculateChange(stats.users.newLast30Days, (stats.users.total - stats.users.newLast30Days)) : undefined}
              subtitle="Новых за 30 дней"
              icon={Users}
            />
          </div>
          <div className="animate-slide-up delay-100 cursor-pointer" onClick={() => navigate('/transactions')}>
            <StatCard
              title="Транзакций"
              value={formatNumber(stats?.transactions?.total || 0)}
              change={stats?.transactions?.newLast30Days ? calculateChange(stats.transactions.newLast30Days, (stats.transactions.total - stats.transactions.newLast30Days)) : undefined}
              subtitle="Новых за 30 дней"
              icon={ArrowLeftRight}
              variant="gradient"
            />
          </div>
          <div className="animate-slide-up delay-200 cursor-pointer" onClick={() => navigate('/positions')}>
            <StatCard
              title="Активных позиций"
              value={formatNumber(stats?.positions?.active || 0)}
              subtitle={`Всего: ${formatNumber(stats?.positions?.total || 0)}`}
              icon={TrendingUp}
            />
          </div>
          <div className="animate-slide-up delay-300 cursor-pointer" onClick={() => navigate('/tasks')}>
            <StatCard
              title="Выполнено задач"
              value={formatNumber(stats?.claimedTasks?.total || 0)}
              icon={ListTodo}
              variant="glow"
            />
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Balance Chart */}
          <div className="lg:col-span-8 animate-fade-in">
            <TransactionsChart />
          </div>

          {/* Earnings Donut */}
          <div className="lg:col-span-4 animate-fade-in delay-100">
            <EarningsDonut />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recent Transactions */}
          <div className="lg:col-span-5 animate-fade-in">
            <RecentTransactions />
          </div>

          {/* Positions Overview */}
          <div className="lg:col-span-3 animate-fade-in delay-100">
            <PositionsOverview />
          </div>

          {/* Top Users */}
          <div className="lg:col-span-4 animate-fade-in delay-200">
            <TopUsersTable />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
