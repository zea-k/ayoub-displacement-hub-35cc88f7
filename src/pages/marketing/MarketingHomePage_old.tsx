import zeetopLogo from "@/assets/zeetop-logo.png";
import featureInventory from "@/assets/feature-inventory.jpg";
import featureSales from "@/assets/feature-sales.jpg";
import featureDashboard from "@/assets/feature-dashboard.jpg";
import featureReports from "@/assets/feature-reports.jpg";
import featureBranches from "@/assets/feature-branches.jpg";
import featureMobile from "@/assets/feature-mobile.jpg";

import { Link } from "react-router-dom";
import SignUpButton from "@/components/marketing/SignUpButton";

import {
  Cloud, Clock, RefreshCw, Layers, BookOpen, TrendingDown, BadgeDollarSign, Store
} from "lucide-react";
import SectionWrapper from "@/components/marketing/SectionWrapper";
import GlassCard from "@/components/marketing/GlassCard";
import LandingBottomNav from "@/components/marketing/LandingBottomNav";

const trustMetrics = [
  { icon: Clock, label: "24/7 Access" },
  { icon: Cloud, label: "Cloud-Based" },
  { icon: RefreshCw, label: "Real-Time Updates" },
  { icon: Layers, label: "Multi-Business" },
];

const whyCards = [
  { icon: BookOpen, title: "Stop Using Notebooks", desc: "Paper records get lost, damaged and cannot calculate profit. ZEETOP automates everything." },
  { icon: TrendingDown, title: "Stop Losing Stock", desc: "Know exactly what came in, what sold and what is missing. Get alerts before items run out." },
  { icon: BadgeDollarSign, title: "Know Profit Instantly", desc: "See real profit after expenses, not just revenue. Make smarter pricing decisions every day." },
  { icon: Store, title: "Manage Multiple Shops", desc: "One login to track all your branches. Compare performance and make informed growth decisions." },
];

const features = [
  { image: featureInventory, title: "Inventory Management", desc: "Never run out of stock with smart tracking and low stock alerts" },
  { image: featureSales, title: "Sales & Expenses", desc: "Track every sale and expense to know your true profit instantly" },
  { image: featureDashboard, title: "Business Dashboard", desc: "Real-time overview of your business performance at a glance" },
  { image: featureReports, title: "Reports & Downloads", desc: "Generate and download professional reports anytime" },
  { image: featureBranches, title: "Multi-Business / Branches", desc: "Manage multiple locations from one powerful dashboard" },
  { image: featureMobile, title: "Mobile-Friendly Access", desc: "Access your data anywhere, anytime on any device" },
];

export default function MarketingHomePage() {
  return (
    <>

      {/* Hero */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 pb-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          {/* Mobile: stacked center layout. Desktop: 2 col */}
          <div className="flex flex-col items-center text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            
            {/* Text content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                Now available for all businesses
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-gray-900 mb-6">
                Track Every Sale, Expense and Stock Item{" "}
                <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
                  From One Dashboard
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                ZEETOP helps shops, wholesalers and growing businesses manage inventory, profit and daily operations in real time.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <SignUpButton
                  className="px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-amber-500 text-white hover:from-violet-400 hover:to-amber-400 transition-all shadow-lg shadow-violet-500/25 text-sm"
                >
                  Start Free Trial
                </SignUpButton>
                <Link
                  to="/features"
                  className="px-7 py-3.5 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm"
                >
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* Big Logo */}
            <div className="order-1 lg:order-2 mb-8 lg:mb-0 flex justify-center">
              <div className="relative">
                {/* Glow behind logo */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-amber-500/20 rounded-full blur-[60px] scale-110" />
                <img
                  src={zeetopLogo}
                  alt="ZEETOP Logo"
                  className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <SectionWrapper>
        <div className="text-center mb-12">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mb-4">Trusted by growing businesses</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trustMetrics.map((m, i) => (
              <GlassCard key={i} delay={i * 0.1} className="text-center !p-4 sm:!p-5">
                <m.icon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400 mx-auto mb-2" />
                <p className="text-gray-900 text-xs sm:text-sm font-medium">{m.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Why ZEETOP */}
      <SectionWrapper>
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why ZEETOP?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">Stop losing money from poor records. Start making decisions based on real numbers.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {whyCards.map((c, i) => (
            <GlassCard key={i} delay={i * 0.1}>
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 flex items-center justify-center mb-3 sm:mb-4">
                <c.icon className="h-4 w-4 sm:h-5 sm:w-5 text-violet-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{c.desc}</p>
            </GlassCard>
          ))}
        </div>
      </SectionWrapper>

      {/* Features preview with real images */}
      <div id="features" className="scroll-mt-20" />
      <SectionWrapper>
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Run Your Business</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">Six powerful modules built for African business owners who are serious about growth.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <GlassCard key={i} delay={i * 0.08}>
              <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 border border-gray-200">
                <img 
                  src={f.image} 
                  alt={f.title} 
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <h3 className="text-gray-900 font-bold mb-2 text-sm sm:text-base">{f.title}</h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </SectionWrapper>

      {/* Browse Marketplace */}
      <div id="marketplace" className="scroll-mt-20" />
      <SectionWrapper>
        <div className="relative rounded-2xl sm:rounded-3xl border border-gray-200 bg-gradient-to-br from-amber-500/10 to-violet-500/10 backdrop-blur-md p-8 sm:p-10 lg:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <div className="relative z-10">
            <Store className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Browse the ZEETOP Marketplace
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-8 text-sm sm:text-base">
              Discover shops, find products, and place orders from businesses across the platform.
            </p>
            <Link
              to="/market"
              className="inline-flex px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-violet-500 text-white hover:from-amber-400 hover:to-violet-400 transition-all shadow-lg shadow-amber-500/25 text-sm"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper>
        <div className="relative rounded-2xl sm:rounded-3xl border border-gray-200 bg-gradient-to-br from-violet-500/10 to-amber-500/10 backdrop-blur-md p-8 sm:p-10 lg:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Your business is growing. Your system should grow too.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-8 text-sm sm:text-base">
              Join business owners who replaced notebooks and spreadsheets with ZEETOP.
            </p>
            <SignUpButton
              className="inline-flex px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-amber-500 text-white hover:from-violet-400 hover:to-amber-400 transition-all shadow-lg shadow-violet-500/25 text-sm"
            >
              Get Started — It's Free
            </SignUpButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Bottom nav spacer for mobile */}
      <div className="h-20 sm:hidden" />
      <LandingBottomNav />
    </>
  );
}
