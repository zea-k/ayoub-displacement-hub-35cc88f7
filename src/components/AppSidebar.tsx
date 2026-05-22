import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Receipt, Globe, ShoppingBag, Settings, LogOut, BarChart3, CalendarDays, CreditCard, Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import zeetopLogo from "@/assets/zeetop-logo.png";

export function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useTranslation();

  const mainNav = [
    { title: t("sidebar.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("sidebar.products"), url: "/products", icon: Package },
    { title: t("sidebar.stockIn"), url: "/stock-in", icon: ArrowDownToLine },
    { title: t("sidebar.sales"), url: "/sales", icon: ArrowUpFromLine },
    { title: t("sidebar.expenses"), url: "/expenses", icon: Receipt },
  ];

  const analyticsNav = [
    { title: t("sidebar.dailyReports"), url: "/daily-reports", icon: CalendarDays },
  ];

  const storeNav = [
    { title: t("sidebar.storeSettings"), url: "/store-settings", icon: Settings },
    { title: t("sidebar.publicOrders"), url: "/public-orders", icon: ShoppingBag },
  ];

  const accountNav = [
    { title: t("sidebar.subscription"), url: "/subscription", icon: CreditCard },
  ];

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/welcome");
  };

  return (
    <Sidebar className="border-r border-border/40 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-xl">
      <SidebarContent className="relative overflow-y-auto">
        {/* Enhanced Background Pattern */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-3 select-none overflow-hidden">
          <div className="absolute -left-8 top-12 text-5xl md:text-7xl font-black tracking-tighter text-primary/20 whitespace-nowrap transform -rotate-12">
            ZEETOP
          </div>
          <div className="absolute right-2 top-1/4 text-4xl md:text-6xl font-black tracking-tighter text-accent/15 whitespace-nowrap transform rotate-12">
            ZEETOP
          </div>
          <div className="absolute left-1/3 -bottom-8 text-5xl md:text-7xl font-black tracking-tighter text-primary/10 whitespace-nowrap transform -rotate-6">
            ZEETOP
          </div>
        </div>

        {/* Logo Section with Glass Effect */}
        <div className="relative z-10 flex justify-center items-center pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-xl" />
            <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 p-4 backdrop-blur-xl shadow-xl">
              <img src={zeetopLogo} alt="ZEETOP" className="h-32 w-auto block" />
            </div>
          </motion.div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="relative z-10 px-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNav.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={closeSidebar}
                        className="group relative flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/10 hover:via-accent/5 hover:to-transparent hover:border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-95"
                        activeClassName="bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/30 text-primary font-semibold shadow-lg shadow-primary/20 rounded-2xl"
                      >
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 group-hover:from-primary/20 group-hover:to-accent/10 transition-all duration-200">
                          <item.icon className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                        </div>
                        <span className="flex-1 text-sm">{item.title}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary/70 transition-all duration-200 group-hover:translate-x-0.5" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Store Section */}
        <SidebarGroup className="relative z-10 px-3 mt-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>{t("sidebar.publicStore")}</span>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {storeNav.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={closeSidebar}
                        className="group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/5 hover:border hover:border-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:scale-95"
                        activeClassName="bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-emerald-600 font-semibold shadow-md shadow-emerald-500/20 rounded-xl"
                      >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5 group-hover:from-emerald-500/20 group-hover:to-teal-500/10 transition-all duration-200">
                          <item.icon className="h-3.5 w-3.5 text-emerald-600 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <span className="flex-1 text-sm">{item.title}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-emerald-500/70 transition-all duration-200 group-hover:translate-x-0.5" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        <SidebarGroup className="relative z-10 px-3 mt-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl border border-amber-500/10">
              <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
              <span>{t("sidebar.reports")}</span>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {analyticsNav.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={closeSidebar}
                        className="group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/5 hover:border hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5 active:scale-95"
                        activeClassName="bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-amber-600 font-semibold shadow-md shadow-amber-500/20 rounded-xl"
                      >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/5 group-hover:from-amber-500/20 group-hover:to-orange-500/10 transition-all duration-200">
                          <item.icon className="h-3.5 w-3.5 text-amber-600 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <span className="flex-1 text-sm">{item.title}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-amber-500/70 transition-all duration-200 group-hover:translate-x-0.5" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Section */}
        <SidebarGroup className="relative z-10 px-3 mt-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-xl border border-violet-500/10">
              <CreditCard className="h-3.5 w-3.5 text-violet-600" />
              <span>{t("sidebar.account")}</span>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {accountNav.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={closeSidebar}
                        className="group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-purple-500/5 hover:border hover:border-violet-500/20 hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-0.5 active:scale-95"
                        activeClassName="bg-gradient-to-r from-violet-500/15 to-purple-500/10 border border-violet-500/30 text-violet-600 font-semibold shadow-md shadow-violet-500/20 rounded-xl"
                      >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/5 group-hover:from-violet-500/20 group-hover:to-purple-500/10 transition-all duration-200">
                          <item.icon className="h-3.5 w-3.5 text-violet-600 group-hover:text-violet-500 transition-colors" />
                        </div>
                        <span className="flex-1 text-sm">{item.title}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-violet-500/70 transition-all duration-200 group-hover:translate-x-0.5" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 relative z-10 border-t border-border/40 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:border hover:border-destructive/20 hover:text-destructive transition-all duration-300 hover:shadow-md hover:shadow-destructive/10"
            onClick={handleSignOut}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5">
              <LogOut className="h-3.5 w-3.5 text-destructive" />
            </div>
            <span>{t("nav.signOut")}</span>
          </Button>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}
