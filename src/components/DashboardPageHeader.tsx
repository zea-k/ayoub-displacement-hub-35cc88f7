import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
}

export default function DashboardPageHeader({ title, subtitle, badge, action, className }: DashboardPageHeaderProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl ${className ?? ""}`}>
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {badge ?? "Dashboard"}
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex items-center justify-start lg:justify-end">{action}</div> : null}
      </div>
    </div>
  );
}
