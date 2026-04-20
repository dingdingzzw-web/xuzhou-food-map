import type { Shop } from "@/types/shop";
import { hasShopCover, ShopCoverPlaceholder } from "@/lib/shop-cover";
import styles from "./shop-card.module.css";

interface ShopCardProps {
  shop: Shop;
  active?: boolean;
  onClick?: () => void;
}

export function ShopCard({ shop, active, onClick }: ShopCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.active : ""}`.trim()}
      onClick={onClick}
    >
      <div className={styles.coverWrap}>
        {hasShopCover(shop) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cover} src={shop.cover_image_url!} alt={shop.name} />
        ) : (
          <ShopCoverPlaceholder compact />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3>{shop.name}</h3>
          <span className={styles.badge}>{hasShopCover(shop) ? "本地推荐" : "待补图片"}</span>
        </div>
        <p className={styles.address}>{shop.address}</p>
        <p className={styles.reason}>{shop.reason}</p>
        <div className={styles.footer}>
          <span>上传者：{shop.creator_name}</span>
          <div className={styles.votes}>
            <span>好次 {shop.good_count}</span>
            <span>包次 {shop.bad_count}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
