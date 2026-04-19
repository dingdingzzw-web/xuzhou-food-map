"use client";

import { useEffect, useMemo, useState } from "react";
import { ZoomableMap } from "@/components/map/zoomable-map";
import { ShopDetailDrawer } from "@/components/shops/shop-detail-drawer";
import { ShopCard } from "@/components/shops/shop-card";
import { UploadShopPanel } from "@/components/shops/upload-shop-panel";
import { createShop, fetchShops } from "@/lib/shops";
import { mockShops } from "@/lib/mock-shops";
import type { Shop } from "@/types/shop";
import styles from "./page.module.css";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [shops, setShops] = useState<Shop[]>(mockShops);
  const [activeShopId, setActiveShopId] = useState(mockShops[0]?.id ?? "");
  const [dataSource, setDataSource] = useState<"supabase" | "mock">("mock");
  const [isLoading, setIsLoading] = useState(true);
  const [pickerCoords, setPickerCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchShops();
        if (cancelled) return;

        setShops(result.shops.length ? result.shops : mockShops);
        setDataSource(result.source);
        setActiveShopId((current) => current || result.shops[0]?.id || mockShops[0]?.id || "");
      } catch (error) {
        console.error("[shops] load failed", error);
        if (!cancelled) {
          setShops(mockShops);
          setDataSource("mock");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredShops = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return shops;

    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(q) ||
        shop.address.toLowerCase().includes(q),
    );
  }, [keyword, shops]);

  const activeShop =
    filteredShops.find((shop) => shop.id === activeShopId) || filteredShops[0];

  async function handleCreateShop(input: Parameters<typeof createShop>[0]) {
    const created = await createShop(input);
    if (!created) return null;

    setShops((current) => [created, ...current]);
    setActiveShopId(created.id);
    setDataSource("supabase");
    return created;
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>徐州本地共建地图</span>
          <h1>徐州美食地图</h1>
          <p>
            第一版先把点位、补图、好次 / 包次跑通。主地图走徐州自定义底图，站内负责种草，导航交给外部地图 App。
          </p>
        </div>

        <div className={styles.heroMeta}>
          <div>
            <strong>当前阶段</strong>
            <span>MVP 骨架</span>
          </div>
          <div>
            <strong>已定文案</strong>
            <span>好次 / 包次</span>
          </div>
          <div>
            <strong>技术栈</strong>
            <span>Next.js + Supabase + GeoJSON</span>
          </div>
          <div>
            <strong>数据来源</strong>
            <span>{dataSource === "supabase" ? "Supabase 实时数据" : "本地 mock 数据（待接真环境）"}</span>
          </div>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>搜一家想吃的</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="比如，把子肉、烧烤、辣汤"
          />
        </label>
        <button type="button" className={styles.uploadButton}>
          上传一家店
        </button>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.mapColumn}>
          <ZoomableMap
            shops={filteredShops}
            activeShopId={activeShop?.id}
            pickerPosition={pickerCoords}
            onSelectShop={(shop) => setActiveShopId(shop.id)}
            onPickLocation={(coords) => setPickerCoords(coords)}
          />
        </div>

        <div className={styles.sideColumn}>
          {activeShop ? <ShopDetailDrawer shop={activeShop} /> : null}
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <div className={styles.listBlock}>
          <div className={styles.blockHeader}>
            <div>
              <span className={styles.kicker}>当前点位</span>
              <h2>先从这几家开始</h2>
            </div>
            <span className={styles.count}>
              {isLoading ? "加载中..." : `${filteredShops.length} 家`}
            </span>
          </div>

          <div className={styles.shopList}>
            {filteredShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                active={shop.id === activeShop?.id}
                onClick={() => setActiveShopId(shop.id)}
              />
            ))}
          </div>
        </div>

        <UploadShopPanel onCreateShop={handleCreateShop} selectedCoords={pickerCoords} />
      </section>
    </main>
  );
}
