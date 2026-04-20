import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { CreateShopInput } from "@/components/shops/upload-shop-panel";
import type { Shop, ShopImage, ShopUpdateInput, VoteType } from "@/types/shop";

const SHOP_SELECT =
  "id, name, address, lat, lng, cover_image_url, reason, creator_name, alias, status, good_count, bad_count, created_at, updated_at";

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
  source: "supabase";
}> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const { data, error } = await client
    .from("shops")
    .select(SHOP_SELECT)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[shops] fetch failed", error);
    throw new Error(error.message || "fetch_shops_failed");
  }

  return {
    shops: (data ?? []) as Shop[],
    source: "supabase",
  };
}

export async function createShop(input: CreateShopInput): Promise<Shop> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const payload = {
    name: input.name.trim(),
    address: input.address.trim(),
    cover_image_url: input.cover_image_url.trim(),
    reason: input.reason.trim(),
    creator_name: input.creator_name.trim(),
    lat: input.lat,
    lng: input.lng,
    status: "approved",
  };

  const { data, error } = await client
    .from("shops")
    .insert(payload)
    .select(SHOP_SELECT)
    .single();

  if (error) {
    console.error("[shops] create failed", error);
    throw new Error(error.message || "create_shop_failed");
  }

  return data as Shop;
}

export async function addShopImage(input: {
  shopId: string;
  imageUrl: string;
  uploaderName: string;
}): Promise<ShopImage> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const { data, error } = await client
    .from("shop_images")
    .insert({
      shop_id: input.shopId,
      image_url: input.imageUrl.trim(),
      uploader_name: input.uploaderName.trim(),
    })
    .select("id, shop_id, image_url, uploader_name, created_at")
    .single();

  if (error) {
    console.error("[shops] add image failed", error);
    throw new Error(error.message || "add_shop_image_failed");
  }

  return data as ShopImage;
}

export async function updateShopCover(shopId: string, imageUrl: string): Promise<Shop> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const { data, error } = await client
    .from("shops")
    .update({ cover_image_url: imageUrl.trim() })
    .eq("id", shopId)
    .select(SHOP_SELECT)
    .single();

  if (error) {
    console.error("[shops] update cover failed", error);
    throw new Error(error.message || "update_shop_cover_failed");
  }

  return data as Shop;
}

export async function updateShopDetails(shopId: string, input: ShopUpdateInput): Promise<Shop> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const normalizedShopId = shopId.trim();
  const payload: Record<string, string | number | null> = {};

  if (typeof input.name === "string" && input.name.trim()) {
    payload.name = input.name.trim();
  }

  if (typeof input.address === "string" && input.address.trim()) {
    payload.address = input.address.trim();
  }

  if (typeof input.reason === "string" && input.reason.trim()) {
    payload.reason = input.reason.trim();
  }

  if (typeof input.alias === "string") {
    payload.alias = input.alias.trim();
  }

  if (typeof input.cover_image_url === "string") {
    payload.cover_image_url = input.cover_image_url.trim();
  }

  if (input.cover_image_url === null) {
    payload.cover_image_url = null;
  }

  if (typeof input.lat === "number") {
    payload.lat = input.lat;
  }

  if (typeof input.lng === "number") {
    payload.lng = input.lng;
  }

  if (input.lat === null) {
    payload.lat = null;
  }

  if (input.lng === null) {
    payload.lng = null;
  }

  if (typeof input.status === "string") {
    payload.status = input.status;
  }

  if (!Object.keys(payload).length) {
    throw new Error("empty_shop_update");
  }

  const { data, error } = await client
    .from("shops")
    .update(payload)
    .eq("id", normalizedShopId)
    .select(SHOP_SELECT)
    .maybeSingle();

  if (error) {
    console.error("[shops] update failed", error);
    throw new Error(error.message || "update_shop_failed");
  }

  if (!data) {
    throw new Error(`shop_not_found_or_not_updatable:${normalizedShopId}`);
  }

  return data as Shop;
}

export async function deleteShop(shopId: string): Promise<void> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const { error } = await client.from("shops").delete().eq("id", shopId);
  if (error) {
    console.error("[shops] delete failed", error);
    throw new Error(error.message || "delete_shop_failed");
  }
}

export async function voteShop(shopId: string, voteType: VoteType): Promise<void> {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message || "missing_anonymous_user");
  }

  const voterKey = user.id;

  const { data: existing, error: existingError } = await client
    .from("shop_votes")
    .select("id, vote_type")
    .eq("shop_id", shopId)
    .eq("voter_key", voterKey)
    .maybeSingle();

  if (existingError) {
    console.error("[shops] load vote failed", existingError);
    throw new Error(existingError.message || "load_vote_failed");
  }

  if (!existing) {
    const { error } = await client.from("shop_votes").insert({
      shop_id: shopId,
      voter_key: voterKey,
      vote_type: voteType,
    });

    if (error) {
      console.error("[shops] insert vote failed", error);
      throw new Error(error.message || "insert_vote_failed");
    }

    return;
  }

  if (existing.vote_type === voteType) {
    return;
  }

  const { error } = await client
    .from("shop_votes")
    .update({ vote_type: voteType })
    .eq("id", existing.id);

  if (error) {
    console.error("[shops] update vote failed", error);
    throw new Error(error.message || "update_vote_failed");
  }
}
