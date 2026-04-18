import { getSupabaseBrowserClient } from "@/lib/supabase";
import { mockShops } from "@/lib/mock-shops";
import type { CreateShopInput } from "@/components/shops/upload-shop-panel";
import type { Shop } from "@/types/shop";

export async function ensureAnonymousSession() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const {
    data: { session },
  } = await client.auth.getSession();

  if (session) return client;

  const { error } = await client.auth.signInAnonymously();
  if (error) {
    throw error;
  }

  return client;
}

export async function fetchShops(): Promise<{
  shops: Shop[];
  source: "supabase" | "mock";
}> {
  const client = await ensureAnonymousSession();

  if (!client) {
    return { shops: mockShops, source: "mock" };
  }

  const { data, error } = await client
    .from("shops")
    .select(
      "id, name, address, lat, lng, cover_image_url, reason, creator_name, good_count, bad_count, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[shops] fetch failed, fallback to mock data", error);
    return { shops: mockShops, source: "mock" };
  }

  return {
    shops: (data ?? []) as Shop[],
    source: "supabase",
  };
}

export async function createShop(input: CreateShopInput): Promise<Shop | null> {
  const client = await ensureAnonymousSession();

  if (!client) {
    return null;
  }

  const payload = {
    name: input.name.trim(),
    address: input.address.trim(),
    cover_image_url: input.cover_image_url.trim(),
    reason: input.reason.trim(),
    creator_name: input.creator_name.trim(),
    lat: input.lat,
    lng: input.lng,
  };

  const { data, error } = await client
    .from("shops")
    .insert(payload)
    .select(
      "id, name, address, lat, lng, cover_image_url, reason, creator_name, good_count, bad_count, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("[shops] create failed", error);
    return null;
  }

  return data as Shop;
}
