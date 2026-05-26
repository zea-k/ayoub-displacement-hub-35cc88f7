import { Link } from "react-router-dom";
import { Compass, Store, User, Home, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import zeetopLogo from "@/assets/zeetop-logo.png";
import { PremiumFrame } from "@/components/ui/premium-frame";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Button } from "@/components/ui/button";



type Tab = "home" | "discover" | "shops" | "map" | "account";

const navItemsBase: { id: Tab; icon: any; to: string; key: string }[] = [
  { id: "home", icon: Home, to: "/welcome", key: "market.navHome" },
  { id: "discover", icon: Compass, to: "/market/discover", key: "market.navDiscover" },
  { id: "shops", icon: Store, to: "/market", key: "market.navShops" },
  { id: "account", icon: User, to: "/account", key: "market.navAccount" },
];

interface MarketShellProps {
  active: Tab;
  children: React.ReactNode;
  /** Where to place the guest auth buttons in the header. Defaults to "right". */
  authButtonsAlign?: "left" | "right";
}

/**
 * Shared shell for marketplace-related pages.
 * Provides the header and the persistent mobile bottom nav.
 */
export default function MarketShell({ active, children, authButtonsAlign = "right" }: MarketShellProps) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  const authButtons = !loading && !user ? (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={openLogin}
        className="h-9 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-semibold border-gray-300 text-gray-900 hover:bg-gray-50"
      >
        Sign in
      </Button>
      <Button
        size="sm"
        onClick={openRegister}
        className="h-9 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-md hover:opacity-95"
      >
        Sign up
      </Button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-3 lg:p-4 pb-20">
      <PremiumFrame innerClassName="bg-white text-gray-900">
        {/* Soft Apple-style ambient wash */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-[120px] bg-primary" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-30 blur-[100px] bg-accent" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
              {authButtonsAlign === "left" && authButtons && (
                <div className="order-1">{authButtons}</div>
              )}
              <Link
                to="/welcome"
                className={`flex items-center gap-3 ${authButtonsAlign === "left" ? "order-2 mx-auto sm:mx-0" : "order-1"}`}
              >
                <img src={zeetopLogo} alt="ZEETOP" className="h-10 sm:h-12 w-auto" />
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-bold tracking-tight leading-tight text-gray-900">ZEETOP</span>
                  <span className="text-[10px] font-medium text-primary tracking-widest uppercase">Marketplace</span>
                </div>
              </Link>
              {authButtonsAlign === "right" && authButtons && (
                <div className="order-3 ml-auto">{authButtons}</div>
              )}
            </div>
          </div>
        </header>


        <main className="relative z-10">{children}</main>
      </PremiumFrame>

      {/* Bottom nav (used on all viewports) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItemsBase.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="relative flex flex-col items-center gap-0.5 flex-1 py-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="market-bottom-nav-indicator"
                    className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-primary to-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-gray-500"}`} />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}>
                  {t(item.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
