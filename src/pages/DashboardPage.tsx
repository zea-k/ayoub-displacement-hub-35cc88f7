import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface Stats {
  totalProducts: number;
  totalStockValue: number;
  salesToday: number;
  salesMonth: number;
  expensesMonth: number;
  profitMonth: number;
  lowStockProducts: { name: string; stock: number; low_stock_alert: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalStockValue: 0, salesToday: 0, salesMonth: 0, expensesMonth: 0, profitMonth: 0, lowStockProducts: [] });
  const [salesChart, setSalesChart] = useState<{ date: string; total: number; profit: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [prodRes, salesTodayRes, salesMonthRes, expMonthRes, lowStockRes] = await Promise.all([
        supabase.from("products").select("stock, buying_price").eq("owner_id", user.id),
        supabase.from("pos_sales").select("final_total, total_profit").eq("owner_id", user.id).gte("created_at", today),
        supabase.from("pos_sales").select("final_total, total_profit, created_at").eq("owner_id", user.id).gte("created_at", monthStart),
        supabase.from("expenses").select("amount").eq("owner_id", user.id).gte("date", monthStart),
        supabase.from("products").select("name, stock, low_stock_alert").eq("owner_id", user.id),
      ]);

      const products = prodRes.data || [];
      const salesTodayData = salesTodayRes.data || [];
      const salesMonthData = salesMonthRes.data || [];
      const expData = expMonthRes.data || [];
      const allProducts = lowStockRes.data || [];

      const totalStockValue = products.reduce((s, p) => s + (p.stock * p.buying_price), 0);
      const salesToday = salesTodayData.reduce((s, r) => s + Number(r.final_total), 0);
      const salesMonth = salesMonthData.reduce((s, r) => s + Number(r.final_total), 0);
      const profitMonth = salesMonthData.reduce((s, r) => s + Number(r.total_profit), 0);
      const expensesMonth = expData.reduce((s, e) => s + Number(e.amount), 0);
      const lowStockProducts = allProducts.filter(p => p.stock <= p.low_stock_alert);

      setStats({ totalProducts: products.length, totalStockValue, salesToday, salesMonth, expensesMonth, profitMonth: profitMonth - expensesMonth, lowStockProducts });

      const grouped: Record<string, { total: number; profit: number }> = {};
      salesMonthData.forEach(s => {
        const d = s.created_at.split("T")[0];
        if (!grouped[d]) grouped[d] = { total: 0, profit: 0 };
        grouped[d].total += Number(s.final_total);
        grouped[d].profit += Number(s.total_profit);
      });
      setSalesChart(Object.entries(grouped).sort().map(([date, v]) => ({ date: date.slice(5), ...v })));
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: t("dashboard.totalProducts"), value: stats.totalProducts.toLocaleString(), icon: Package, accent: "from-violet-500 to-purple-500" },
    { label: t("dashboard.stockValue"), value: `TZS ${stats.totalStockValue.toLocaleString()}`, icon: BarChart3, accent: "from-amber-500 to-orange-500" },
    { label: t("dashboard.salesToday"), value: `TZS ${stats.salesToday.toLocaleString()}`, icon: TrendingUp, accent: "from-emerald-500 to-teal-500" },
    { label: t("dashboard.salesMonth"), value: `TZS ${stats.salesMonth.toLocaleString()}`, icon: TrendingUp, accent: "from-violet-500 to-amber-500" },
    { label: t("dashboard.expensesMonth"), value: `TZS ${stats.expensesMonth.toLocaleString()}`, icon: TrendingDown, accent: "from-rose-500 to-red-500" },
    { label: t("dashboard.netProfit"), value: `TZS ${stats.profitMonth.toLocaleString()}`, icon: DollarSign, accent: stats.profitMonth >= 0 ? "from-emerald-500 to-green-500" : "from-rose-500 to-red-500" },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle") || "Your operational pulse in a premium, easy-to-scan layout."}
        action={
          <Button className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 hover:from-primary/90 hover:to-accent/90 transition-all" onClick={() => window.location.href = '/daily-reports'}>
            {t("dashboard.viewReports", "View Reports")}
          </Button>
        }
      />

      {/* Stat cards */}

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.accent} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
            <div className="relative">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} shadow-lg`}>
                <s.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="mt-1 font-heading text-base md:text-lg font-bold leading-tight">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">{t("dashboard.salesThisMonth")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.dailyRevenue")}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesChart}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(263 70% 60%)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(263 70% 60%)" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Bar dataKey="total" fill="url(#salesGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">{t("dashboard.profitThisMonth")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.dailyNet")}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Line type="monotone" dataKey="profit" stroke="hsl(160 60% 45%)" strokeWidth={3} dot={{ fill: "hsl(160 60% 45%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {stats.lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-heading text-base font-bold text-amber-600 dark:text-amber-400">{t("dashboard.lowStockAlerts")}</h3>
          </div>
          <div className="space-y-2">
            {stats.lowStockProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{p.stock} {t("dashboard.left")}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
