import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { ShopHeader } from "@/components/ShopHeader";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Barber = Tables<"barbers">;
type Service = Tables<"services">;
type Slot = Tables<"bookable_slots">;
type PlatformSettings = Tables<"platform_settings">;

const CATEGORIES = ["cut", "color", "perm", "beard"] as const;

export default function ShopBookings() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data: bs }, { data: ps }] = await Promise.all([
        supabase.from("barbers").select("*").eq("shop_id", user.id).order("created_at"),
        supabase.from("platform_settings").select("*").maybeSingle(),
      ]);
      setBarbers(bs ?? []);
      setSelected((prev) => prev || bs?.[0]?.id || "");
      setSettings(ps ?? null);
      setLoading(false);
    })();
  }, [user]);

  const slotMinutes = settings?.slot_minutes ?? 30;
  const currency = (settings?.currency ?? "twd").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      <main className="mx-auto max-w-5xl px-5 sm:px-8 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">Services &amp; schedule</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Edit each barber's service menu and publish bookable time slots (each slot is{" "}
            {slotMinutes} minutes).
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : barbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no barbers yet. Add one in{" "}
            <Link to="/shop" className="underline">
              shop onboarding
            </Link>{" "}
            first.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Barber</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="h-10 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <>
                <ServicesEditor barberId={selected} currency={currency} />
                <SlotsPublisher barberId={selected} slotMinutes={slotMinutes} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── A. Services & price editor ──
function ServicesEditor({ barberId, currency }: { barberId: string; currency: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("cut");
  const [price, setPrice] = useState("");
  const [requiredSlots, setRequiredSlots] = useState("1");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("barber_id", barberId)
      .order("created_at");
    if (error) toast.error(error.message);
    else setServices(data ?? []);
  }, [barberId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const priceInt = Number.parseInt(price, 10);
    const slotsInt = Number.parseInt(requiredSlots, 10);
    if (!name.trim()) return toast.error("Service name is required.");
    if (!Number.isFinite(priceInt) || priceInt < 0)
      return toast.error("Price must be a whole number ≥ 0 (no decimals — TWD is zero-decimal).");
    if (!Number.isFinite(slotsInt) || slotsInt < 1)
      return toast.error("Required slots must be at least 1.");
    setSaving(true);
    try {
      const { error } = await supabase.from("services").insert({
        barber_id: barberId,
        name: name.trim(),
        category,
        price: priceInt,
        required_slots: slotsInt,
      });
      if (error) throw error;
      setName("");
      setPrice("");
      setRequiredSlots("1");
      setCategory("cut");
      await load();
      toast.success("Service added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add service");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  }

  return (
    <section className="bg-card border border-border rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-xl text-foreground">Services &amp; price</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Price is a whole number in {currency} (zero-decimal — don't multiply by 100). Required slots
        is how many consecutive time slots the service needs.
      </p>

      <form onSubmit={add} className="mt-5 grid sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
            placeholder="e.g. Signature Cut"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Price ({currency})
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
            placeholder="500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Slots
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={requiredSlots}
            onChange={(e) => setRequiredSlots(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
          />
        </div>
        <div className="sm:col-span-1">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </form>

      {services.length > 0 && (
        <div className="mt-6 divide-y divide-border/60">
          {services.map((s) => (
            <div key={s.id} className="py-3 flex items-center gap-3">
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-muted text-xs font-medium capitalize">
                {s.category}
              </span>
              <span className="font-medium text-foreground">{s.name}</span>
              <span className="text-sm text-muted-foreground">
                {s.price} {currency} · {s.required_slots} slot{s.required_slots > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => remove(s.id)}
                className="ml-auto h-8 px-3 rounded-full border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── B. Bookable-slot publisher ──
function SlotsPublisher({ barberId, slotMinutes }: { barberId: string; slotMinutes: number }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookable_slots")
      .select("*")
      .eq("barber_id", barberId)
      .order("starts_at");
    if (error) toast.error(error.message);
    else setSlots(data ?? []);
  }, [barberId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    if (!(start < end)) return toast.error("End time must be after start time.");

    const rows: { barber_id: string; starts_at: string; ends_at: string }[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const next = new Date(cursor.getTime() + slotMinutes * 60_000);
      if (next > end) break;
      rows.push({
        barber_id: barberId,
        starts_at: cursor.toISOString(),
        ends_at: next.toISOString(),
      });
      cursor.setTime(next.getTime());
    }
    if (rows.length === 0) return toast.error("That window is shorter than one slot.");

    setSaving(true);
    try {
      const { error } = await supabase.from("bookable_slots").insert(rows);
      if (error) throw error;
      await load();
      toast.success(`Published ${rows.length} slot${rows.length > 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish slots");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("bookable_slots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  }

  // Group slots by calendar day for display.
  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const day = new Date(s.starts_at).toLocaleDateString();
      const arr = map.get(day) ?? [];
      arr.push(s);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [slots]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="bg-card border border-border rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-xl text-foreground">Publish bookable slots</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each slot is a {slotMinutes}-minute window. Generate a day's worth of bookable slots.
      </p>

      <form onSubmit={generate} className="mt-5 grid sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Start
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            End
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {saving ? "…" : "Generate"}
          </button>
        </div>
      </form>

      {grouped.length > 0 && (
        <div className="mt-6 space-y-5">
          {grouped.map(([day, daySlots]) => (
            <div key={day}>
              <h3 className="text-sm font-medium text-foreground">{day}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {daySlots.map((s) => (
                  <span
                    key={s.id}
                    className="group inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-full bg-muted text-xs"
                  >
                    {fmtTime(s.starts_at)}–{fmtTime(s.ends_at)}
                    <button
                      onClick={() => remove(s.id)}
                      aria-label="Delete slot"
                      className="h-5 w-5 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition inline-flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
