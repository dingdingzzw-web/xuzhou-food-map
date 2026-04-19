"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { type LngLatBoundsLike, type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Shop } from "@/types/shop";
import styles from "./zoomable-map.module.css";

interface ZoomableMapProps {
  shops: Shop[];
  activeShopId?: string;
  pickerPosition?: { lat: number; lng: number } | null;
  onSelectShop?: (shop: Shop) => void;
  onPickLocation?: (coords: { lat: number; lng: number }) => void;
}

const XUZHOU_CENTER: [number, number] = [117.2857, 34.2044];
const XUZHOU_BOUNDS: LngLatBoundsLike = [
  [116.95, 34.02],
  [117.62, 34.47],
];
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function ZoomableMap({
  shops,
  activeShopId,
  pickerPosition,
  onSelectShop,
  onPickLocation,
}: ZoomableMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const pickerMarkerRef = useRef<Marker | null>(null);

  const activeShop = useMemo(
    () => shops.find((shop) => shop.id === activeShopId) ?? shops[0],
    [activeShopId, shops],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: XUZHOU_CENTER,
      zoom: 10.5,
      minZoom: 8.5,
      maxZoom: 18,
      maxBounds: XUZHOU_BOUNDS,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

    map.on("click", (event) => {
      onPickLocation?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      pickerMarkerRef.current?.remove();
      pickerMarkerRef.current = null;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [onPickLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());

    markersRef.current = shops.map((shop) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = shop.id === activeShopId ? `${styles.marker} ${styles.markerActive}` : styles.marker;
      el.innerHTML = `<span class="${styles.markerEmoji}">🍜</span><span class="${styles.markerLabel}">${shop.name}</span>`;
      el.addEventListener("click", () => onSelectShop?.(shop));

      return new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([shop.lng, shop.lat])
        .addTo(map);
    });
  }, [activeShopId, onSelectShop, shops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickerPosition) {
      pickerMarkerRef.current?.remove();
      pickerMarkerRef.current = null;
      return;
    }

    if (!pickerMarkerRef.current) {
      const el = document.createElement("div");
      el.className = styles.picker;
      el.innerHTML = `<span class="${styles.pickerDot}"></span>`;
      pickerMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([pickerPosition.lng, pickerPosition.lat])
        .addTo(map);
    } else {
      pickerMarkerRef.current.setLngLat([pickerPosition.lng, pickerPosition.lat]);
    }

    map.flyTo({
      center: [pickerPosition.lng, pickerPosition.lat],
      zoom: Math.max(map.getZoom(), 14.5),
      speed: 0.8,
      curve: 1.1,
      essential: true,
    });
  }, [pickerPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeShop) return;

    map.flyTo({
      center: [activeShop.lng, activeShop.lat],
      zoom: Math.max(map.getZoom(), 13.5),
      speed: 0.8,
      curve: 1.2,
      essential: true,
    });
  }, [activeShop]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <strong>徐州街道级美食地图</strong>
          <p>现在支持拖拽和缩放，先把找店体验做顺，风格化后面再继续收。</p>
        </div>
        <span className={styles.badge}>可缩放，可点位联动，可点击地图选点</span>
      </div>

      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
