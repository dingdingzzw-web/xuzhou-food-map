"use client";

import { useEffect, useRef, useState } from "react";
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
    setFitView?: () => void;
  } | null>(null);
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
    const anyMap = mapRef.current as { setZoomAndCenter?: (zoom: number, center: [number, number]) => void };
    anyMap.setZoomAndCenter?.(15, center);
  }, [pickerPosition]);

  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

    const AMap = window.AMap;
    const shopsWithCoords = shops.filter(
      (shop): shop is Shop & { lat: number; lng: number } =>
        typeof shop.lat === "number" && typeof shop.lng === "number",
    );

    const nextMarkers = shopsWithCoords.map((shop) => {
      const marker = new AMap.Marker({
        position: [shop.lng, shop.lat],
        title: shop.name,
        offset: new AMap.Pixel(-14, -28),
        label: {
          direction: "top",
          offset: new AMap.Pixel(0, -8),
          content: `<div style="max-width:160px;padding:5px 10px;border-radius:999px;background:${shop.id === activeShopId ? "#ffedd7" : "rgba(255,251,245,0.96)"};border:1px solid rgba(157,98,56,0.18);color:#5c3923;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 8px 16px rgba(0,0,0,0.08);">${shop.name}</div>`,
        },
      });

      marker.on?.("click", () => onSelectShop?.(shop));
      return marker;
    });

    mapRef.current.add?.(nextMarkers);
    mapRef.current.setFitView?.();
  }, [shops, activeShopId, onSelectShop]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.badge}>{message}</div>
    </div>
  );
}
