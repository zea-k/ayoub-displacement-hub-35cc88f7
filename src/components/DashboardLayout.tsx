import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import PageTransition from "@/components/PageTransition";
import ParallaxBrand from "@/components/ParallaxBrand";
import { DashboardBottomNav } from "@/components/DashboardBottomNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <ParallaxBrand variant="light" />
        <AppSidebar />
        <main className="flex-1 overflow-auto relative z-10">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
            </div>
          </header>
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            <PageTransition>
              {children ?? <Outlet />}
            </PageTransition>
          </div>
        </main>
        <DashboardBottomNav />
      </div>
    </SidebarProvider>
  );
}
