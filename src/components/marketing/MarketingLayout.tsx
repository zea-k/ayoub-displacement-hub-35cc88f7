import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";
import LandingBottomNav from "./LandingBottomNav";

export default function MarketingLayout() {
  const { pathname } = useLocation();

  // Always start each marketing page at the top — prevents the "page jumps
  // around" feeling when navigating between landing routes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNavbar />
      <main className="relative pt-16 lg:pt-20">
        <Outlet />
      </main>
      {pathname === "/welcome" && <MarketingFooter />}
      {/* Bottom nav spacer for mobile */}
      <div className="h-20" />
      <LandingBottomNav />
    </div>
  );
}
