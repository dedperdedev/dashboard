import { useState } from "react";
import { ChevronRight, ChevronDown, User, DollarSign, TrendingUp, Users } from "lucide-react";
import { cn, sanitizeUserName, getSafeInitial } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ReferralNode {
  userId: number;
  username: string;
  fullName: string;
  referralCode: string;
  level: number;
  joinedAt: string | null;
  tonBalance: number;
  pltBalance: number;
  totalDeposits: number;
  tonDeposits?: number;
  starsDeposits?: number;
  depositsCount: number;
  earnings: {
    tonBonus: number;
    pltBonus: number;
  };
  deposits: Array<{
    id: string;
    amount: number;
    currency: string;
    createdAt: string | null;
  }>;
  children?: ReferralNode[];
}

interface ReferralTreeProps {
  referrals: ReferralNode[];
  level?: number;
}

const ReferralTree = ({ referrals, level = 1 }: ReferralTreeProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (userId: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpanded(newExpanded);
  };

  if (referrals.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Нет рефералов на этом уровне
      </div>
    );
  }

  // Сортируем рефералов по размеру депозита (убывание)
  const sortedReferrals = [...referrals].sort((a, b) => {
    const aTotal = (a.tonDeposits || 0) + (a.starsDeposits || 0) || a.totalDeposits || 0;
    const bTotal = (b.tonDeposits || 0) + (b.starsDeposits || 0) || b.totalDeposits || 0;
    return bTotal - aTotal;
  });

  return (
    <div className="space-y-2">
      {sortedReferrals.map((referral) => {
        const hasChildren = referral.children && referral.children.length > 0;
        const isExpanded = expanded.has(referral.userId);

        return (
          <div key={referral.userId} className="space-y-2">
            <div
              className={cn(
                "glass-card p-4 hover:bg-secondary/50 transition-colors",
                level === 1 && "border-l-4 border-primary",
                level === 2 && "border-l-4 border-accent",
                level === 3 && "border-l-4 border-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(referral.userId)}
                      className="action-btn w-6 h-6"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {!hasChildren && <div className="w-6" />}

                  <div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-foreground cursor-pointer"
                    onClick={() => navigate(`/users/${referral.userId}`)}
                  >
                    {getSafeInitial(referral.fullName, referral.username)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-medium text-foreground text-sm cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/users/${referral.userId}`)}
                      >
                        {sanitizeUserName(referral.fullName) || 'Не указано'}
                      </p>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        level === 1 && "bg-primary/15 text-primary",
                        level === 2 && "bg-accent/15 text-accent",
                        level === 3 && "bg-muted text-muted-foreground"
                      )}>
                        Уровень {level}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sanitizeUserName(referral.username) || `@user_${referral.userId}`} • ID: {referral.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Депозиты</p>
                    <div className="space-y-0.5">
                      {referral.tonDeposits !== undefined && referral.tonDeposits > 0 && (
                        <p className="font-semibold text-foreground">
                          {referral.tonDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                        </p>
                      )}
                      {referral.starsDeposits !== undefined && referral.starsDeposits > 0 && (
                        <p className="font-semibold text-accent">
                          {referral.starsDeposits.toLocaleString('ru-RU')} Stars
                        </p>
                      )}
                      {(!referral.tonDeposits || referral.tonDeposits === 0) && 
                       (!referral.starsDeposits || referral.starsDeposits === 0) && (
                        <p className="font-semibold text-muted-foreground">
                          {referral.totalDeposits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {referral.depositsCount} транзакций
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Заработано</p>
                    <p className="font-semibold text-success">
                      {referral.earnings.tonBonus.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referral.earnings.pltBonus} PLT
                    </p>
                  </div>
                </div>
              </div>

              {/* Детали депозитов */}
              {isExpanded && referral.deposits.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Депозиты:</p>
                  <div className="space-y-1">
                    {referral.deposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2 rounded bg-secondary/50 text-xs"
                      >
                        <span className="text-muted-foreground">{dep.createdAt}</span>
                        <span className="font-medium text-success">
                          +{dep.amount.toLocaleString('ru-RU')} {dep.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Дочерние рефералы */}
            {isExpanded && hasChildren && (
              <div className="ml-8">
                <ReferralTree 
                  referrals={[...referral.children!].sort((a, b) => {
                    const aTotal = (a.tonDeposits || 0) + (a.starsDeposits || 0) || a.totalDeposits || 0;
                    const bTotal = (b.tonDeposits || 0) + (b.starsDeposits || 0) || b.totalDeposits || 0;
                    return bTotal - aTotal;
                  })} 
                  level={level + 1} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReferralTree;
