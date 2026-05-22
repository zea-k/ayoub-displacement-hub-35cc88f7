import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, Zap } from "lucide-react";
import SubscriptionCheckout from "@/components/SubscriptionCheckout";

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
  sort_order: number;
}

export default function PricingPage() {
  const { user, userProfile } = useAuth();
  const { openRegister } = useAuthModal();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [selectedTier, setSelectedTier] = useState<"premium_monthly" | "premium_yearly" | null>(null);
  const [loading, setLoading] = useState(true);
  const hasActiveAccess = userProfile?.user_type === "business" &&
    (userProfile.subscription_status === "trial" || userProfile.subscription_status === "active");
  const isExpiredBusiness = userProfile?.user_type === "business" && userProfile.subscription_status === "inactive";

  useEffect(() => {
    // Buyers go to marketplace; everyone else (including logged-out) sees pricing
    if (user && userProfile?.user_type === "buyer") {
      navigate("/market");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error(error);
      }
      setPlans(
        (data || []).map((d: any) => ({
          ...d,
          features: Array.isArray(d.features) ? d.features : [],
        }))
      );
      setLoading(false);
    })();
  }, [user, userProfile, navigate]);

  const handleSelect = (tier: string) => {
    if (!user) {
      openRegister();
      return;
    }
    setSelectedTier(tier as any);
  };

  if (selectedTier) {
    return <SubscriptionCheckout tier={selectedTier} onSuccess={() => setSelectedTier(null)} />;
  }

  if (hasActiveAccess) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <Card className="mx-auto max-w-2xl border-border bg-card p-6 text-center shadow-sm md:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Free trial yako inaendelea</h1>
          <p className="mt-3 text-muted-foreground">
            Unaweza kutumia dashboard na features zote kwa siku 30 bila kulipa. Malipo yatahitajika baada ya trial kuisha.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-6 h-12 rounded-lg bg-primary text-primary-foreground">
            Endelea kwenye dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading plans…</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Premium plans for your business
          </h1>
          <p className="text-xl text-muted-foreground">
            {isExpiredBusiness ? "Chagua njia ya malipo kuendelea kutumia dashboard" : "Malipo huanza baada ya trial ya siku 30 kuisha"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const isYearly = plan.tier === "premium_yearly";
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:scale-[1.02] ${
                  isYearly
                    ? "border-2 border-primary/30 bg-card shadow-sm"
                    : "border border-border bg-card shadow-sm"
                }`}
              >
                {isYearly && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-bold py-2 text-center">
                    ⭐ BEST VALUE • SAVE 2 MONTHS
                  </div>
                )}
                <div className={`p-6 ${isYearly ? "pt-12" : ""}`}>
                  <h2 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h2>
                  <p className="text-muted-foreground text-sm mb-5">{plan.description}</p>

                  <div className="mb-5 pb-5 border-b border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground">
                        {plan.currency} {Number(plan.price).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/ {plan.billing_period}</span>
                    </div>
                  </div>

                  <div className="mb-5 p-4 bg-secondary rounded-xl border border-border flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-semibold text-secondary-foreground">Lipa baada ya trial kuisha</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {(plan.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="w-5 h-5 text-success shrink-0 mt-0.5" /> {f}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelect(plan.tier)}
                    className="w-full py-3 font-bold text-lg rounded-xl bg-primary text-primary-foreground"
                  >
                    {user ? "Chagua njia ya malipo" : "Sign up to start trial"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
