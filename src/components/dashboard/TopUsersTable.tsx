import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sanitizeUserName } from "@/lib/utils";

export function TopUsersTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-users'],
    queryFn: () => api.getUsers(1, 5),
  });

  const users = data?.users || [];
  const totalBalance = users.reduce((sum: number, u: any) => sum + (u.tonBalance || 0), 0);

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Топ пользователей</h3>
        <button className="action-btn">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Нет пользователей</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Пользователь</th>
                <th className="pb-3 font-medium text-right">Баланс TON</th>
                <th className="pb-3 font-medium text-right">% от общего</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any, index: number) => {
                const percentage = totalBalance > 0 ? Math.round((user.tonBalance / totalBalance) * 100) : 0;
                return (
                  <tr 
                    key={user.id} 
                    className="table-row"
                  >
                    <td className="py-3">
                      <span className="text-muted-foreground font-medium text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-foreground font-medium text-sm">
                        {sanitizeUserName(user.username) || `@user_${user.id}`}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-foreground font-semibold text-sm">
                        {user.tonBalance?.toLocaleString('ru-RU') || 0} TON
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
