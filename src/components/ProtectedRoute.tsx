import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireSubscription = false 
}: ProtectedRouteProps) {
  const { user, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace />;

  // For dashboard and business features, require subscription for business users
  const isDashboardRoute = location.pathname.startsWith("/dashboard") || 
                          location.pathname.startsWith("/products") ||
                          location.pathname.startsWith("/stock-in") ||
                          location.pathname.startsWith("/sales") ||
                          location.pathname.startsWith("/expenses") ||
                          location.pathname.startsWith("/store-settings") ||
                          location.pathname.startsWith("/public-orders") ||
                          location.pathname.startsWith("/instagram") ||
                          location.pathname.startsWith("/product-stories") ||
                          location.pathname.startsWith("/analytics") ||
                          location.pathname.startsWith("/activity-log") ||
                          location.pathname.startsWith("/daily-reports");

  // Business users whose trial expired or have no active subscription must subscribe.
  // Allow /subscription itself so they can manage / pay.
  const isSubscriptionPage = location.pathname.startsWith("/subscription");
  if (isDashboardRoute &&
      !isSubscriptionPage &&
      userProfile?.user_type === "business" &&
      userProfile?.subscription_status === "inactive") {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
