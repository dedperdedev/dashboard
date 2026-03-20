import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Save, DollarSign, Percent, Wallet, CreditCard, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const { data: levelsData, isLoading: levelsLoading } = useQuery({
    queryKey: ['referral-levels'],
    queryFn: () => api.getReferralLevels(),
  });

  const [formData, setFormData] = useState({
    tonPriceUsd: 0,
    starsToTon: 0,
    minTonDepositAmount: 0,
    minWithdrawAmount: 0,
    referralReward: 0,
    paymentWalletTon: "",
    withdrawChannelId: "",
  });

  const [referralLevels, setReferralLevels] = useState([
    { level: 1, rewardPercent: 0 },
    { level: 2, rewardPercent: 0 },
    { level: 3, rewardPercent: 0 },
  ]);

  // Инициализация данных настроек
  useEffect(() => {
    if (settings) {
      setFormData({
        tonPriceUsd: settings.tonPriceUsd || 0,
        starsToTon: settings.starsToTon || 0,
        minTonDepositAmount: settings.minTonDepositAmount || 0,
        minWithdrawAmount: settings.minWithdrawAmount || 0,
        referralReward: settings.referralReward || 0,
        paymentWalletTon: settings.paymentWalletTon || "",
        withdrawChannelId: settings.withdrawChannelId || "",
      });
    }
  }, [settings]);

  // Инициализация уровней реферальной программы
  useEffect(() => {
    if (levelsData?.levels) {
      const levels = levelsData.levels.sort((a: any, b: any) => a.level - b.level);
      // Убеждаемся, что есть все три уровня
      const defaultLevels = [
        { level: 1, rewardPercent: 0 },
        { level: 2, rewardPercent: 0 },
        { level: 3, rewardPercent: 0 },
      ];
      
      const mergedLevels = defaultLevels.map(defaultLevel => {
        const found = levels.find((l: any) => l.level === defaultLevel.level);
        return found || defaultLevel;
      });
      
      setReferralLevels(mergedLevels);
    }
  }, [levelsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const updateLevelsMutation = useMutation({
    mutationFn: api.updateReferralLevels,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-levels'] });
    },
  });

  const handleSave = async () => {
    await Promise.all([
      updateSettingsMutation.mutateAsync(formData),
      updateLevelsMutation.mutateAsync(referralLevels),
    ]);
  };

  const handleLevelChange = (level: number, value: number) => {
    setReferralLevels(prev => 
      prev.map(l => l.level === level ? { ...l, rewardPercent: value } : l)
    );
  };

  return (
    <DashboardLayout title="Настройки">
      <div className="space-y-6 max-w-4xl">
        {/* Currency Settings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Курсы валют
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Цена TON в USD</label>
              <input 
                type="number"
                value={formData.tonPriceUsd}
                onChange={(e) => setFormData({...formData, tonPriceUsd: parseFloat(e.target.value)})}
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Stars в TON</label>
              <input 
                type="number"
                value={formData.starsToTon}
                onChange={(e) => setFormData({...formData, starsToTon: parseInt(e.target.value)})}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Deposit/Withdraw Settings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Депозит и вывод
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Мин. депозит TON</label>
              <input 
                type="number"
                value={formData.minTonDepositAmount}
                onChange={(e) => setFormData({...formData, minTonDepositAmount: parseFloat(e.target.value)})}
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Мин. вывод TON</label>
              <input 
                type="number"
                value={formData.minWithdrawAmount}
                onChange={(e) => setFormData({...formData, minWithdrawAmount: parseFloat(e.target.value)})}
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Position Settings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            Настройки позиций
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Мин. прибыль (%)</label>
              <input 
                type="number"
                defaultValue="1.0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Макс. прибыль (%)</label>
              <input 
                type="number"
                defaultValue="1.3"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Кошельки
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Кошелёк для платежей TON</label>
              <input 
                type="text"
                value={formData.paymentWalletTon}
                onChange={(e) => setFormData({...formData, paymentWalletTon: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ID канала для выводов</label>
              <input 
                type="text"
                value={formData.withdrawChannelId}
                onChange={(e) => setFormData({...formData, withdrawChannelId: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Реферальная программа
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Награда за реферала (PLT)</label>
              <input 
                type="number"
                value={formData.referralReward}
                onChange={(e) => setFormData({...formData, referralReward: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {referralLevels.map((level) => (
                <div key={level.level}>
                  <label className="text-sm text-muted-foreground mb-2 block">Уровень {level.level} (%)</label>
                  <input 
                    type="number"
                    value={level.rewardPercent}
                    onChange={(e) => handleLevelChange(level.level, parseInt(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            className="btn-primary"
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || updateLevelsMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending || updateLevelsMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
