"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/lib/env";
import { loadAmapSdk } from "@/lib/amap";
import type { Shop } from "@/types/shop";
import styles from "./amap-view.module.css";

interface AMapViewProps {
  shops: Shop[];
  activeShopId?: string;
  pickerPosition?: { lat: number; lng: number } | null;
  onSelectShop?: (shop: Shop) => void;
  onMapError?: () => void;
}

const XUZHOU_CENTER: [number, number] = [117.28565, 34.2044];

export function AMapView({
  shops,
  activeShopId,
  pickerPosition,
  onSelectShop,
  onMapError,
}: AMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{
    destroy?: () => void;
    setFitView?: (overlays?: unknown[]) => void;
    clearMap?: () => void;
    setZoomAndCenter?: (zoom: number, center: [number, number]) => void;
  } | null>(null);
  const [message, setMessage] = useState("正在接入徐州地图...");

  const shopsWithCoords = useMemo(
    () =>
      shops.filter((shop): shop is Shop & { lat: number; lng: number } => {
        const lat = Number(shop.lat);
        const lng = Number(shop.lng);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [shops],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadAmapSdk();
        if (cancelled || !containerRef.current || !window.AMap) return;

        mapRef.current?.destroy?.();

        mapRef.current = new window.AMap.Map(containerRef.current, {
          zoom: 11,
          center: XUZHOU_CENTER,
          mapStyle: "amap://styles/whitesmoke",
          viewMode: "2D",
        });

        setMessage("高德地图已接入");
      } catch (error) {
        console.error("[amap] init failed", error);
        if (!cancelled) {
          setMessage("高德地图加载失败，已回退到骨架地图");
          onMapError?.();
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [onMapError]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current || !pickerPosition) return;

    const center = [pickerPosition.lng, pickerPosition.lat] as [number, number];
    mapRef.current.setZoomAndCenter?.(15, center);
    setMessage("地图已定位到新上传店铺");
  }, [pickerPosition]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

    if (activeShopId) {
      const activeShop = shopsWithCoords.find((shop) => shop.id === activeShopId);
      if (activeShop) {
        mapRef.current.setZoomAndCenter?.(15, [Number(activeShop.lng), Number(activeShop.lat)]);
        setMessage(`地图已定位到 ${activeShop.name}`);
        return;
      }
    }

    if (shopsWithCoords.length === 1) {
      const onlyShop = shopsWithCoords[0];
      if (onlyShop) {
        mapRef.current.setZoomAndCenter?.(15, [Number(onlyShop.lng), Number(onlyShop.lat)]);
        setMessage(`地图已定位到 ${onlyShop.name}`);
      }
    } else if (shopsWithCoords.length > 1) {
      const bounds = shopsWithCoords.map((shop) => [Number(shop.lng), Number(shop.lat)] as [number, number]);
      mapRef.current.setFitView?.(bounds);
      setMessage(`地图已覆盖 ${shopsWithCoords.length} 家店所在区域`);
    }

    if (!shopsWithCoords.length) {
      setMessage("当前店铺还没有可展示的定位点");
    }
  }, [shopsWithCoords, activeShopId]);

  const isInvalidUserKey = env.amapKey === "";

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.badge}>{message}</div>
      <div className={styles.shopOverlay}>
        <strong>已收录店铺</strong>
        {shopsWithCoords.length ? (
          shopsWithCoords.map((shop) => (
            <button
              key={shop.id}
              type="button"
              className={`${styles.shopChip} ${shop.id === activeShopId ? styles.shopChipActive : ""}`.trim()}
              onClick={() => onSelectShop?.(shop)}
            >
              {shop.name}
            </button>
          ))
        ) : (
          <span className={styles.shopEmpty}>还没有可展示坐标</span>
        )}
      </div>
      {isInvalidUserKey ? (
        <div className={styles.warning}>
          当前高德 Key 不可用，自动定位会失败。先直接提交地址，后面再修 Key。
        </div>
      ) : null}
    </div>
  );
}
