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
function computeValidStartIndexes(free: Slot[], n: number): Set<number> {
  const valid = new Set<number>();
  for (let i = 0; i + n <= free.length; i++) {
    let ok = true;
    for (let k = 1; k < n; k++) {
      if (new Date(free[i + k].starts_at).getTime() !== new Date(free[i + k - 1].ends_at).getTime()) {
        ok = false;
        break;
      }
    }
    if (ok) valid.add(i);
  }
  return valid;
}

export function BookingDialog({ open, onOpenChange, service, barberId, barberName, settings, slotMinutes }: Props) {
  const navigate = useNavigate();
  const n = service.required_slots;
  const [loading, setLoading] = useState(true);
  const [free, setFree] = useState<Slot[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      setSelectedIdx(null);
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

      if (!active) return;
      setFree(allSlots.filter((s) => !heldSet.has(s.id)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, barberId]);

  const validStartIdxs = useMemo(() => computeValidStartIndexes(free, n), [free, n]);

  // the set of slot indexes consumed by the currently selected start
  const spanIdxs = useMemo(() => {
    if (selectedIdx === null) return new Set<number>();
    const s = new Set<number>();
    for (let k = 0; k < n; k++) s.add(selectedIdx + k);
    return s;
  }, [selectedIdx, n]);

  const hasStarts = validStartIdxs.size > 0;

  // group slot indexes by calendar day (only days that contain a valid start)
  const grouped = useMemo(() => {
    const map = new Map<string, number[]>();
    free.forEach((slot, i) => {
      const key = format(new Date(slot.starts_at), "EEE, MMM d");
      const arr = map.get(key) ?? [];
      arr.push(i);
      map.set(key, arr);
    });
    return Array.from(map.entries()).filter(([, idxs]) => idxs.some((i) => validStartIdxs.has(i)));
  }, [free, validStartIdxs]);

  const summary = useMemo(() => {
    if (selectedIdx === null) return null;
    const start = free[selectedIdx];
    const end = free[selectedIdx + n - 1];
    if (!start || !end) return null;
    return {
      day: format(new Date(start.starts_at), "EEE, MMM d"),
      range: `${format(new Date(start.starts_at), "HH:mm")}–${format(new Date(end.ends_at), "HH:mm")}`,
    };
  }, [selectedIdx, free, n]);

  async function confirm() {
    if (selectedIdx === null) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("create_booking", {
        p_service_id: service.id,
        p_start_slot_id: free[selectedIdx].id,
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

  const durationMin = n * slotMinutes;

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

        {n > 1 && (
          <p className="text-sm text-muted-foreground -mt-1">
            Pick a start time — this books <span className="font-medium text-foreground">{n}</span> back-to-back{" "}
            {slotMinutes}-min slots.
          </p>
        )}

        <div className="max-h-[42vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : !hasStarts ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No open time slots for this service right now. Please check back later.
            </p>
          ) : (
            <div className="space-y-5 py-1">
              {grouped.map(([day, idxs]) => (
                <div key={day}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{day}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {idxs.map((i) => {
                      const slot = free[i];
                      const isStart = validStartIdxs.has(i);
                      const inSpan = spanIdxs.has(i);
                      const isSelectedStart = i === selectedIdx;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => isStart && setSelectedIdx(i)}
                          disabled={!isStart}
                          aria-pressed={inSpan}
                          className={`h-9 px-3 rounded-full text-sm font-medium border transition ${
                            inSpan
                              ? "bg-primary text-primary-foreground border-primary"
                              : isStart
                                ? "border-border hover:bg-muted text-foreground"
                                : "border-transparent text-muted-foreground/40 cursor-not-allowed"
                          } ${isSelectedStart ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
                        >
                          {format(new Date(slot.starts_at), "HH:mm")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {summary && (
          <p className="text-sm text-foreground">
            Your appointment: <span className="font-medium">{summary.day} · {summary.range}</span>
          </p>
        )}

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={selectedIdx === null || submitting}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
