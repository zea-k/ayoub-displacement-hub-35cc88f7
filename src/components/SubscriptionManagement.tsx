import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface SubRow {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface PlanRow {
  id: string;
  tier: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string;
  description: string | null;
  features: string[] | null;
}

interface AccountTrialRow {
  trial_start_date: string | null;
  trial_end_date: string | null;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubRow | null>(null);
  const [accountTrial, setAccountTrial] = useState<{ start: string | null; end: string | null } | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: sub }, { data: planRows }, { data: acct }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, plan, amount, currency, status, start_date, end_date")
          .eq("user_id", user.id)
          .in("status", ["trial", "active"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("subscription_plans")
          .select("id, tier, name, price, currency, billing_period, description, features")
          .order("sort_order", { ascending: true }),
        supabase
          .from("user_account_types")
          .select("trial_start_date, trial_end_date")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setSubscription(sub as SubRow | null);
      const trialRow = acct as AccountTrialRow | null;
      setAccountTrial(
        trialRow ? { start: trialRow.trial_start_date, end: trialRow.trial_end_date } : null,
      );
      setPlans(
        ((planRows || []) as PlanRow[]).map((d) => ({
          ...d,
          features: Array.isArray(d.features) ? d.features : [],
        })),
      );
      setLoading(false);
    })();
  }, [user]);

  const handleCancel = async () => {
    if (!subscription) return;
    if (!confirm("Cancel your subscription?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscription.id);
    if (error) toast.error(error.message);
    else toast.success("Subscription cancelled");
    setLoading(false);
  };

  const trialInfo = useMemo(() => {
    const startStr = subscription?.start_date ?? accountTrial?.start ?? user?.created_at ?? null;
    const fallbackStart = startStr ? new Date(startStr).getTime() : now;
    const fallbackEnd = fallbackStart + 30 * 86_400_000;
    const endStr = subscription?.end_date ?? accountTrial?.end ?? new Date(fallbackEnd).toISOString();
    const end = new Date(endStr).getTime();
    const start = startStr ? new Date(startStr).getTime() : end - 30 * 86_400_000;
    const totalMs = Math.max(end - start, 1);
    const remainingMs = Math.max(end - now, 0);
    const days = Math.ceil(remainingMs / 86_400_000);
    const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
    const progress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100));
    return { days, hours, progress, end, expired: remainingMs <= 0 };
  }, [subscription, accountTrial, user?.created_at, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isTrial = subscription?.status === "trial" || (!subscription && trialInfo && !trialInfo.expired);
  const isActive = subscription?.status === "active";


  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Subscription
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Simamia plan yako na malipo
        </p>
      </motion.div>

      {/* Stacked hero cards */}
      <div className="relative">
        {/* Decorative back card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 0.96, y: 20 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="absolute inset-x-6 top-6 h-full rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 blur-xl"
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                {isTrial ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Free trial active
                  </>
                ) : isActive ? (
                  <>
                    <Crown className="h-3.5 w-3.5 text-primary" />
                    Premium active
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    No active plan
                  </>
                )}
              </div>

              <h2 className="mt-4 text-2xl font-bold capitalize text-foreground sm:text-3xl">
                {subscription ? subscription.plan.replace("_", " ") : "Choose a plan"}
              </h2>

              {trialInfo && (
                <div className="mt-6 rounded-3xl border border-primary/25 bg-primary/10 p-5 shadow-lg backdrop-blur sm:p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Clock className="h-4 w-4" />
                    Countdown ya free trial
                  </div>
                  <div className="mt-3 flex items-baseline gap-3">
                    <motion.span
                      key={trialInfo.days}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: easeOut }}
                      className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl"
                    >
                      {trialInfo.days}
                    </motion.span>
                    <span className="text-lg font-medium text-muted-foreground">
                      {trialInfo.expired ? "trial imeisha" : `${trialInfo.days === 1 ? "day" : "days"} remaining`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {trialInfo.hours}h • inaisha{" "}
                    {new Date(trialInfo.end).toLocaleDateString()}
                  </div>
                  {/* Progress */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trialInfo.progress}%` }}
                      transition={{ duration: 1.2, ease: easeOut }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              {subscription && (
                <>
                  <p className="text-sm text-muted-foreground">Bei ya plan</p>
                  <p className="text-3xl font-bold text-foreground">
                    {subscription.currency} {Number(subscription.amount).toLocaleString()}
                  </p>
                </>
              )}
              <Link to="/pricing" className="w-full lg:w-auto">
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-2xl bg-foreground px-6 font-semibold text-background shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] lg:w-auto"
                >
                  {isTrial ? "Lipa sasa" : isActive ? "Boresha plan" : "Chagua plan"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Available plans (stacked, modern) */}
      {plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              {isTrial ? "Lipa kabla trial kuisha" : "Plans zinazopatikana"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {plans.map((plan, i) => {
                const isYearly = plan.tier === "premium_yearly";
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: easeOut, delay: 0.15 + i * 0.08 }}
                    whileHover={{ y: -4 }}
                    className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all sm:p-7 ${
                      isYearly
                        ? "border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl"
                        : "border-border/60 bg-card/80 shadow-md hover:border-border"
                    }`}
                  >
                    {isYearly && (
                      <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                        <Crown className="h-3 w-3" /> Best value
                      </div>
                    )}

                    <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                    {plan.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.currency} {Number(plan.price).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {plan.billing_period}
                      </span>
                    </div>

                    {trialInfo && !trialInfo.expired && (
                      <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            Free trial countdown
                          </div>
                          <div className="rounded-full bg-background px-3 py-1 text-sm font-bold text-primary shadow-sm">
                            {trialInfo.days} siku
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${trialInfo.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <ul className="mt-5 space-y-2">
                      {(plan.features || []).slice(0, 4).map((f, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-foreground/80"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/pricing" className="mt-6 block">
                      <Button
                        className={`h-11 w-full rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          isYearly
                            ? "bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        Chagua {plan.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Billing & cancel */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Billing</h4>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tutakutumia reminder kabla ya kukutoza.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Tarehe ya kuisha</h4>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(subscription.end_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <Button
            onClick={handleCancel}
            variant="ghost"
            className="sm:col-span-2 h-11 rounded-2xl text-destructive hover:bg-destructive/10"
          >
            Cancel subscription
          </Button>
        </motion.div>
      )}
    </div>
  );
}
