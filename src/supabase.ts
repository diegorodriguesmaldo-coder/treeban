import { createClient } from "@supabase/supabase-js";

// Publishable client credentials. RLS, not this public key, protects the database.
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://usyqpikhdkddlfbidlzf.supabase.co";
export const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_bU6kKPkgcFhNXj61URtw9Q_iYp_hqgO";
export const WORKSPACE_ID = "e08fdbd5-c9a1-4d42-9a74-f3d94868a274";
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
