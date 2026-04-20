export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  amapKey: process.env.NEXT_PUBLIC_AMAP_KEY || "",
  adminPasscode: process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "xuzhou-keeper-2026",
};

export const hasSupabaseEnv =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasAmapEnv = Boolean(env.amapKey);
