import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { formatMoney, photoUrl } from "@/lib/format";
import { CustomerHeader } from "@/components/CustomerHeader";
import type { Tables } from "@/integrations/supabase/types";
import { MapPin } from "lucide-react";

type Barber = Tables<"barbers">;
type Service = Tables<"services">;
type Photo = Tables<"barber_photos">;

const CATEGORY_LABELS: Record<string, string> = { cut: "Cut", color: "Color", perm: "Perm", beard: "Beard" };

export default function Barbers() {
  const settings = usePlatformSettings();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [b, s, p] = await Promise.all([
        supabase.from("barbers").select("*").order("created_at", { ascending: true }),
        supabase.from("services").select("*"),
        supabase.from("barber_photos").select("*").order("sort_order", { ascending: true }),
      ]);
      if (!active) return;
      setBarbers(b.data ?? []);
      setServices(s.data ?? []);
      setPhotos(p.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(
    () =>
      barbers.map((barber) => {
        const svc = services.filter((s) => s.barber_id === barber.id);
        const cats = Array.from(new Set(svc.map((s) => s.category)));
        const minPrice = svc.length ? Math.min(...svc.map((s) => s.price)) : null;
        const pics = photos.filter((ph) => ph.barber_id === barber.id);
        const featured = pics.find((ph) => ph.is_featured) ?? pics[0] ?? null;
        return { barber, cats, minPrice, featured };
      }),
    [barbers, services, photos],
  );

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10 animate-fade-up">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Discover</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-foreground">Find your barber</h1>
        <p className="mt-2 text-muted-foreground">Browse barbers, view their work, and book a slot.</p>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">No barbers are listed yet. Check back soon.</div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(({ barber, cats, minPrice, featured }) => (
              <Link
                key={barber.id}
                to={`/barbers/${barber.id}`}
                className="group rounded-2xl border border-border/60 overflow-hidden bg-card hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {featured ? (
                    <img
                      src={photoUrl(featured.storage_path)}
                      alt={barber.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display text-4xl text-muted-foreground">
                      {barber.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl text-foreground">{barber.name}</h3>
                  {barber.address && (
                    <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {barber.address}
                    </p>
                  )}
                  {cats.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cats.map((c) => (
                        <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground/80">
                          {CATEGORY_LABELS[c] ?? c}
                        </span>
                      ))}
                    </div>
                  )}
                  {minPrice !== null && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      from <span className="text-foreground font-medium">{formatMoney(minPrice, settings)}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
