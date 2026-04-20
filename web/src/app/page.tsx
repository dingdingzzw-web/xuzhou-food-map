"use client";

import { useEffect, useMemo, useState } from "react";
import { ZoomableMap } from "@/components/map/zoomable-map";
import { ShopDetailDrawer } from "@/components/shops/shop-detail-drawer";
import { ShopCard } from "@/components/shops/shop-card";
import { UploadShopPanel } from "@/components/shops/upload-shop-panel";
import { addShopImage, createShop, fetchShops, updateShopDetails, voteShop } from "@/lib/shops";
import { mockShops } from "@/lib/mock-shops";
import type { Shop, VoteType } from "@/types/shop";
import styles from "./page.module.css";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [shops, setShops] = useState<Shop[]>(mockShops);
  const [activeShopId, setActiveShopId] = useState(mockShops[0]?.id ?? "");
  const [dataSource, setDataSource] = useState<"supabase" | "mock">("mock");
  const [isLoading, setIsLoading] = useState(true);
  const [pickerCoords, setPickerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerEnabled, setPickerEnabled] = useState(false);

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
        shop.address.toLowerCase().includes(q) ||
        shop.alias?.toLowerCase().includes(q),
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

  async function handleVote(shopId: string, voteType: VoteType) {
    await voteShop(shopId, voteType);
    const result = await fetchShops();
    setShops(result.shops.length ? result.shops : mockShops);
    setDataSource(result.source);
  }

  async function handleAddImage(shopId: string, imageUrl: string, uploaderName: string) {
    await addShopImage({ shopId, imageUrl, uploaderName });

    setShops((current) =>
      current.map((shop) =>
        shop.id === shopId
          ? {
              ...shop,
              cover_image_url: imageUrl,
            }
          : shop,
      ),
    );
  }

  async function handleUpdateDetails(
    shopId: string,
    input: { address?: string; reason?: string; alias?: string },
  ) {
    const updated = await updateShopDetails(shopId, input);

    setShops((current) =>
      current.map((shop) => (shop.id === shopId ? updated : shop)),
    );
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
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>搜索</span>
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
            pickerEnabled={pickerEnabled}
            onSelectShop={(shop) => setActiveShopId(shop.id)}
            onPickLocation={(coords) => setPickerCoords(coords)}
          />
        </div>

        <div className={styles.sideColumn}>
          {activeShop ? (
            <ShopDetailDrawer
              shop={activeShop}
              onVote={handleVote}
              onAddImage={handleAddImage}
              onUpdateDetails={handleUpdateDetails}
            />
          ) : null}
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

        <UploadShopPanel
          onCreateShop={handleCreateShop}
          selectedCoords={pickerCoords}
          pickerEnabled={pickerEnabled}
          onAutoLocate={(coords) => {
            setPickerCoords(coords);
            setPickerEnabled(true);
          }}
          onTogglePicker={() => setPickerEnabled((current) => !current)}
        />
      </section>
    </main>
  );
}
