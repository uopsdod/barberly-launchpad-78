import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { formatMoney } from "@/lib/format";
import { errMessage } from "@/lib/errors";
import { CustomerHeader } from "@/components/CustomerHeader";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";

type BookingRow = Tables<"bookings_with_start">;
type Service = Tables<"services">;
type Barber = Tables<"barbers">;

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Reserved", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export default function MyBookings() {
  const { user } = useAuth();
  const settings = usePlatformSettings();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [barbers, setBarbers] = useState<Record<string, Barber>>({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: bookings } = await supabase
      .from("bookings_with_start")
      .select("*")
      .eq("customer_id", user.id)
      .order("starts_at", { ascending: true });
    const list = bookings ?? [];

    const serviceIds = Array.from(new Set(list.map((b) => b.service_id).filter(Boolean))) as string[];
    let svcMap: Record<string, Service> = {};
    let barberMap: Record<string, Barber> = {};
    if (serviceIds.length > 0) {
      const { data: svc } = await supabase.from("services").select("*").in("id", serviceIds);
      svcMap = Object.fromEntries((svc ?? []).map((s) => [s.id, s]));
      const barberIds = Array.from(new Set((svc ?? []).map((s) => s.barber_id)));
      if (barberIds.length > 0) {
        const { data: brb } = await supabase.from("barbers").select("*").in("id", barberIds);
        barberMap = Object.fromEntries((brb ?? []).map((b) => [b.id, b]));
      }
    }

    setRows(list);
    setServices(svcMap);
    setBarbers(barberMap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelBooking(id: string) {
    setCancelling(id);
    try {
      // The trg_free_slots_on_cancel trigger releases the held slots automatically.
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      toast.success("Booking cancelled — the time slot is free again.");
      await load();
    } catch (err) {
      toast.error(errMessage(err, "Could not cancel this booking"));
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10 animate-fade-up">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">Your appointments</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-foreground">My bookings</h1>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-16 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">You have no bookings yet.</p>
            <Link
              to="/barbers"
              className="mt-5 inline-flex items-center h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Find a barber
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {rows.map((b) => {
              const svc = b.service_id ? services[b.service_id] : undefined;
              const barber = svc ? barbers[svc.barber_id] : undefined;
              const meta = STATUS_META[b.status ?? ""] ?? { label: b.status ?? "", className: "bg-muted text-muted-foreground" };
              const canCancel = b.status !== "cancelled";
              return (
                <div key={b.id ?? Math.random()} className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl text-foreground truncate">
                        {svc?.name ?? "Service"}
                        {barber ? <span className="text-muted-foreground text-base"> · {barber.name}</span> : null}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {b.starts_at ? format(new Date(b.starts_at), "EEE, MMM d · HH:mm") : "Time to be confirmed"}
                        {b.starts_at && b.ends_at ? ` – ${format(new Date(b.ends_at), "HH:mm")}` : ""}
                      </p>
                      {typeof b.price === "number" && (
                        <p className="mt-1 text-sm text-foreground font-medium">{formatMoney(b.price, settings)}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  {canCancel && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => b.id && cancelBooking(b.id)}
                        disabled={cancelling === b.id}
                        className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-60"
                      >
                        {cancelling === b.id ? "Cancelling…" : "Cancel booking"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
