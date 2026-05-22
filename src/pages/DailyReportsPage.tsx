import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import DashboardPageHeader from "@/components/DashboardPageHeader";

interface DayClosing {
  id: string;
  date: string;
  total_sales: number;
  total_profit: number;
  total_expenses: number;
  net_profit: number;
  total_transactions: number;
  total_discounts: number;
  cash_total: number;
  mobile_money_total: number;
  bank_total: number;
  closed_at: string;
}

export default function DailyReportsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [closings, setClosings] = useState<DayClosing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("day_closings")
        .select("*")
        .eq("owner_id", user.id)
        .order("date", { ascending: false })
        .limit(90);
      setClosings((data as DayClosing[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totals = closings.reduce(
    (acc, c) => ({
      sales: acc.sales + Number(c.total_sales),
      profit: acc.profit + Number(c.total_profit),
      expenses: acc.expenses + Number(c.total_expenses),
      netProfit: acc.netProfit + Number(c.net_profit),
    }),
    { sales: 0, profit: 0, expenses: 0, netProfit: 0 }
  );

  const summaryCards = [
    { label: t("dailyReports.totalSales"), value: `TZS ${totals.sales.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: t("dailyReports.totalProfit"), value: `TZS ${totals.profit.toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
    { label: t("dailyReports.totalExpenses"), value: `TZS ${totals.expenses.toLocaleString()}`, icon: TrendingDown, color: "text-destructive" },
    { label: t("dailyReports.netProfit"), value: `TZS ${totals.netProfit.toLocaleString()}`, icon: Receipt, color: totals.netProfit >= 0 ? "text-accent" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("dailyReports.title")}
        subtitle={t("dailyReports.subtitle") || "Review daily closings and high-level financial summaries."}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map(s => (
          <Card key={s.label} className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="mt-1 font-heading text-lg font-bold leading-tight text-foreground">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">{t("dailyReports.history")}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">Daily closing summaries and financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : closings.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("dailyReports.empty")}</p>
                <p className="text-xs text-muted-foreground mt-1">Daily closings will appear here</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/40 bg-background/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-background/80">
                    <TableHead className="font-medium text-muted-foreground">{t("dailyReports.date")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">{t("dailyReports.sales")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">{t("dailyReports.profit")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">{t("dailyReports.expenses")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">{t("dailyReports.netProfit")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">{t("dailyReports.transactions")}</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">Cash</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">Mobile</TableHead>
                    <TableHead className="text-right font-medium text-muted-foreground">Bank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closings.map(c => (
                    <TableRow key={c.id} className="border-border/40 hover:bg-background/60 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(c.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium text-foreground">TZS {Number(c.total_sales).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium text-accent">+TZS {Number(c.total_profit).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium text-destructive">-TZS {Number(c.total_expenses).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className={`text-right font-bold`}>
                        <span className={`font-mono text-sm ${Number(c.net_profit) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {Number(c.net_profit) >= 0 ? '+' : ''}TZS {Number(c.net_profit).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-muted-foreground">{c.total_transactions}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-muted-foreground">TZS {Number(c.cash_total).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-muted-foreground">TZS {Number(c.mobile_money_total).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-muted-foreground">TZS {Number(c.bank_total).toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
