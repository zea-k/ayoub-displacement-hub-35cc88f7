import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Check, Zap, ArrowRight, Smartphone, Building2 } from "lucide-react";

interface PlanRow {
  id: string;
  tier: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string;
  trial_days: number;
  description: string | null;
  features: string[] | null;
}

interface SubscriptionCheckoutProps {
  tier: "premium_monthly" | "premium_yearly";
  onSuccess?: () => void;
}

type PaymentType = "mobile_money" | "bank";

export default function SubscriptionCheckout({ tier, onSuccess }: SubscriptionCheckoutProps) {
  const { user, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("mobile_money");
  const [provider, setProvider] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("tier", tier)
        .maybeSingle();
      if (error || !data) {
        toast.error("Failed to load plan");
        return;
      }
      setPlan({
        ...data,
        features: Array.isArray(data.features) ? (data.features as string[]) : [],
      } as PlanRow);
    })();
  }, [tier]);

  const handleSubscribe = async () => {
    if (!user || !plan) return;
    if (!provider.trim() || !account.trim()) {
      toast.error("Enter your payment details");
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const planCode = plan.tier === "premium_yearly" ? "yearly" : "monthly";
      const endDate = new Date(now);
      if (planCode === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      // 1. Activate the paid subscription after the free trial has ended.
      const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: planCode,
          amount: plan.price,
          currency: plan.currency || "TZS",
          status: "active",
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();
      if (subErr) throw subErr;

      // 2. Record the payment attempt
      const { error: payErr } = await supabase.from("payment_attempts").insert({
        user_id: user.id,
        subscription_id: sub.id,
        plan: planCode,
        amount: plan.price,
        payment_method: paymentType === "mobile_money" ? `mobile_money:${provider}` : `bank:${provider}`,
        reference: account,
        status: "pending",
      });
      if (payErr) throw payErr;

      await getUserProfile();

      toast.success("Payment details received. Your premium access is active.");
      onSuccess?.();
      navigate("/dashboard");
    } catch (e: any) {
      console.error("Subscription error:", e);
      toast.error(e.message || "Failed to start subscription");
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return <div className="text-center py-12 text-gray-400">Loading plan…</div>;
  }

  const isMonthly = plan.billing_period === "monthly";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-white mb-2">Complete your payment setup</h1>
      <p className="text-gray-400 mb-8">
        Trial yako ya siku {plan.trial_days} ikiisha, chagua njia ya malipo ili kuendelea kutumia dashboard.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
          <p className="text-gray-400 mt-1">{plan.description}</p>

          <div className="bg-white/5 rounded-xl p-4 my-5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                {plan.currency} {Number(plan.price).toLocaleString()}
              </span>
              <span className="text-gray-400">/ {isMonthly ? "month" : "year"}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Payment due after free trial</p>
          </div>

          <div className="space-y-2">
            {(plan.features || []).map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-violet-400/20 p-6">
          <h3 className="font-semibold text-white mb-4">Payment summary</h3>
          <div className="space-y-3 text-sm">
            <Row label="Trial length" value={`${plan.trial_days} days`} />
            <Row label="First 30 days" value="Free" highlight />
            <div className="border-t border-white/10 pt-3">
              <Row
                label="Amount to pay"
                value={`${plan.currency} ${Number(plan.price).toLocaleString()}`}
                highlight
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Payment method</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setPaymentType("mobile_money")}
            className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              paymentType === "mobile_money"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            <Smartphone className="w-4 h-4" /> Mobile money
          </button>
          <button
            onClick={() => setPaymentType("bank")}
            className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              paymentType === "bank"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            <Building2 className="w-4 h-4" /> Bank transfer
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder={paymentType === "mobile_money" ? "Provider (M-Pesa, Tigo Pesa, Airtel Money)" : "Bank name"}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
          />
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={paymentType === "mobile_money" ? "Phone number e.g. +255 712 345 678" : "Account number"}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <Button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-50"
      >
        {loading ? "Processing…" : (
          <>
            <Zap className="w-5 h-5 mr-2" /> Submit payment details
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500 mt-4">
        Hutatozwa ndani ya siku 30 za kwanza. Malipo yanatumika baada ya trial kuisha.
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={highlight ? "text-violet-300 font-bold" : "text-white font-semibold"}>{value}</span>
    </div>
  );
}
