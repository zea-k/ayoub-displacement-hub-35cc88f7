import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Clock, CheckCircle2, XCircle, Truck, Phone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { StoreSettings } from "@/pages/PublicStorePage";

interface TrackedOrder {
  id: string;
  customer_name: string;
  quantity: number;
  status: string;
  created_at: string;
  products: { name: string; selling_price: number } | null;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "Pending", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  confirmed: { icon: CheckCircle2, label: "Confirmed", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  delivered: { icon: Truck, label: "Delivered", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  cancelled: { icon: XCircle, label: "Cancelled", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
};

interface Props {
  store: StoreSettings;
  isDark: boolean;
  onBack: () => void;
}

export function PublicStoreOrderTracking({ store, isDark, onBack }: Props) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const trimmed = phone.trim();
    if (!trimmed) { toast.error("Please enter your phone number"); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("public_orders")
      .select("id, customer_name, quantity, status, created_at, products(name, selling_price)")
      .eq("owner_id", store.owner_id)
      .eq("phone", trimmed)
      .order("created_at", { ascending: false })
      .limit(20);

    setLoading(false);
    setSearched(true);
    if (error) { toast.error("Failed to fetch orders"); return; }
    setOrders((data as unknown as TrackedOrder[]) || []);
  };

  const getStepIndex = (status: string) => {
    const steps = ["pending", "confirmed", "delivered"];
    if (status === "cancelled") return -1;
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen" style={{ background: isDark ? "#0a0a0f" : undefined }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: store.theme_color }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
        {/* Back button */}
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-700 hover:text-gray-900"}`}>
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {store.logo_url && (
            <img src={store.logo_url} alt={store.business_name} className="h-12 w-12 rounded-xl mx-auto mb-3 object-cover" />
          )}
          <h1 className={`font-heading text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Track Your Order
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
            Enter your phone number to check order status
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 border backdrop-blur-sm ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-lg"}`}
        >
          <div className="flex items-center gap-2">
            <Phone className={`h-4 w-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-600"}`} />
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+255..."
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className={`rounded-xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base ${isDark ? "text-white placeholder:text-gray-600" : ""}`}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full h-11 rounded-xl font-bold mt-3 text-white border-0 active:scale-[0.98] transition-all"
            style={{ backgroundColor: store.theme_color }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Track Orders</span>
            )}
          </Button>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }} className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                  <Package className={`h-12 w-12 mx-auto mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                  <p className={`font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No orders found</p>
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-gray-600"}`}>Check your phone number and try again</p>
                </div>
              ) : (
                orders.map((order, i) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  const stepIdx = getStepIndex(order.status);
                  const steps = ["Pending", "Confirmed", "Delivered"];

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`rounded-2xl border p-5 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}
                    >
                      {/* Product & date */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                            {order.products?.name || "Product"}
                          </h3>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                            {new Date(order.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}Qty: {order.quantity}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </div>
                      </div>

                      {/* Progress steps */}
                      {order.status !== "cancelled" && (
                        <div className="flex items-center gap-1 mt-2">
                          {steps.map((step, si) => (
                            <div key={step} className="flex-1 flex items-center gap-1">
                              <div
                                className="h-1.5 w-full rounded-full transition-all"
                                style={{
                                  backgroundColor: si <= stepIdx ? store.theme_color : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {order.status !== "cancelled" && (
                        <div className="flex justify-between mt-1.5">
                          {steps.map((step, si) => (
                            <span
                              key={step}
                              className="text-[10px] font-medium"
                              style={{ color: si <= stepIdx ? store.theme_color : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}
                            >
                              {step}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Total */}
                      {order.products?.selling_price && (
                        <p className={`text-xs font-semibold mt-3 pt-3 border-t ${isDark ? "border-white/5 text-gray-400" : "border-gray-100 text-gray-500"}`}>
                          Total: <span style={{ color: store.theme_color }}>TZS {(order.products.selling_price * order.quantity).toLocaleString()}</span>
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
