import { supabase } from "../lib/supabase";

export async function listAccounts(businessId: string) {
  return supabase
    .from("accounts")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("type", { ascending: true })
    .order("name", { ascending: true });
}

export async function getSystemAccountId(businessId: string, name: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", name)
    .maybeSingle();

  if (error) return { id: null as string | null, error };
  return { id: (data?.id as string) ?? null, error: null };
}