import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

// Shared header for the shop surfaces (/shop and /shop/bookings).
export function ShopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `h-9 px-4 rounded-full text-sm font-medium inline-flex items-center transition ${
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
    }`;

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 h-16 flex items-center gap-2">
        <Link to="/" className="font-display text-2xl font-semibold text-foreground mr-2">
          Barberly
        </Link>
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          barber
        </span>
        <nav className="ml-auto flex items-center gap-1.5">
          <NavLink to="/shop" end className={linkClass}>
            Onboarding
          </NavLink>
          <NavLink to="/shop/bookings" className={linkClass}>
            Services &amp; schedule
          </NavLink>
          <button
            onClick={signOut}
            className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition"
          >
            Sign out
          </button>
        </nav>
      </div>
      <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-2 text-xs text-muted-foreground">
        {user?.email}
      </div>
    </header>
  );
}
