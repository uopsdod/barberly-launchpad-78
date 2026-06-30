import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { ShopHeader } from "@/components/ShopHeader";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Barber = Tables<"barbers">;
type Photo = Tables<"barber_photos">;

const BUCKET = "barber-photos";

export default function ShopOnboarding() {
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();

  // ── A. Payout settings (shop-level, written to profiles) ──
  const [bankName, setBankName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    setBankName(profile?.bank_account_name ?? "");
    setBankNumber(profile?.bank_account_number ?? "");
  }, [profile?.bank_account_name, profile?.bank_account_number]);

  async function savePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!bankName.trim() || !bankNumber.trim()) {
      toast.error("Bank account name and number are both required.");
      return;
    }
    setSavingPayout(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bank_account_name: bankName.trim(),
          bank_account_number: bankNumber.trim(),
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Payout details saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save payout details");
    } finally {
      setSavingPayout(false);
    }
  }

  // ── B. My barbers (one shop → many barbers) ──
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  const loadBarbers = useCallback(async () => {
    if (!user) return;
    setLoadingBarbers(true);
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("shop_id", user.id)
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setBarbers(data ?? []);
    setLoadingBarbers(false);
  }, [user]);

  useEffect(() => {
    void loadBarbers();
  }, [loadBarbers]);

  const payoutMissing = !profile?.bank_account_name || !profile?.bank_account_number;

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      <main className="mx-auto max-w-5xl px-5 sm:px-8 py-10 space-y-10">
        <div>
          <h1 className="font-display text-3xl text-foreground">Shop onboarding</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Set up your payout account, list your barbers, and upload portfolio photos.
          </p>
        </div>

        {/* A. Payout settings */}
        <section className="bg-card border border-border rounded-3xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-foreground">Payout settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The bank account where your shop gets paid.{" "}
                <span className="font-medium text-foreground">Use test data first.</span>
              </p>
            </div>
            {payoutMissing && (
              <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                Required
              </span>
            )}
          </div>

          <form onSubmit={savePayout} className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bank account name <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
                placeholder="e.g. Barberly Test Shop"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bank account number <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
                placeholder="e.g. 0000-0000-0000"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingPayout}
                className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                {savingPayout ? "Saving…" : "Save payout details"}
              </button>
            </div>
          </form>
        </section>

        {/* B + C. My barbers + photos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground">My barbers</h2>
            <AddBarberButton shopId={user?.id} onAdded={loadBarbers} />
          </div>

          {loadingBarbers ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : barbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No barbers yet. Add your first barber to start building a profile.
            </p>
          ) : (
            <div className="space-y-4">
              {barbers.map((b) => (
                <BarberCard key={b.id} barber={b} onChanged={loadBarbers} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ── Add-a-barber inline form ──
function AddBarberButton({ shopId, onAdded }: { shopId?: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!shopId) return;
    if (!name.trim()) {
      toast.error("Barber name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("barbers")
        .insert({ shop_id: shopId, name: name.trim() });
      if (error) throw error;
      setName("");
      setOpen(false);
      onAdded();
      toast.success("Barber added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add barber");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
      >
        + Add another barber
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="Barber name"
        className="h-9 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
      />
      <button
        onClick={add}
        disabled={saving}
        className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
      >
        {saving ? "…" : "Add"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="h-9 px-3 rounded-full border border-border text-sm hover:bg-muted transition"
      >
        Cancel
      </button>
    </div>
  );
}

// ── One barber: editable profile + photo manager ──
function BarberCard({ barber, onChanged }: { barber: Barber; onChanged: () => void }) {
  const [name, setName] = useState(barber.name);
  const [intro, setIntro] = useState(barber.intro ?? "");
  const [address, setAddress] = useState(barber.address ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== barber.name || intro !== (barber.intro ?? "") || address !== (barber.address ?? "");

  async function save() {
    if (!name.trim()) {
      toast.error("Barber name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("barbers")
        .update({
          name: name.trim(),
          intro: intro.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", barber.id);
      if (error) throw error;
      onChanged();
      toast.success("Barber updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update barber");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Delete barber "${barber.name}"? This also removes their services, slots and photos.`,
      )
    )
      return;
    const { error } = await supabase.from("barbers").delete().eq("id", barber.id);
    if (error) toast.error(error.message);
    else {
      onChanged();
      toast.success("Barber deleted.");
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full h-11 px-4 rounded-full bg-background border border-border focus:border-ring outline-none text-sm"
            placeholder="Optional"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Intro
          </label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            className="mt-2 w-full px-4 py-3 rounded-2xl bg-background border border-border focus:border-ring outline-none text-sm resize-y"
            placeholder="Optional — a short bio for this barber."
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={remove}
          className="h-9 px-4 rounded-full border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition"
        >
          Delete
        </button>
      </div>

      <BarberPhotos barberId={barber.id} />
    </div>
  );
}

// ── Sample hairstyle photos for one barber ──
function BarberPhotos({ barberId }: { barberId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("barber_photos")
      .select("*")
      .eq("barber_id", barberId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setPhotos(data ?? []);
  }, [barberId]);

  useEffect(() => {
    void load();
  }, [load]);

  function publicUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        // Path MUST start with '<barber_id>/' so the Storage write-own policy authorizes it.
        const path = `${barberId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { error: rowErr } = await supabase
          .from("barber_photos")
          .insert({ barber_id: barberId, storage_path: path, sort_order: photos.length });
        if (rowErr) throw rowErr;
      }
      await load();
      toast.success("Photos uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleFeatured(photo: Photo) {
    const { error } = await supabase
      .from("barber_photos")
      .update({ is_featured: !photo.is_featured })
      .eq("id", photo.id);
    if (error) toast.error(error.message);
    else load();
  }

  async function removePhoto(photo: Photo) {
    // Delete BOTH the Storage object and the metadata row.
    const { error: sErr } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    if (sErr) {
      toast.error(sErr.message);
      return;
    }
    const { error: rErr } = await supabase.from("barber_photos").delete().eq("id", photo.id);
    if (rErr) toast.error(rErr.message);
    else load();
  }

  return (
    <div className="mt-6 border-t border-border/60 pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Sample hairstyle photos</h3>
        <label className="h-9 px-4 rounded-full border border-border text-sm font-medium hover:bg-muted transition cursor-pointer inline-flex items-center">
          {uploading ? "Uploading…" : "+ Upload photos"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No photos yet. Upload past work — mark your best as Featured.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-border"
            >
              <img
                src={publicUrl(p.storage_path)}
                alt={p.caption ?? "Barber work"}
                className="aspect-square w-full object-cover"
              />
              {p.is_featured && (
                <span className="absolute top-2 left-2 inline-flex items-center h-5 px-2 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                  Featured
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => toggleFeatured(p)}
                  className="h-7 px-2 rounded-full bg-card/90 text-xs font-medium hover:bg-card transition"
                >
                  {p.is_featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  onClick={() => removePhoto(p)}
                  className="h-7 px-2 rounded-full bg-card/90 text-destructive text-xs font-medium hover:bg-card transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
