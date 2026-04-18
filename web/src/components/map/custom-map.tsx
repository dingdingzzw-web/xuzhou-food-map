"use client";

import { useEffect, useMemo, useState } from "react";
import type { Shop } from "@/types/shop";
import styles from "./custom-map.module.css";

interface GeoFeature {
  type: string;
  properties?: {
    name?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

interface GeoJsonData {
  type: string;
  features?: GeoFeature[];
}

interface Point {
  x: number;
  y: number;
}

interface CustomMapProps {
  shops: Shop[];
  activeShopId?: string;
  onSelectShop?: (shop: Shop) => void;
}

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 760;

type Ring = number[][];

function extractRings(geometryType?: string, coordinates?: unknown): Ring[] {
  if (!geometryType || !coordinates || !Array.isArray(coordinates)) return [];

  if (geometryType === "Polygon") {
    return coordinates.flatMap((ring) =>
      Array.isArray(ring) ? [ring.filter((p): p is number[] => Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number")] : [],
    );
  }

  if (geometryType === "MultiPolygon") {
    return coordinates.flatMap((polygon) =>
      Array.isArray(polygon)
        ? polygon.flatMap((ring) =>
            Array.isArray(ring)
              ? [ring.filter((p): p is number[] => Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number")]
              : [],
          )
        : [],
    );
  }

  return [];
}

function toSvgPoint(
  lng: number,
  lat: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
): Point {
  const padding = 48;
  const innerWidth = VIEW_WIDTH - padding * 2;
  const innerHeight = VIEW_HEIGHT - padding * 2;

  const xRatio = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1);
  const yRatio = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1);

  return {
    x: padding + xRatio * innerWidth,
    y: VIEW_HEIGHT - padding - yRatio * innerHeight,
  };
}

export function CustomMap({ shops, activeShopId, onSelectShop }: CustomMapProps) {
  const [districts, setDistricts] = useState<GeoJsonData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch("/map/xuzhou-districts.json");
      const json = (await response.json()) as GeoJsonData;
      if (!cancelled) {
        setDistricts(json);
      }
    }

    load().catch((error) => {
      console.error("[custom-map] load geojson failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const prepared = useMemo(() => {
    const features = districts?.features ?? [];
    const allRings = features.flatMap((feature) =>
      extractRings(feature.geometry?.type, feature.geometry?.coordinates),
    );
    const rawPoints = allRings.flat();

    if (!rawPoints.length) return null;

    const lngs = rawPoints.map((item) => item[0]);
    const lats = rawPoints.map((item) => item[1]);
    const bounds = {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };

    const districtPaths = features.map((feature, index) => {
      const rings = extractRings(feature.geometry?.type, feature.geometry?.coordinates);
      const d = rings
        .map((ring) =>
          ring
            .map(([lng, lat], pointIndex) => {
              const point = toSvgPoint(lng, lat, bounds);
              return `${pointIndex === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
            })
            .join(" "),
        )
        .join(" ");

      const allPoints = rings.flat();
      const center = allPoints.length
        ? allPoints.reduce(
            (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
            { lng: 0, lat: 0 },
          )
        : { lng: 117.184811, lat: 34.261792 };

      const labelPoint = toSvgPoint(
        center.lng / (allPoints.length || 1),
        center.lat / (allPoints.length || 1),
        bounds,
      );

      return {
        id: `${feature.properties?.name || "district"}-${index}`,
        name: feature.properties?.name || "未命名区域",
        d,
        labelPoint,
      };
    });

    const markers = shops.map((shop) => ({
      shop,
      point: toSvgPoint(shop.lng, shop.lat, bounds),
    }));

    return {
      districtPaths,
      markers,
    };
  }, [districts, shops]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <strong>徐州自定义美食地图</strong>
          <p>不做站内导航，只负责让人种草和找到区域感。</p>
        </div>
        <span className={styles.badge}>点击店铺后可外跳地图 App</span>
      </div>

      <div className={styles.canvasWrap}>
        {prepared ? (
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className={styles.svg}
            role="img"
            aria-label="徐州自定义美食地图"
          >
            <rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} className={styles.bg} />

            {prepared.districtPaths.map((district, index) => (
              <g key={district.id}>
                <path
                  d={`${district.d} Z`}
                  className={index % 2 === 0 ? styles.regionA : styles.regionB}
                />
                <path d={`${district.d} Z`} className={styles.regionStroke} />
                <text
                  x={district.labelPoint.x}
                  y={district.labelPoint.y}
                  className={styles.regionLabel}
                >
                  {district.name}
                </text>
              </g>
            ))}

            {prepared.markers.map(({ shop, point }) => (
              <g key={shop.id} onClick={() => onSelectShop?.(shop)} className={styles.markerGroup}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={shop.id === activeShopId ? 16 : 12}
                  className={shop.id === activeShopId ? styles.markerActive : styles.marker}
                />
                <text x={point.x} y={point.y + 4} textAnchor="middle" className={styles.markerEmoji}>
                  🍜
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <div className={styles.loading}>正在生成徐州底图...</div>
        )}
      </div>
    </div>
  );
}
