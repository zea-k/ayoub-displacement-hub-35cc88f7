import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, Percent } from "lucide-react";
import type { DailySummary } from "./types";

interface Props {
  summary: DailySummary;
}

const stats = [
  { key: 'totalSales', label: "Today's Sales", icon: DollarSign, format: (v: number) => `TZS ${v.toLocaleString()}` },
  { key: 'totalProfit', label: "Today's Profit", icon: TrendingUp, format: (v: number) => `TZS ${v.toLocaleString()}` },
  { key: 'totalTransactions', label: 'Transactions', icon: ShoppingCart, format: (v: number) => v.toString() },
  { key: 'totalDiscounts', label: 'Discounts', icon: Percent, format: (v: number) => `TZS ${v.toLocaleString()}` },
] as const;

export default function POSDailySummary({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {stats.map(s => (
        <Card key={s.key} className="bg-card">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold font-heading truncate">{s.format(summary[s.key])}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
