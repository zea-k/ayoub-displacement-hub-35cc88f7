import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  Receipt,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  Building2,
  Crown,
  Globe,
  ChevronDown,
} from "lucide-react";

import SignUpButton from "@/components/marketing/SignUpButton";
import SectionWrapper from "@/components/marketing/SectionWrapper";
import GlassCard from "@/components/marketing/GlassCard";

const plans = [
  {
    name: "Starter",
    desc: "For small shops getting started",
    monthly: 15000,
    yearly: 144000,
    features: [
      { text: "1 business", icon: Building2 },
      { text: "Basic inventory tracking", icon: Package },
      { text: "Expense tracking", icon: Receipt },
      { text: "Monthly reports", icon: BarChart3 },
      { text: "Mobile access", icon: Smartphone },
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    desc: "Most popular — for growing businesses",
    monthly: 35000,
    yearly: 336000,
    features: [
      { text: "Up to 5 businesses", icon: Building2 },
      { text: "Full inventory + sales + reports", icon: Package },
      { text: "Customer management", icon: Users },
      { text: "Priority support", icon: Crown },
      { text: "PDF & Excel exports", icon: Receipt },
      { text: "Low stock alerts", icon: Zap },
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    desc: "For large businesses & chains",
    monthly: 75000,
    yearly: 720000,
    features: [
      { text: "Unlimited businesses", icon: Globe },
      { text: "Team accounts & roles", icon: Users },
      { text: "Advanced analytics", icon: BarChart3 },
      { text: "Custom setup & onboarding", icon: Crown },
      { text: "Dedicated support", icon: Shield },
      { text: "API access", icon: Zap },
    ],
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan comes with a 14-day free trial. No credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel anytime from your dashboard.",
  },
  {
    q: "Can I manage multiple businesses?",
    a: "Growth supports up to 5 businesses. Enterprise supports unlimited.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. ZEETOP works perfectly on phone, tablet, and desktop.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted and backed up securely.",
  },
];

export default function MarketingPricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,107,107,0.1),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            <Crown className="h-4 w-4" />
            Choose Your Plan
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold lg:text-5xl"
          >
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pricing
            </span>
          </motion.h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Start free. Upgrade when your business grows.
          </p>

          <div className="inline-flex rounded-2xl border border-border bg-card p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-xl px-6 py-3 ${
                !yearly
                  ? "bg-primary text-white"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setYearly(true)}
              className={`rounded-xl px-6 py-3 ${
                yearly
                  ? "bg-primary text-white"
                  : "text-muted-foreground"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <SectionWrapper className="!pt-0">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-3xl p-8 transition hover:-translate-y-2 ${
                plan.highlighted
                  ? "border-2 border-primary/30 bg-card shadow-xl"
                  : "border border-border bg-card/80"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">
                  Most Popular
                </div>
              )}

              <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
              <p className="mb-6 text-muted-foreground">{plan.desc}</p>

              <div className="mb-8">
                <span className="text-4xl font-bold">
                  TZS{" "}
                  {(yearly
                    ? plan.yearly / 12
                    : plan.monthly
                  ).toLocaleString()}
                </span>
                <span className="text-muted-foreground"> / month</span>
              </div>

              <SignUpButton className="mb-8 w-full rounded-2xl py-4">
                Start Free Trial
              </SignUpButton>

              <ul className="space-y-4">
                {plan.features.map((f, i) => {
                  const Icon = f.icon;

                  return (
                    <li
                      key={i}
                      className="flex items-start gap-3"
                    >
                      <div className="rounded-full bg-primary/10 p-1">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {f.text}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper>
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about ZEETOP
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <GlassCard key={i} className="!p-0">
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === i ? null : i)
                  }
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    className="px-6 pb-6 text-sm text-muted-foreground"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}