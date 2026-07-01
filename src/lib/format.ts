import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PlatformSettings = Tables<"platform_settings">;

// Money columns are integers in platform_settings.currency. Zero-decimal
// currencies (TWD, JPY) have currency_minor_units = 0 → show the integer as-is;
// 2-decimal currencies divide by 100. Never assume a fixed currency.
export function formatMoney(
  amount: number,
  settings?: Pick<PlatformSettings, "currency" | "currency_minor_units"> | null,
): string {
  const currency = (settings?.currency ?? "twd").toUpperCase();
  const minor = settings?.currency_minor_units ?? 0;
  if (minor > 0) {
    return `${currency} ${(amount / Math.pow(10, minor)).toFixed(minor)}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Public URL for a file in the public 'barber-photos' storage bucket.
export function photoUrl(storagePath: string): string {
  return supabase.storage.from("barber-photos").getPublicUrl(storagePath).data.publicUrl;
}
