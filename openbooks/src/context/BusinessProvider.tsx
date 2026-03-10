import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import type { Business } from "../types/accounting";

type CtxType = {
  business: Business | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CtxType | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user?.id) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // ✅ DIRECT SELECT (no RPC)
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, owner_user_id, created_at")
      .eq("owner_user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setBusiness(null);
      setLoading(false);
      return;
    }

    setBusiness(data as Business | null);
    setLoading(false);
  }

  async function refresh() {
    await load();
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({ business, loading, refresh }),
    [business, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusiness() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBusiness must be used within BusinessProvider");
  return v;
}