import type { Shop } from "@/types/shop";

const DEFAULT_COVER_PATTERNS = [
  "images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  "images.unsplash.com/photo-1552566626-52f8b828add9",
  "images.unsplash.com/photo-1528605248644-14dd04022da1",
];

export function isDefaultShopCover(url?: string | null) {
  const normalized = url?.trim() || "";
  if (!normalized) return false;
  return DEFAULT_COVER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function hasShopCover(shop: Pick<Shop, "cover_image_url">) {
  const normalized = shop.cover_image_url?.trim() || "";
  if (!normalized) return false;
  if (isDefaultShopCover(normalized)) return false;
  return true;
}

export function ShopCoverPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: compact ? 6 : 10,
        padding: compact ? 10 : 18,
        color: "#9f6b45",
        background:
          "linear-gradient(180deg, rgba(255,245,232,0.95) 0%, rgba(245,228,207,0.98) 100%)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: compact ? 24 : 34 }}>📷</div>
      <div style={{ fontWeight: 700, fontSize: compact ? 13 : 16 }}>图片待上传</div>
      <div style={{ fontSize: compact ? 11 : 13, lineHeight: 1.5, opacity: 0.9 }}>
        这家店已经被收录，
        <br />
        欢迎后续补充门头、菜品或环境图
      </div>
    </div>
  );
}
