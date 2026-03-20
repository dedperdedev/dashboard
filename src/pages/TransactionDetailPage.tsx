import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, Check, X, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.getTransaction(id!),
    enabled: !!id,
  });

  // Получаем все транзакции пользователя для расчета статистики
  const { data: userTransactions } = useQuery({
    queryKey: ['user-transactions-stats', transaction?.userId],
    queryFn: () => api.getTransactions(1, 10000, { userId: transaction?.userId }),
    enabled: !!transaction?.userId,
  });

  // Рассчитываем статистику
  const stats = (() => {
    if (!userTransactions?.transactions) {
      return {
        tonDeposits: 0,
        starsDeposits: 0,
        totalWithdrawals: 0,
      };
    }

    const transactions = userTransactions.transactions;
    const deposits = transactions.filter((tx: any) => tx.type === 'deposit' && tx.status === 'completed');
    const withdrawals = transactions.filter((tx: any) => 
      (tx.type === 'withdraw' || tx.type === 'withdrawal') && tx.status === 'completed'
    );

    const tonDeposits = deposits
      .filter((tx: any) => String(tx.currency || '').toUpperCase() === 'TON')
      .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    const starsDeposits = deposits
      .filter((tx: any) => String(tx.currency || '').toUpperCase() === 'STARS')
      .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    const totalWithdrawals = withdrawals
      .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    return {
      tonDeposits,
      starsDeposits,
      totalWithdrawals,
    };
  })();

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

  const handleConfirm = async () => {
    // TODO: Реализовать подтверждение вывода через API
    toast({
      title: "Подтверждено",
      description: "Вывод подтвержден",
    });
  };

  const handleCancel = async () => {
    // TODO: Реализовать отмену вывода через API
    toast({
      title: "Отменено",
      description: "Вывод отменен",
    });
  };

  const handleMakeWithdrawal = () => {
    if (!transaction || transaction.type !== 'withdraw' || !transaction.targetWallet) {
      toast({
        title: "Ошибка",
        description: "Недостаточно данных для создания вывода",
        variant: "destructive",
      });
      return;
    }

    // Конвертируем сумму в нанотоны (1 TON = 1,000,000,000 нанотонов)
    const amountInNano = Math.floor((transaction.amount || 0) * 1_000_000_000);
    const wallet = transaction.targetWallet;
    const text = encodeURIComponent("PILOT Pay");
    
    const tonLink = `ton://transfer/${wallet}?amount=${amountInNano}&text=${text}`;
    
    // Открываем ссылку
    window.location.href = tonLink;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center text-muted-foreground">Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">
          <p className="text-muted-foreground mb-4">Транзакция не найдена</p>
          <Button onClick={() => navigate('/transactions')}>
            Вернуться к списку
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Показываем страницу только для транзакций вывода
  if (transaction.type !== 'withdraw' && transaction.type !== 'withdrawal') {
    return (
      <DashboardLayout>
        <div className="p-10 text-center">
          <p className="text-muted-foreground mb-4">Эта страница доступна только для транзакций вывода</p>
          <Button onClick={() => navigate('/transactions')}>
            Вернуться к списку
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isInProgress = transaction.status === 'inProgress';
  const canMakeWithdrawal = isInProgress && transaction.targetWallet && transaction.currency?.toUpperCase() === 'TON';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/transactions')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Детали вывода</h1>
              <p className="text-sm text-muted-foreground">ID заказа: {transaction.orderId}</p>
            </div>
          </div>
          <div className={cn(
            "inline-flex px-3 py-1 rounded-lg text-sm font-medium",
            transaction.status === "completed" ? "bg-success/15 text-success" :
            transaction.status === "inProgress" ? "bg-warning/15 text-warning" :
            "bg-destructive/15 text-destructive"
          )}>
            {transaction.status === "completed" ? "Выполнено" :
             transaction.status === "inProgress" ? "В процессе" : "Отменено"}
          </div>
        </div>

        {/* User Statistics */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Статистика пользователя</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Депозиты TON</label>
              <p className="text-xl font-bold text-success">
                {stats.tonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Депозиты Stars</label>
              <p className="text-xl font-bold text-accent">
                {stats.starsDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Stars
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Подтвержденные выводы</label>
              <p className="text-xl font-bold text-foreground">
                {stats.totalWithdrawals.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Информация о транзакции</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Сумма</label>
              <p className="text-2xl font-bold text-foreground">
                {typeof transaction.amount === 'number' 
                  ? transaction.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : transaction.amount} {transaction.currency}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Валюта</label>
              <p className="text-lg font-semibold text-foreground">{transaction.currency}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Тип вывода</label>
              {transaction.withdrawalType ? (
                <div className="space-y-2">
                  <span className={cn(
                    "inline-flex px-2.5 py-1 rounded-lg text-xs font-medium",
                    transaction.withdrawalType === "position_earnings" 
                      ? "bg-primary/15 text-primary" 
                      : "bg-muted/15 text-muted-foreground"
                  )}>
                    {transaction.withdrawalType === "position_earnings" 
                      ? "Доход от позиции" 
                      : "Вывод депозита"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {transaction.withdrawalType === "position_earnings" 
                      ? "Пользователь выводит доход от активной позиции" 
                      : "Пользователь выводит депозит без активной позиции"}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Дата создания</label>
              <p className="text-foreground">{transaction.createdAt || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-2 block">Кошелёк получателя</label>
              <div className="flex items-center gap-2">
                <p className="text-foreground font-mono text-sm break-all">{transaction.targetWallet || '—'}</p>
                {transaction.targetWallet && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transaction.targetWallet!, "Адрес кошелька")}
                    className="h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ID пользователя</label>
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => navigate(`/users/${transaction.userId}`)}
              >
                {transaction.userId}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isInProgress && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Действия</h3>
            <div className="flex flex-wrap gap-3">
              {canMakeWithdrawal && (
                <Button
                  onClick={handleMakeWithdrawal}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Сделать вывод
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleConfirm}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Подтвердить
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Отменить
              </Button>
            </div>
            {canMakeWithdrawal && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Ссылка для вывода:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground break-all flex-1">
                    {`ton://transfer/${transaction.targetWallet}?amount=${Math.floor((transaction.amount || 0) * 1_000_000_000)}&text=${encodeURIComponent("PILOT Pay")}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(
                      `ton://transfer/${transaction.targetWallet}?amount=${Math.floor((transaction.amount || 0) * 1_000_000_000)}&text=${encodeURIComponent("PILOT Pay")}`,
                      "Ссылка для вывода"
                    )}
                    className="h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionDetailPage;
