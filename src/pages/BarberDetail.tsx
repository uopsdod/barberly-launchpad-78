import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { formatMoney, photoUrl } from "@/lib/format";
import { CustomerHeader } from "@/components/CustomerHeader";
import { BookingDialog } from "@/components/BookingDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Tables } from "@/integrations/supabase/types";
import { MapPin, ArrowLeft, Clock } from "lucide-react";

type Barber = Tables<"barbers">;
type Service = Tables<"services">;
type Photo = Tables<"barber_photos">;

const CATEGORY_LABELS: Record<string, string> = { cut: "Cut", color: "Color", perm: "Perm", beard: "Beard" };

export default function BarberDetail() {
  const { id } = useParams<{ id: string }>();
  const settings = usePlatformSettings();
  const slotMinutes = settings?.slot_minutes ?? 30;
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [b, s, p] = await Promise.all([
        supabase.from("barbers").select("*").eq("id", id).maybeSingle(),
        supabase.from("services").select("*").eq("barber_id", id).order("created_at", { ascending: true }),
        supabase.from("barber_photos").select("*").eq("barber_id", id).order("sort_order", { ascending: true }),
      ]);
      if (!active) return;
      setBarber(b.data ?? null);
      setServices(s.data ?? []);
      setPhotos(p.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <div className="mx-auto max-w-4xl px-5 py-16">
          <div className="h-80 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <p className="text-muted-foreground">This barber could not be found.</p>
          <Link to="/barbers" className="mt-4 inline-block text-primary underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-4xl px-5 sm:px-8 py-10 animate-fade-up">
        <Link
          to="/barbers"
          className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        {photos.length > 0 ? (
          <div className="mt-5 px-10">
            <Carousel className="w-full">
              <CarouselContent>
                {photos.map((ph) => (
                  <CarouselItem key={ph.id} className="basis-full sm:basis-1/2">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                      <img
                        src={photoUrl(ph.storage_path)}
                        alt={ph.caption ?? barber.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {ph.caption && <p className="mt-2 text-sm text-muted-foreground">{ph.caption}</p>}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : (
          <div className="mt-5 aspect-[16/6] rounded-2xl bg-muted flex items-center justify-center font-display text-5xl text-muted-foreground">
            {barber.name.charAt(0)}
          </div>
        )}

        <div className="mt-8">
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">{barber.name}</h1>
          {barber.address && (
            <p className="mt-2 text-muted-foreground inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {barber.address}
            </p>
          )}
          {barber.intro && <p className="mt-4 text-foreground/80 leading-relaxed max-w-2xl">{barber.intro}</p>}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">Services</h2>
          {services.length === 0 ? (
            <p className="mt-3 text-muted-foreground">This barber hasn't listed any services yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border/60 rounded-2xl border border-border/60 overflow-hidden">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{svc.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground/70">
                        {CATEGORY_LABELS[svc.category] ?? svc.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {svc.required_slots * slotMinutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">{formatMoney(svc.price, settings)}</div>
                    <button
                      onClick={() => setBookingService(svc)}
                      className="mt-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {bookingService && (
        <BookingDialog
          open={!!bookingService}
          onOpenChange={(o) => {
            if (!o) setBookingService(null);
          }}
          service={bookingService}
          barberId={barber.id}
          barberName={barber.name}
          settings={settings}
          slotMinutes={slotMinutes}
        />
      )}
    </div>
  );
}
