import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/barbers")({
  component: BarbersShell,
});

function BarbersShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const role = (user.user_metadata?.role as string | undefined) ?? "buyer";
  const isShop = role === "shop";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center gap-3">
          <Link to="/" className="font-display text-2xl font-semibold text-foreground">
            Barberly
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Hi {user.email}
            </span>
            {isShop && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                barber
              </span>
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
          {isShop
            ? "Your barber dashboard is coming soon"
            : "Barbers near you are coming soon"}
        </h1>
        <p className="mt-5 text-muted-foreground text-base sm:text-lg">
          {isShop
            ? "Profile, services & schedule arrive in the next milestone."
            : "Browse & booking arrive in the next milestone."}
        </p>
      </main>
    </div>
  );
}
