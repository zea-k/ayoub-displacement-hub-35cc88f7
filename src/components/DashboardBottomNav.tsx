import { LayoutDashboard, ArrowUpFromLine, Receipt, ShoppingBag, GripVertical, Package, ArrowDownToLine, CalendarDays } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Floating dock-style navigation (Apple liquid-glass).
 * - High-contrast readable labels & icons
 * - Animated active pill indicator
 * - On desktop (md+) the dock is draggable; position persists in localStorage
 */
const STORAGE_KEY = "zeetop.dock.pos";

export function DashboardBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const items = [
    { title: t("sidebar.dashboard"), url: "/dashboard", icon: LayoutDashboard, end: false },
    { title: t("sidebar.products"), url: "/products", icon: Package },
    { title: t("sidebar.stockIn"), url: "/stock-in", icon: ArrowDownToLine },
    { title: t("sidebar.sales"), url: "/sales", icon: ArrowUpFromLine },
    { title: t("sidebar.expenses"), url: "/expenses", icon: Receipt },
    { title: t("sidebar.dailyReports"), url: "/daily-reports", icon: CalendarDays },
  ];

  const [isDesktop, setIsDesktop] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Restore desktop position
  useEffect(() => {
    if (!isDesktop) {
      x.set(0);
      y.set(0);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { x: sx, y: sy } = JSON.parse(saved);
        x.set(sx ?? 0);
        y.set(sy ?? 0);
      }
    } catch {}
  }, [isDesktop, x, y]);

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
    } catch {}
  };

  return (
    <motion.div
      ref={dockRef}
      drag={isDesktop}
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={{
        left: -window.innerWidth / 2 + 200,
        right: window.innerWidth / 2 - 200,
        top: -window.innerHeight + 120,
        bottom: 0,
      }}
      onDragEnd={persist}
      style={isDesktop ? { x, y } : undefined}
      className={
        isDesktop
          ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 select-none"
          : "fixed bottom-0 left-0 right-0 z-50 select-none flex justify-center px-2 pb-[env(safe-area-inset-bottom)]"
      }
    >
      <nav
        className={
          isDesktop
            ? "relative flex items-center gap-1 rounded-full border border-border/60 bg-background/85 px-2 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
            : "relative flex w-full items-center justify-between gap-0.5 rounded-2xl border border-border/40 bg-gradient-to-b from-background/95 via-background/90 to-background/85 px-1.5 py-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
        }
      >
        {isDesktop && (
          <div
            className="hidden md:flex items-center justify-center pl-1 pr-1 cursor-grab active:cursor-grabbing text-muted-foreground/70 hover:text-foreground transition-colors"
            title="Drag to move"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <ul className={isDesktop ? "flex items-center gap-1" : "flex w-full items-center justify-between gap-0"}>
          {items.map((item, index) => {
            const isActive = item.end
              ? location.pathname === item.url
              : location.pathname.startsWith(item.url);
            return (
              <motion.li
                key={item.url}
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <NavLink
                  to={item.url}
                  end={item.end}
                  className={`group relative flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-300 active:scale-95 ${
                    isDesktop ? "px-3 py-2.5 min-w-[60px] gap-1" : "flex-1 min-w-0 px-1 py-1.5"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="dock-active-pill"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/90 via-accent/80 to-primary/70 shadow-xl shadow-primary/30 border border-primary/20"
                    />
                  )}
                  <motion.span
                    className={`relative z-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                      isDesktop ? "h-7 w-7" : "h-6 w-6"
                    } ${
                      isActive
                        ? "bg-white/20 shadow-lg"
                        : "bg-gradient-to-br from-primary/10 to-accent/5 group-hover:from-primary/20 group-hover:to-accent/10"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className={`${isDesktop ? "h-4 w-4" : "h-3.5 w-3.5"} transition-all duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-primary group-hover:text-primary/80"
                    }`} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.span>
                  <span
                    className={`relative z-10 font-semibold leading-tight text-center truncate w-full transition-all duration-200 ${
                      isDesktop ? "text-[10px]" : "text-[9px]"
                    } ${
                      isActive
                        ? "text-white"
                        : "text-foreground/80 group-hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </span>
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>
    </motion.div>
  );
}
