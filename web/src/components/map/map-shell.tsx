"use client";

import { useMemo } from "react";
import clsx from "clsx";
import type { Shop } from "@/types/shop";
import styles from "./map-shell.module.css";

interface MapShellProps {
  shops: Shop[];
  activeShopId?: string;
  onSelectShop?: (shop: Shop) => void;
}

export function MapShell({ shops, activeShopId, onSelectShop }: MapShellProps) {
  const markers = useMemo(() => shops.slice(0, 12), [shops]);

  return (
    <div className={styles.mapShell}>
      <div className={styles.mapBackdrop}>
        <div className={styles.river} />
        <div className={styles.ring} />
        <div className={styles.grid} />
      </div>

      <div className={styles.badges}>
        <span>云龙湖</span>
        <span>鼓楼区</span>
        <span>泉山区</span>
        <span>云龙区</span>
      </div>

      {markers.map((shop, index) => {
        const top = 18 + (index % 4) * 17;
        const left = 14 + ((index * 23) % 68);

        return (
          <button
            key={shop.id}
            type="button"
            className={clsx(styles.marker, {
              [styles.markerActive]: shop.id === activeShopId,
            })}
            style={{ top: `${top}%`, left: `${left}%` }}
            onClick={() => onSelectShop?.(shop)}
          >
            <span className={styles.markerIcon}>🍜</span>
            <span className={styles.markerLabel}>{shop.name}</span>
          </button>
        );
      })}

      <div className={styles.mapHint}>
        <strong>地图骨架已就位</strong>
        <p>下一步接高德 JS API，把这里替换成真实徐州地图和点位。</p>
      </div>
    </div>
  );
}
