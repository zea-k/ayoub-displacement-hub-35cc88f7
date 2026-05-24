import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";
import LandingBottomNav from "./LandingBottomNav";
import { PremiumFrame } from "@/components/ui/premium-frame";

export default function MarketingLayout() {
  const { pathname } = useLocation();

  // Always start each marketing page at the top — prevents the "page jumps
  // around" feeling when navigating between landing routes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  // Home page renders its own full-bleed frame (pinned hero), so skip wrapping.
  const isHome = pathname === "/welcome" || pathname === "/";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />
      <main className="relative pt-16 lg:pt-20">
        {isHome ? (
          <Outlet />
        ) : (
          <div className="p-2 sm:p-3 lg:p-4">
            <PremiumFrame innerClassName="bg-white text-gray-900 min-h-[calc(100vh-8rem)]">
              <Outlet />
            </PremiumFrame>
          </div>
        )}
      </main>
      {pathname === "/welcome" && <MarketingFooter />}
      {/* Bottom nav spacer for mobile */}
      <div className="h-20" />
      <LandingBottomNav />
    </div>
  );
}
