import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, User, Wallet, TrendingUp, Users, Settings, DollarSign, ArrowDownLeft, ArrowUpRight, ChevronRight, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, sanitizeUserName, getSafeInitial, getDisplayName } from "@/lib/utils";
import { useState, useRef } from "react";
import ReferralTree from "@/components/referral/ReferralTree";
import { useToast } from "@/hooks/use-toast";

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

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

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  });


  const { data: userTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['user-transactions', id],
    queryFn: () => api.getTransactions(1, 1000, { userId: id }),
    enabled: !!id,
  });

  const { data: userPositions, isLoading: positionsLoading } = useQuery({
    queryKey: ['user-positions', id],
    queryFn: () => api.getPositions(1, 1000, { userId: id }),
    enabled: !!id,
  });

  // Фильтруем транзакции и позиции для текущего пользователя (двойная проверка)
  const userIdNum = id ? parseFloat(id) : 0;
  const transactions = (userTransactions?.transactions || []).filter((tx: any) => {
    const txUserId = typeof tx.userId === 'number' ? tx.userId : parseFloat(tx.userId);
    return txUserId === userIdNum;
  });
  const deposits = transactions.filter((tx: any) => tx.type === 'deposit');
  const withdrawals = transactions.filter((tx: any) => tx.type === 'withdraw' || tx.type === 'withdrawal');
  const positions = (userPositions?.positions || []).filter((pos: any) => {
    const posUserId = typeof pos.userId === 'number' ? pos.userId : parseFloat(pos.userId);
    return posUserId === userIdNum;
  });

  // Получаем детальную информацию о рефералах
  const { data: referralsData, isLoading: referralsLoading } = useQuery({
    queryKey: ['user-referrals', id],
    queryFn: () => api.getUserReferrals(id!),
    enabled: !!id && !!user,
  });

  // Получаем рефералов пользователя
  const referrersEarnings = user?.referrersEarnings || [];
  const totalReferrals = referralsData?.totalStats?.totalReferrals || referrersEarnings.length;
  const totalReferralEarned = referralsData?.totalStats?.totalEarnings || user?.referralEarned || 0;
  
  const [referralView, setReferralView] = useState<'tree' | 'levels'>('tree');
  
  // Refs для навигации по уровням
  const level1Ref = useRef<HTMLDivElement>(null);
  const level2Ref = useRef<HTMLDivElement>(null);
  const level3Ref = useRef<HTMLDivElement>(null);
  
  const scrollToLevel = (level: number) => {
    const refs = [level1Ref, level2Ref, level3Ref];
    const ref = refs[level - 1];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">
          <p className="text-muted-foreground mb-4">Пользователь не найден</p>
          <button onClick={() => navigate('/users')} className="btn-primary">
            Вернуться к списку
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/users')}
              className="action-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-foreground">
                {getSafeInitial(user.fullName, user.username)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{getDisplayName(user.fullName, user.username, user.id)}</h1>
                  {user.isInfl && (
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-accent/20 text-accent">
                      infl
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{sanitizeUserName(user.username) || `@user_${user.id}`}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex px-3 py-1 rounded-lg text-sm font-medium",
              user.status === "active"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            )}>
              {user.status === "active" ? "Активен" : "Заблокирован"}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">TON Баланс</p>
            <p className="text-2xl font-bold text-foreground">{user.tonBalance?.toLocaleString('ru-RU') || 0} TON</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">PLT Баланс</p>
            <p className="text-2xl font-bold text-foreground">{user.pltBalance?.toLocaleString('ru-RU') || 0} PLT</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Рефералов</p>
            <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Заработано</p>
            <p className="text-2xl font-bold text-foreground">{totalReferralEarned.toLocaleString('ru-RU')} TON</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Информация
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Депозиты ({deposits.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Выводы ({withdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Позиции ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Рефералы ({totalReferrals})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            {/* Referrer Info */}
            {user?.referrer && (user.referrer.id || user.referrer.userId) && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Реферер</h3>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors cursor-pointer" onClick={() => navigate(`/users/${user.referrer.id || user.referrer.userId}`)}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-foreground">
                    {getSafeInitial(user.referrer.fullName, user.referrer.username)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{getDisplayName(user.referrer.fullName, user.referrer.username, user.referrer.id || user.referrer.userId)}</p>
                      {user.referrer.level && (
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                          user.referrer.level === 1 && "bg-primary/15 text-primary",
                          user.referrer.level === 2 && "bg-accent/15 text-accent",
                          user.referrer.level === 3 && "bg-muted text-muted-foreground"
                        )}>
                          Уровень {user.referrer.level}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{sanitizeUserName(user.referrer.username) || `@user_${user.referrer.id || user.referrer.userId}`}</p>
                    {user.referrer.referralCode && (
                      <p className="text-xs text-muted-foreground mt-1">Реферальный код: <span className="font-mono text-primary">{user.referrer.referralCode}</span></p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Основная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">ID пользователя</label>
                  <p className="text-foreground font-mono">{user.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Username</label>
                  <p className="text-foreground">{sanitizeUserName(user.username) || 'Не указано'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Полное имя</label>
                  <p className="text-foreground">{sanitizeUserName(user.fullName) || 'Не указано'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Реферальный код</label>
                  <p className="text-foreground font-mono text-primary">{user.referralCode}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Кошелёк TON</label>
                  <p className="text-foreground font-mono text-sm break-all">{user.walletAddress || 'Не указан'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Язык</label>
                  <p className="text-foreground">{user.langCode || 'Не указан'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Дата регистрации</label>
                  <p className="text-foreground">{user.joinedAt || 'Не указана'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Последний вход</label>
                  <p className="text-foreground">{user.lastLogin || 'Никогда'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Количество входов</label>
                  <p className="text-foreground">{user.loginsCount || 0}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Статус бота</label>
                  <p className="text-foreground">{user.status === 'blocked' ? 'Заблокирован' : 'Активен'}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Балансы</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">TON Баланс</label>
                  <p className="text-2xl font-bold text-foreground">{user.tonBalance?.toLocaleString('ru-RU') || 0} TON</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">PLT Баланс</label>
                  <p className="text-2xl font-bold text-foreground">{user.pltBalance?.toLocaleString('ru-RU') || 0} PLT</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Виртуальный TON</label>
                  <p className="text-2xl font-bold text-foreground">{user.virtualTonBalance || 0} TON</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-6">
            <div className="glass-card">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Депозиты</h3>
              </div>
              <div className="overflow-x-auto">
                {transactionsLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
                ) : deposits.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">Нет депозитов</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                        <th className="px-5 py-4 font-medium">ID заказа</th>
                        <th className="px-5 py-4 font-medium text-right">Сумма</th>
                        <th className="px-5 py-4 font-medium">Валюта</th>
                        <th className="px-5 py-4 font-medium">Статус</th>
                        <th className="px-5 py-4 font-medium">Кошелёк</th>
                        <th className="px-5 py-4 font-medium">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((tx: any) => (
                        <tr key={tx.id} className="table-row">
                          <td className="px-5 py-4">
                            <span className="text-sm font-mono text-foreground">{tx.orderId}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-success text-sm">
                              +{typeof tx.amount === 'number' ? tx.amount.toLocaleString('ru-RU') : tx.amount} {tx.currency}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-foreground">{tx.currency}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                              tx.status === "completed" ? "bg-success/15 text-success" :
                              tx.status === "inProgress" ? "bg-warning/15 text-warning" :
                              "bg-destructive/15 text-destructive"
                            )}>
                              {tx.status === "completed" ? "Выполнено" :
                               tx.status === "inProgress" ? "В процессе" : "Отменено"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground font-mono text-xs">
                                {tx.sourceWallet ? `${tx.sourceWallet.substring(0, 20)}...` : '—'}
                              </span>
                              {tx.sourceWallet && (
                                <button
                                  onClick={() => copyToClipboard(tx.sourceWallet, "Адрес кошелька")}
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                  title="Копировать адрес кошелька"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6">
            <div className="glass-card">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Выводы</h3>
              </div>
              <div className="overflow-x-auto">
                {transactionsLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
                ) : withdrawals.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">Нет выводов</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                        <th className="px-5 py-4 font-medium">ID заказа</th>
                        <th className="px-5 py-4 font-medium text-right">Сумма</th>
                        <th className="px-5 py-4 font-medium">Валюта</th>
                        <th className="px-5 py-4 font-medium">Тип вывода</th>
                        <th className="px-5 py-4 font-medium">Статус</th>
                        <th className="px-5 py-4 font-medium">Кошелёк</th>
                        <th className="px-5 py-4 font-medium">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((tx: any) => (
                        <tr 
                          key={tx.id} 
                          className="table-row cursor-pointer hover:bg-secondary/50"
                          onClick={() => navigate(`/transactions/${tx.id}`)}
                        >
                          <td className="px-5 py-4">
                            <span className="text-sm font-mono text-foreground">{tx.orderId}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-foreground text-sm">
                              -{typeof tx.amount === 'number' ? tx.amount.toLocaleString('ru-RU') : tx.amount} {tx.currency}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-foreground">{tx.currency}</span>
                          </td>
                          <td className="px-5 py-4">
                            {tx.withdrawalType && (
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
                            {!tx.withdrawalType && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                              tx.status === "completed" ? "bg-success/15 text-success" :
                              tx.status === "inProgress" ? "bg-warning/15 text-warning" :
                              "bg-destructive/15 text-destructive"
                            )}>
                              {tx.status === "completed" ? "Выполнено" :
                               tx.status === "inProgress" ? "В процессе" : "Отменено"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground font-mono text-xs">
                                {tx.targetWallet ? `${tx.targetWallet.substring(0, 20)}...` : '—'}
                              </span>
                              {tx.targetWallet && (
                                <button
                                  onClick={() => copyToClipboard(tx.targetWallet, "Адрес кошелька")}
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                  title="Копировать адрес кошелька"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
            </div>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            <div className="glass-card">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Позиции</h3>
              </div>
              <div className="overflow-x-auto">
                {positionsLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
                ) : positions.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">Нет позиций</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                        <th className="px-5 py-4 font-medium">Тип</th>
                        <th className="px-5 py-4 font-medium">Валюта</th>
                        <th className="px-5 py-4 font-medium text-right">Депозит</th>
                        <th className="px-5 py-4 font-medium">Статус</th>
                        <th className="px-5 py-4 font-medium">Интервал</th>
                        <th className="px-5 py-4 font-medium">Посл. активация</th>
                        <th className="px-5 py-4 font-medium">Создано</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos: any) => (
                        <tr key={pos.id} className="table-row">
                          <td className="px-5 py-4">
                            <span className="text-sm text-muted-foreground">
                              {pos.positionType ? (pos.positionType === 'forsage' ? 'Forsage (36ч)' : pos.positionType) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-foreground">{pos.currency}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-foreground text-sm">
                              {typeof pos.deposit === 'number' ? pos.deposit.toLocaleString('ru-RU') : pos.deposit} {pos.currency}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                              pos.status === "active" ? "bg-success/15 text-success" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {pos.status === "active" ? "Активна" : "Завершена"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-muted-foreground">
                              {pos.iterationIntervalMs ? `${pos.iterationIntervalMs / (1000 * 60 * 60)}ч` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-muted-foreground">{pos.lastActivatedAt || '—'}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-muted-foreground">{pos.createdAt}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Всего рефералов</p>
                <p className="text-2xl font-bold text-foreground">
                  {referralsLoading ? "..." : totalReferrals}
                </p>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Заработано</p>
                <p className="text-2xl font-bold text-success">
                  {referralsLoading ? "..." : totalReferralEarned.toLocaleString('ru-RU')} TON
                </p>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Всего депозитов</p>
                <p className="text-2xl font-bold text-foreground">
                  {referralsLoading ? "..." : (
                    <div className="space-y-1">
                      {referralsData?.totalStats?.totalTonDeposits !== undefined && referralsData.totalStats.totalTonDeposits > 0 && (
                        <div>{referralsData.totalStats.totalTonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON</div>
                      )}
                      {referralsData?.totalStats?.totalStarsDeposits !== undefined && referralsData.totalStats.totalStarsDeposits > 0 && (
                        <div className="text-accent">{referralsData.totalStats.totalStarsDeposits.toLocaleString('ru-RU')} Stars</div>
                      )}
                      {(!referralsData?.totalStats?.totalTonDeposits || referralsData.totalStats.totalTonDeposits === 0) && 
                       (!referralsData?.totalStats?.totalStarsDeposits || referralsData.totalStats.totalStarsDeposits === 0) && (
                        <div>{(referralsData?.totalStats?.totalDeposits || 0).toLocaleString('ru-RU')}</div>
                      )}
                    </div>
                  )}
                </p>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Реферальный код</p>
                <p className="text-xl font-bold text-primary font-mono break-all">{user.referralCode}</p>
              </div>
            </div>

            {/* Статистика по уровням */}
            {referralsData?.levels && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((level) => {
                  const levelData = referralsData.levels[`level${level}`];
                  if (!levelData) return null;
                  return (
                    <div key={level} className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          level === 1 && "bg-primary/15 text-primary",
                          level === 2 && "bg-accent/15 text-accent",
                          level === 3 && "bg-muted text-muted-foreground"
                        )}>
                          Уровень {level}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Рефералов</p>
                          <p className="text-lg font-bold text-foreground">{levelData.stats.count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Депозиты</p>
                          <div className="space-y-0.5">
                            {levelData.stats.totalTonDeposits !== undefined && levelData.stats.totalTonDeposits > 0 && (
                              <p className="text-sm font-semibold text-foreground">
                                {levelData.stats.totalTonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                              </p>
                            )}
                            {levelData.stats.totalStarsDeposits !== undefined && levelData.stats.totalStarsDeposits > 0 && (
                              <p className="text-sm font-semibold text-accent">
                                {levelData.stats.totalStarsDeposits.toLocaleString('ru-RU')} Stars
                              </p>
                            )}
                            {(!levelData.stats.totalTonDeposits || levelData.stats.totalTonDeposits === 0) && 
                             (!levelData.stats.totalStarsDeposits || levelData.stats.totalStarsDeposits === 0) && (
                              <p className="text-sm font-semibold text-foreground">
                                {levelData.stats.totalDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Заработано</p>
                          <p className="text-sm font-semibold text-success">
                            {levelData.stats.totalEarnings.toLocaleString('ru-RU')} TON
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Переключение вида */}
            <div className="flex gap-2">
              <button
                onClick={() => setReferralView('tree')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  referralView === 'tree'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                Реферальное дерево
              </button>
              <button
                onClick={() => setReferralView('levels')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  referralView === 'levels'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                По уровням
              </button>
            </div>

            {/* Реферальное дерево */}
            {referralView === 'tree' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Реферальное дерево</h3>
                {referralsLoading ? (
                  <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
                ) : referralsData?.tree && referralsData.tree.length > 0 ? (
                  <ReferralTree 
                    referrals={[...referralsData.tree].sort((a, b) => {
                      const aTotal = (a.tonDeposits || 0) + (a.starsDeposits || 0) || a.totalDeposits || 0;
                      const bTotal = (b.tonDeposits || 0) + (b.starsDeposits || 0) || b.totalDeposits || 0;
                      return bTotal - aTotal;
                    })} 
                  />
                ) : (
                  <div className="p-10 text-center text-muted-foreground">Нет рефералов</div>
                )}
              </div>
            )}

            {/* Список по уровням */}
            {referralView === 'levels' && referralsData?.levels && (
              <div className="space-y-6">
                {/* Кнопки быстрой навигации */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground mr-2">Быстрая навигация:</span>
                    {[1, 2, 3].map((level) => {
                      const levelData = referralsData.levels[`level${level}`];
                      if (!levelData || (levelData.referrals || []).length === 0) return null;
                      
                      return (
                        <button
                          key={level}
                          onClick={() => scrollToLevel(level)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            level === 1 && "bg-primary/15 text-primary hover:bg-primary/25",
                            level === 2 && "bg-accent/15 text-accent hover:bg-accent/25",
                            level === 3 && "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                          )}
                        >
                          Уровень {level} ({levelData.stats.count})
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {[1, 2, 3].map((level) => {
                  const levelData = referralsData.levels[`level${level}`];
                  if (!levelData) return null;
                  // Показываем блок даже если рефералов нет, но есть статистика
                  const referrals = levelData.referrals || [];
                  if (referrals.length === 0 && (levelData.stats?.count || 0) === 0) return null;
                  
                  // Сортируем рефералов по размеру депозита (убывание)
                  const sortedReferrals = [...referrals].sort((a: any, b: any) => {
                    const aTotal = (a.tonDeposits || 0) + (a.starsDeposits || 0) || a.totalDeposits || 0;
                    const bTotal = (b.tonDeposits || 0) + (b.starsDeposits || 0) || b.totalDeposits || 0;
                    return bTotal - aTotal;
                  });
                  
                  const levelRef = level === 1 ? level1Ref : level === 2 ? level2Ref : level3Ref;

                  return (
                    <div key={level} ref={levelRef} className="glass-card scroll-mt-4">
                      <div className="p-5 border-b border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              level === 1 && "bg-primary/15 text-primary",
                              level === 2 && "bg-accent/15 text-accent",
                              level === 3 && "bg-muted text-muted-foreground"
                            )}>
                              Уровень {level}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({(levelData.referrals || []).length} рефералов)
                            </span>
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Депозиты</p>
                            <div className="space-y-0.5">
                              {levelData.stats.totalTonDeposits !== undefined && levelData.stats.totalTonDeposits > 0 && (
                                <p className="font-semibold text-foreground">
                                  {levelData.stats.totalTonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                                </p>
                              )}
                              {levelData.stats.totalStarsDeposits !== undefined && levelData.stats.totalStarsDeposits > 0 && (
                                <p className="font-semibold text-accent">
                                  {levelData.stats.totalStarsDeposits.toLocaleString('ru-RU')} Stars
                                </p>
                              )}
                              {(!levelData.stats.totalTonDeposits || levelData.stats.totalTonDeposits === 0) && 
                               (!levelData.stats.totalStarsDeposits || levelData.stats.totalStarsDeposits === 0) && (
                                <p className="font-semibold text-foreground">
                                  {levelData.stats.totalDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Заработано</p>
                              <p className="font-semibold text-success">
                                {levelData.stats.totalEarnings.toLocaleString('ru-RU')} TON
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                              <th className="px-5 py-4 font-medium">Пользователь</th>
                              <th className="px-5 py-4 font-medium">Реф. код</th>
                              <th className="px-5 py-4 font-medium text-right">Депозиты</th>
                              <th className="px-5 py-4 font-medium text-right">Транзакций</th>
                              <th className="px-5 py-4 font-medium text-right">TON Бонус</th>
                              <th className="px-5 py-4 font-medium text-right">PLT Бонус</th>
                              <th className="px-5 py-4 font-medium">Дата регистрации</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedReferrals.map((ref: any) => (
                              <tr
                                key={ref.userId}
                                className="table-row cursor-pointer hover:bg-secondary/50"
                                onClick={() => navigate(`/users/${ref.userId}`)}
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-foreground">
                                      {getSafeInitial(ref.fullName, ref.username)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground text-sm">{sanitizeUserName(ref.fullName) || 'Не указано'}</p>
                                      <p className="text-xs text-muted-foreground">ID: {ref.userId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-sm font-mono text-primary">{ref.referralCode}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="space-y-0.5">
                                    {ref.tonDeposits !== undefined && ref.tonDeposits > 0 && (
                                      <div className="font-semibold text-foreground text-sm">
                                        {ref.tonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                                      </div>
                                    )}
                                    {ref.starsDeposits !== undefined && ref.starsDeposits > 0 && (
                                      <div className="font-semibold text-accent text-sm">
                                        {ref.starsDeposits.toLocaleString('ru-RU')} Stars
                                      </div>
                                    )}
                                    {(!ref.tonDeposits || ref.tonDeposits === 0) && 
                                     (!ref.starsDeposits || ref.starsDeposits === 0) && (
                                      <div className="font-semibold text-foreground text-sm">
                                        {ref.totalDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm text-foreground">{ref.depositsCount}</span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="font-semibold text-success text-sm">
                                    {ref.earnings.tonBonus.toLocaleString('ru-RU')} TON
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm text-foreground">
                                    {ref.earnings.pltBonus} PLT
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-sm text-muted-foreground">{ref.joinedAt || '—'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Настройки пользователя</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Реферальный код</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user.referralCode}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-mono"
                    />
                    <button className="btn-secondary">Копировать</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Кошелёк TON</label>
                  <input
                    type="text"
                    value={user.walletAddress || ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Язык интерфейса</label>
                  <select
                    value={user.langCode || 'ru'}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    checked={user.status === 'active'}
                    className="w-4 h-4 rounded"
                  />
                  <label className="text-sm text-foreground">Активный пользователь</label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserDetailPage;
