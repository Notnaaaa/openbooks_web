export type Role = "owner" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  phone_number: string | null;
  birthdate: string | null; // Supabase returns dates as string
  sex: string | null;
  role: Role;
  mpin_hash: string | null;
  created_at: string;
  updated_at: string;
};