import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<{ date: string; sales: number; profit: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalProfit: 0, totalTransactions: 0, avgTransaction: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const [salesRes, itemsRes] = await Promise.all([
        supabase.from("pos_sales").select("final_total, total_profit, created_at").eq("owner_id", user.id).gte("created_at", startDate),
        supabase.from("sale_items").select("product_name, quantity, item_subtotal, sale_id").order("quantity", { ascending: false }),
      ]);

      const sales = salesRes.data || [];
      const items = itemsRes.data || [];

      // Stats
      const totalRevenue = sales.reduce((s, r) => s + Number(r.final_total), 0);
      const totalProfit = sales.reduce((s, r) => s + Number(r.total_profit), 0);
      setStats({
        totalRevenue,
        totalProfit,
        totalTransactions: sales.length,
        avgTransaction: sales.length > 0 ? totalRevenue / sales.length : 0,
      });

      // Daily chart
      const grouped: Record<string, { sales: number; profit: number }> = {};
      sales.forEach(s => {
        const d = s.created_at.split("T")[0];
        if (!grouped[d]) grouped[d] = { sales: 0, profit: 0 };
        grouped[d].sales += Number(s.final_total);
        grouped[d].profit += Number(s.total_profit);
      });
      setDailyData(Object.entries(grouped).sort().map(([date, v]) => ({ date: date.slice(5), ...v })));

      // Top products
      const productMap: Record<string, { quantity: number; revenue: number }> = {};
      items.forEach(i => {
        if (!productMap[i.product_name]) productMap[i.product_name] = { quantity: 0, revenue: 0 };
        productMap[i.product_name].quantity += i.quantity;
        productMap[i.product_name].revenue += Number(i.item_subtotal);
      });
      const sorted = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
      setTopProducts(sorted.map(([name, v]) => ({ name, ...v })));
    };
    fetchAnalytics();
  }, [user]);

  const COLORS = [
    "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))",
    "hsl(var(--destructive))", "hsl(25, 60%, 65%)", "hsl(160, 30%, 55%)",
  ];

  const statCards = [
    { label: "Revenue (30d)", value: `TZS ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { label: "Profit (30d)", value: `TZS ${stats.totalProfit.toLocaleString()}`, icon: DollarSign, color: "text-accent" },
    { label: "Transactions", value: stats.totalTransactions, icon: ShoppingCart, color: "text-primary" },
    { label: "Avg Transaction", value: `TZS ${Math.round(stats.avgTransaction).toLocaleString()}`, icon: Star, color: "text-warning" },
  ];

  return (
    <div className="relative space-y-6">
      {/* Hero — landing page identity (theme-based card) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 border border-border/60 text-foreground text-xs font-medium mb-4 backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> Business Analytics
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            View Your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
            Detailed reports and insights on your business performance.
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="mt-2 font-heading text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Revenue (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Daily Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales data yet</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{p.quantity} sold</span>
                    <span className="font-bold">TZS {p.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
