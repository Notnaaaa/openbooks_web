import { supabase } from "../lib/supabase";

export async function getMyBusiness() {
  return supabase.rpc("get_my_business");
}