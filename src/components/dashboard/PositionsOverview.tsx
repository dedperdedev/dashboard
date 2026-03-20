import { ArrowUpRight, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function PositionsOverview() {
  const navigate = useNavigate();
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['positions-stats'],
    queryFn: () => api.getPositionStats(),
  });

  const stats = statsData || {};
  const active = stats.active || 0;
  const total = stats.total || 0;
  const completed = (stats.byStatus?.completed || 0);
  const pending = total - active - completed;

  const data = [
    { name: "Активные", value: active, fill: "hsl(217, 91%, 60%)" },
    { name: "Завершённые", value: completed, fill: "hsl(217, 91%, 45%)" },
    { name: "Ожидание", value: pending, fill: "hsl(217, 91%, 30%)" },
  ];

  const statsDisplay = [
    { label: "Всего позиций", value: total.toLocaleString('ru-RU'), icon: TrendingUp },
    { label: "Активных", value: active.toString(), icon: CheckCircle },
    { label: "Ср. время", value: "24ч", icon: Clock },
  ];

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Позиции</h3>
        <button 
          className="action-btn"
          onClick={() => navigate('/positions')}
          title="Открыть страницу позиций"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {isLoading ? (
          <div className="col-span-3 p-4 text-center text-muted-foreground text-sm">Загрузка...</div>
        ) : (
          statsDisplay.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary mb-2">
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-base font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Bar Chart */}
      <div className="flex-1 min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={85}
              tick={{ fill: 'hsl(220, 15%, 50%)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 6, 6, 0]}
              barSize={20}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend values */}
      <div className="flex justify-between mt-3 pt-3 border-t border-border">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-sm text-muted-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
