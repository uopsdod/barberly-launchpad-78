import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export default function Barbers() {
  const { user } = useAuth();
  const { isShop, loading, refresh } = useProfile();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  // "Become a shop": flip the current user's OWN profiles.role to 'shop'
  // (RLS profiles_update_own allows this). Never writes 'admin'.
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center gap-3">
          <Link to="/" className="font-display text-2xl font-semibold text-foreground">
            Barberly
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">Hi {user?.email}</span>
            {isShop && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                barber
              </span>
            )}
            {isShop && (
              <Link
                to="/shop"
                className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition inline-flex items-center"
              >
                Shop dashboard
              </Link>
            )}
            <button
              onClick={signOut}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-24 text-center animate-fade-up">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
          {isShop ? "Barber dashboard" : "Discover"}
        </p>
        <h1 className="mt-4 font-display text-3xl sm:text-5xl text-foreground leading-tight">
          {isShop ? "Manage your shop" : "Barbers near you are coming soon"}
        </h1>
        <p className="mt-5 text-muted-foreground text-base sm:text-lg">
          {isShop
            ? "Set up your barbers, services, portfolio photos and bookable schedule."
            : "Browse & booking arrive in the next milestone."}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isShop ? (
            <>
              <Link
                to="/shop"
                className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition inline-flex items-center"
              >
                Shop onboarding
              </Link>
              <Link
                to="/shop/bookings"
                className="h-11 px-6 rounded-full border border-border font-medium hover:bg-muted transition inline-flex items-center"
              >
                Services & schedule
              </Link>
            </>
          ) : (
            <button
              onClick={becomeShop}
              disabled={upgrading || loading}
              className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {upgrading ? "Setting up…" : "Become a shop"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
