import type { Shop } from "@/types/shop";
import {
  buildAmapUrl,
  buildAppleMapsUrl,
  buildBaiduMapUrl,
  buildTencentMapUrl,
} from "@/lib/navigation";
import styles from "./shop-detail-drawer.module.css";

interface ShopDetailDrawerProps {
  shop: Shop;
}

export function ShopDetailDrawer({ shop }: ShopDetailDrawerProps) {
  return (
    <aside className={styles.drawer}>
      <div className={styles.coverWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cover} src={shop.cover_image_url} alt={shop.name} />
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>今日想冲</p>
          <h2>{shop.name}</h2>
        </div>
        <div className={styles.votePills}>
          <span>好次 {shop.good_count}</span>
          <span>包次 {shop.bad_count}</span>
        </div>
      </div>

      <div className={styles.block}>
        <h3>地址</h3>
        <p>{shop.address}</p>
      </div>

      <div className={styles.block}>
        <h3>推荐理由</h3>
        <p>{shop.reason}</p>
      </div>

      <div className={styles.block}>
        <h3>上传者</h3>
        <p>{shop.creator_name}</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primary}>
          好次一下
        </button>
        <button type="button" className={styles.secondary}>
          包次提醒
        </button>
        <button type="button" className={styles.ghost}>
          补一张图
        </button>
      </div>

      <div className={styles.navBlock}>
        <h3>打开导航</h3>
        <div className={styles.navLinks}>
          <a href={buildAmapUrl(shop)} target="_blank" rel="noreferrer">
            高德地图
          </a>
          <a href={buildBaiduMapUrl(shop)} target="_blank" rel="noreferrer">
            百度地图
          </a>
          <a href={buildAppleMapsUrl(shop)} target="_blank" rel="noreferrer">
            Apple 地图
          </a>
          <a href={buildTencentMapUrl(shop)} target="_blank" rel="noreferrer">
            腾讯地图
          </a>
        </div>
      </div>
    </aside>
  );
}
