import { Navigate, Outlet } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

// Gates the shop surfaces (/shop, /shop/bookings) on profiles.role === 'shop'.
// RequireAuth already guarantees a signed-in user upstream; this adds the role check.
export function RequireShop() {
  const { isShop, loading } = useProfile();

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  // A signed-in non-shop user is sent to /barbers, where the "Become a shop"
  // entry point lives.
  if (!isShop) {
    return <Navigate to="/barbers" replace />;
  }

  return <Outlet />;
}
