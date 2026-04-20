import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ensureAnonymousSession } from "@/lib/shops";

const BUCKET = "shop-images";

function buildObjectPath(file: File, shopId?: string) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeExt = (ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const scope = shopId || "shop-submissions";
  return `${scope}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
}

export async function uploadShopImageFile(file: File, shopId?: string) {
  const client = await ensureAnonymousSession();

  if (!client) {
    throw new Error("missing_supabase_env");
  }

  const path = buildObjectPath(file, shopId);
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.error("[storage] upload failed", uploadError);
    throw new Error(uploadError.message || "storage_upload_failed");
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("storage_public_url_missing");
  }

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

export function hasSupabaseStorageClient() {
  return Boolean(getSupabaseBrowserClient());
}
