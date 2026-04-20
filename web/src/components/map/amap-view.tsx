"use client";

import { useEffect, useRef, useState } from "react";
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
    add?: (overlays: unknown[]) => void;
    setFitView?: (overlays?: unknown[]) => void;
    clearMap?: () => void;
    setZoomAndCenter?: (zoom: number, center: [number, number]) => void;
  } | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const [message, setMessage] = useState("正在接入徐州地图...");

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
  }, [pickerPosition]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

    const AMap = window.AMap;
    const shopsWithCoords = shops.filter(
      (shop): shop is Shop & { lat: number; lng: number } =>
        typeof shop.lat === "number" && typeof shop.lng === "number",
    );

    mapRef.current.clearMap?.();
    markersRef.current = [];

    const nextMarkers = shopsWithCoords.map((shop) => {
      const isActive = shop.id === activeShopId;
      const marker = new AMap.Marker({
        position: [shop.lng, shop.lat],
        title: shop.name,
        offset: new AMap.Pixel(-10, -10),
        content: `<div style="display:flex;align-items:center;justify-content:center;width:${isActive ? 22 : 18}px;height:${isActive ? 22 : 18}px;border-radius:999px;background:${isActive ? "#b2451d" : "#d66f2d"};border:3px solid #fff6ec;box-shadow:0 6px 16px rgba(0,0,0,0.18);"></div>`,
      });

      marker.on?.("click", () => onSelectShop?.(shop));
      return marker;
    });

    markersRef.current = nextMarkers;

    if (nextMarkers.length === 1) {
      const onlyShop = shopsWithCoords[0];
      if (onlyShop) {
        mapRef.current.add?.(nextMarkers);
        mapRef.current.setZoomAndCenter?.(15, [onlyShop.lng, onlyShop.lat]);
        setMessage(`地图已定位到 ${onlyShop.name}`);
      }
    } else if (nextMarkers.length > 1) {
      mapRef.current.add?.(nextMarkers);
      mapRef.current.setFitView?.(nextMarkers);
      setMessage(`地图已标注 ${nextMarkers.length} 家店`);
    }

    if (!nextMarkers.length) {
      setMessage("当前店铺还没有可展示的定位点");
    }
  }, [shops, activeShopId, onSelectShop]);

  const isInvalidUserKey = env.amapKey === "";

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.badge}>{message}</div>
      {isInvalidUserKey ? (
        <div className={styles.warning}>
          当前高德 Key 不可用，自动定位会失败。先直接提交地址，后面再修 Key。
        </div>
      ) : null}
    </div>
  );
}
