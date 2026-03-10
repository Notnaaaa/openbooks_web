// src/services/notifications.service.ts
import { supabase } from "../lib/supabase";

export type NotifRow = {
  id: string;
  user_id: string;
  type: string; // public.notification_type (enum)
  title: string;
  message: string;
  data: any; // jsonb
  is_read: boolean;
  created_at: string;
};

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

// Optional: only needed if you use this RPC
export async function generateBusinessNotifications(businessId: string) {
  return supabase.rpc("generate_business_notifications", { p_business_id: businessId });
}

export async function listMyNotifications(params: { userId: string; limit?: number }) {
  const limit = params.limit ?? 200;

  return supabase
    .from("notifications")
    .select("id,user_id,type,title,message,data,is_read,created_at")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

// Optional: use this ONLY if you store business_id inside notifications.data
export async function listMyNotificationsForBusiness(params: {
  userId: string;
  businessId: string;
  limit?: number;
}) {
  const limit = params.limit ?? 200;

  return supabase
    .from("notifications")
    .select("id,user_id,type,title,message,data,is_read,created_at")
    .eq("user_id", params.userId)
    .contains("data", { business_id: String(params.businessId) })
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function markNotificationRead(params: { id: string; userId: string }) {
  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", params.id)
    .eq("user_id", params.userId);
}

export async function markAllMyNotificationsRead(params: { userId: string }) {
  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", params.userId)
    .eq("is_read", false);
}