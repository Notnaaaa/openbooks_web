import { supabase } from "../lib/supabase";

export async function updateProfileBasics(payload: any) {
  return supabase.from("profiles").update(payload).eq("id", (await supabase.auth.getUser()).data.user?.id);
}