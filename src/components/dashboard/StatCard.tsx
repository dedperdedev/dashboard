import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  subtitle?: string;
  variant?: "default" | "gradient" | "glow";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "с прошлого месяца",
  icon: Icon,
  subtitle,
  variant = "default",
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "glass-card-hover p-6 group",
        variant === "gradient" && "glow-card",
        variant === "glow" && "border-primary/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <button className="action-btn opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
        {change !== undefined && (
          <span
            className={cn(
              "text-sm font-medium flex items-center gap-1",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isNegative ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : null}
            {isPositive && "+"}
            {change}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground">
        {subtitle || changeLabel}
      </p>

      {/* Icon Background */}
      {Icon && (
        <div className="absolute right-4 bottom-4 w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="w-8 h-8 text-primary/30 group-hover:text-primary/50 transition-colors" />
        </div>
      )}
    </div>
  );
}
