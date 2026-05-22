import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";

/**
 * Public visitors → /welcome
 * Logged-in users → render dashboard at "/"
 */
export default function RootRedirect() {
  const { user, loading, userProfile } = useAuth();

  // Wait for both auth AND profile so we never flash the dashboard
  // to a buyer before redirecting them to /market.
  if (loading || (user && !userProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/welcome" replace />;

  // Buyers go to the marketplace, not the business dashboard
  if (userProfile?.user_type === "buyer") {
    return <Navigate to="/market" replace />;
  }

  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
