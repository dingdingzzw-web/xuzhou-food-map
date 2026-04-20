import type { Shop } from "@/types/shop";

export function hasShopCover(shop: Pick<Shop, "cover_image_url">) {
  return Boolean(shop.cover_image_url?.trim());
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
