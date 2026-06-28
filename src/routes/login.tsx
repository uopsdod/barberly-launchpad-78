import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup";
type Role = "buyer" | "shop";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/barbers", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/barbers`,
            data: { role },
          },
        });
        if (error) throw error;
        toast.success("Account created — signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/barbers", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center">
          <Link to="/" className="font-display text-2xl font-semibold text-foreground">
            Barberly
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 bg-cream/40">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-sm animate-fade-up">
          <h1 className="font-display text-3xl text-foreground text-center">
            {mode === "signin" ? "Welcome back" : "Join Barberly"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {mode === "signin" ? "Sign in to continue" : "Create your account in seconds"}
          </p>

          <div className="mt-6 flex bg-muted rounded-full p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 h-9 rounded-full transition ${mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 h-9 rounded-full transition ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  I'm a
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 p-1 bg-muted rounded-full text-sm">
                  <button
                    type="button"
                    onClick={() => setRole("buyer")}
                    className={`h-10 rounded-full transition ${role === "buyer" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("shop")}
                    className={`h-10 rounded-full transition ${role === "shop" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                  >
                    Barber
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
