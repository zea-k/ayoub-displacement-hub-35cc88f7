import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import RootRedirect from "@/components/RootRedirect";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import StockInPage from "./pages/StockInPage";
import SalesPage from "./pages/SalesPage";
import ExpensesPage from "./pages/ExpensesPage";
import StoreSettingsPage from "./pages/StoreSettingsPage";
import PublicOrdersPage from "./pages/PublicOrdersPage";
import PublicStorePage from "./pages/PublicStorePage";
import MarketplacePage from "./pages/MarketplacePage";
import MarketplaceShopPage from "./pages/MarketplaceShopPage";
import MarketDiscoverPage from "./pages/MarketDiscoverPage";
import MarketSearchPage from "./pages/MarketSearchPage";
import AccountPage from "./pages/AccountPage";
import InstagramGeneratorPage from "./pages/InstagramGeneratorPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import ProductStoriesPage from "./pages/ProductStoriesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";
import MarketingLayout from "./components/marketing/MarketingLayout";
import MarketingHomePage from "./pages/marketing/MarketingHomePage";
import MarketingFeaturesPage from "./pages/marketing/MarketingFeaturesPage";
import MarketingHowItWorksPage from "./pages/marketing/MarketingHowItWorksPage";
import MarketingPricingPage from "./pages/marketing/MarketingPricingPage";
import MarketingContactPage from "./pages/marketing/MarketingContactPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import MarketplaceAssistant from "@/components/marketplace/MarketplaceAssistant";
import GlobalSplash from "@/components/GlobalSplash";
import MarketMapPage from "./pages/MarketMapPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AuthModalProvider>
            <GlobalSplash />
            <MarketplaceAssistant />
            <Routes>
              {/* Root: smart redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Legacy /login & /register → modal-based, redirect to landing */}
              <Route path="/login" element={<Navigate to="/welcome" replace />} />
              <Route path="/register" element={<Navigate to="/welcome" replace />} />

              {/* Subscription/Pricing for logged in users */}
              <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />

              {/* Marketing pages */}
              <Route element={<MarketingLayout />}>
                <Route path="/welcome" element={<MarketingHomePage />} />
                <Route path="/features" element={<MarketingFeaturesPage />} />
                <Route path="/how-it-works" element={<MarketingHowItWorksPage />} />
                <Route path="/plans" element={<MarketingPricingPage />} />
                <Route path="/contact" element={<MarketingContactPage />} />
              </Route>

              {/* Marketplace — uses MarketShell internally for unified chrome */}
              <Route path="/market" element={<MarketplacePage />} />
              <Route path="/market/discover" element={<MarketDiscoverPage />} />
              <Route path="/market/search" element={<MarketSearchPage />} />
              <Route path="/market/map" element={<MarketMapPage />} />
              <Route path="/market/shop/:slug" element={<MarketplaceShopPage />} />
              <Route path="/account" element={<AccountPage />} />

              {/* Legacy public store */}
              <Route path="/store/:slug" element={<PublicStorePage />} />

              {/* Dashboard — single layout instance enables Apple-style page transitions */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/stock-in" element={<StockInPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/store-settings" element={<StoreSettingsPage />} />
                <Route path="/public-orders" element={<PublicOrdersPage />} />
                <Route path="/instagram" element={<InstagramGeneratorPage />} />
                <Route path="/product-stories" element={<ProductStoriesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/activity-log" element={<ActivityLogPage />} />
                <Route path="/daily-reports" element={<DailyReportsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
