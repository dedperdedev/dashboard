import { ArrowUpRight, Sparkles } from "lucide-react";

interface InsightCardProps {
  title?: string;
  message: string;
  className?: string;
}

export function InsightCard({ 
  title = "AI Insights", 
  message,
  className 
}: InsightCardProps) {
  return (
    <div className={`insight-card p-6 h-full flex flex-col ${className}`}>
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border w-fit mb-auto">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      <div className="mt-auto">
        {/* Dots indicator */}
        <div className="flex gap-1.5 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>

        {/* Message */}
        <p className="text-xl font-medium text-foreground leading-relaxed pr-12">
          {message}
        </p>
      </div>

      {/* Action button */}
      <button className="absolute bottom-6 right-6 action-btn hover:bg-primary/20 hover:text-primary">
        <ArrowUpRight className="w-5 h-5" />
      </button>
    </div>
  );
}
