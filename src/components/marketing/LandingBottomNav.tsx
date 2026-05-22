import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Store, User } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const navItems = [
  { id: "home", labelKey: "market.navHome", icon: Home, to: "/welcome" },
  { id: "discover", labelKey: "market.navDiscover", icon: Compass, to: "/market/discover" },
  { id: "shops", labelKey: "market.navShops", icon: Store, to: "/market" },
  { id: "account", labelKey: "market.navAccount", icon: User, to: "/account" },
];

/**
 * Mirrors MarketShell's bottom nav exactly so the bar feels identical
 * across landing and marketplace — no shifting style, no scroll-spy jitter.
 */
export default function LandingBottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const active =
    navItems.find((i) => i.to === pathname)?.id ??
    (pathname.startsWith("/market/discover")
      ? "discover"
      : pathname.startsWith("/market")
        ? "shops"
        : pathname.startsWith("/account")
          ? "account"
          : "home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
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
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
