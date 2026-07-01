import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

// Shared header for the customer surfaces (/barbers, /barbers/:id, /my-bookings).
// Role-aware: a shop sees a link back to their dashboard; a customer sees a
// "Become a shop" action (flips their OWN profiles.role to 'shop' via RLS).
export function CustomerHeader() {
  const { user } = useAuth();
  const { isShop, loading, refresh } = useProfile();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  async function becomeShop() {
    if (!user) return;
    setUpgrading(true);
    try {
      const { error } = await supabase.from("profiles").update({ role: "shop" }).eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("You're a shop now — let's set up your barbers.");
      navigate("/shop", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upgrade to a shop");
    } finally {
      setUpgrading(false);
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `h-9 px-4 rounded-full text-sm font-medium inline-flex items-center transition ${
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
    }`;

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center gap-2">
        <Link to="/" className="font-display text-2xl font-semibold text-foreground mr-2">
          Barberly
        </Link>
        <nav className="ml-auto flex items-center gap-1.5">
          <NavLink to="/barbers" end className={linkClass}>
            Discover
          </NavLink>
          <NavLink to="/my-bookings" className={linkClass}>
            My bookings
          </NavLink>
          {isShop ? (
            <Link
              to="/shop"
              className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition inline-flex items-center"
            >
              Shop dashboard
            </Link>
          ) : (
            <button
              onClick={becomeShop}
              disabled={upgrading || loading}
              className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-60"
            >
              {upgrading ? "Setting up…" : "Become a shop"}
            </button>
          )}
          <button
            onClick={signOut}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
