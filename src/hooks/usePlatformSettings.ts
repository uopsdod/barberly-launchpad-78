import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// The single-row global config (currency + slot length). World-readable.
export function usePlatformSettings() {
  const [settings, setSettings] = useState<Tables<"platform_settings"> | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("platform_settings")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSettings(data ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
