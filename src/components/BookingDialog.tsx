import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, type PlatformSettings } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock } from "lucide-react";

type Service = Tables<"services">;
type Slot = Tables<"bookable_slots">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  barberId: string;
  barberName: string;
  settings: PlatformSettings | null;
  slotMinutes: number;
};

// A start slot is valid only if the service's required_slots FREE slots are
// available back-to-back from it (each next slot begins exactly when the
// previous ends). This mirrors create_booking's server-side check so we only
// ever offer start times that will actually book.
function computeValidStarts(free: Slot[], n: number): Slot[] {
  const res: Slot[] = [];
  for (let i = 0; i + n <= free.length; i++) {
    let ok = true;
    for (let k = 1; k < n; k++) {
      const prev = free[i + k - 1];
      const cur = free[i + k];
      if (new Date(cur.starts_at).getTime() !== new Date(prev.ends_at).getTime()) {
        ok = false;
        break;
      }
    }
    if (ok) res.push(free[i]);
  }
  return res;
}

export function BookingDialog({ open, onOpenChange, service, barberId, barberName, settings, slotMinutes }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [validStarts, setValidStarts] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      setSelected(null);
      const nowIso = new Date().toISOString();
      const { data: slots } = await supabase
        .from("bookable_slots")
        .select("*")
        .eq("barber_id", barberId)
        .gt("starts_at", nowIso)
        .order("starts_at", { ascending: true });
      const allSlots = slots ?? [];

      let heldSet = new Set<string>();
      if (allSlots.length > 0) {
        const { data: held } = await supabase
          .from("booking_slots")
          .select("slot_id")
          .in(
            "slot_id",
            allSlots.map((s) => s.id),
          );
        heldSet = new Set((held ?? []).map((h) => h.slot_id));
      }

      const free = allSlots.filter((s) => !heldSet.has(s.id));
      if (!active) return;
      setValidStarts(computeValidStarts(free, service.required_slots));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, barberId, service.required_slots]);

  // group valid starts by calendar day
  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of validStarts) {
      const key = format(new Date(s.starts_at), "EEE, MMM d");
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [validStarts]);

  async function confirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("create_booking", {
        p_service_id: service.id,
        p_start_slot_id: selected,
      });
      if (error) throw error;
      toast.success("Booked! You'll find it under My bookings.");
      onOpenChange(false);
      navigate("/my-bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete the booking");
    } finally {
      setSubmitting(false);
    }
  }

  const durationMin = service.required_slots * slotMinutes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Book {service.name}</DialogTitle>
          <DialogDescription>
            with {barberName} · {formatMoney(service.price, settings)} ·{" "}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {durationMin} min
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No open time slots for this service right now. Please check back later.
            </p>
          ) : (
            <div className="space-y-5 py-1">
              {grouped.map(([day, slots]) => (
                <div key={day}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{day}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s.id)}
                        className={`h-9 px-3 rounded-full text-sm font-medium border transition ${
                          selected === s.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted text-foreground"
                        }`}
                      >
                        {format(new Date(s.starts_at), "HH:mm")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!selected || submitting}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
