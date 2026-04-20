"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShopDetailDrawer } from "@/components/shops/shop-detail-drawer";
import { ShopCard } from "@/components/shops/shop-card";
import { UploadShopPanel } from "@/components/shops/upload-shop-panel";
import { addShopImage, createShop, fetchShops, updateShopCover, updateShopDetails, voteShop } from "@/lib/shops";
import type { Shop, VoteType } from "@/types/shop";
import styles from "./page.module.css";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopId] = useState("");
  const [dataSource, setDataSource] = useState<"supabase" | "mock">("supabase");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pickerCoords, setPickerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const uploadPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchShops();
        if (cancelled) return;

        setShops(result.shops);
        setDataSource(result.source);
        setActiveShopId((current) => current || result.shops[0]?.id || "");
        setLoadError("");
      } catch (error) {
        console.error("[shops] load failed", error);
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "unknown_fetch_error";
          setShops([]);
          setDataSource("supabase");
          setLoadError(`读取线上店铺失败：${message}`);
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

    setShops((current) => [created, ...current]);
    setActiveShopId(created.id);
    setDataSource("supabase");
    return created;
  }

  async function handleVote(shopId: string, voteType: VoteType) {
    await voteShop(shopId, voteType);
    const result = await fetchShops();
    setShops(result.shops);
    setDataSource(result.source);
  }

  async function handleAddImage(shopId: string, imageUrl: string, uploaderName: string) {
    await addShopImage({ shopId, imageUrl, uploaderName });
    const updated = await updateShopCover(shopId, imageUrl);

    setShops((current) =>
      current.map((shop) => (shop.id === shopId ? updated : shop)),
    );
  }

  async function handleUpdateDetails(
    shopId: string,
    input: { address?: string; reason?: string; alias?: string },
  ) {
    await updateShopDetails(shopId, input);
    const result = await fetchShops();
    setShops(result.shops);
    setDataSource(result.source);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>徐州本地共建地图</span>
          <h1>徐州美食地图</h1>
          <p>先把大家推荐的店收进来，地图只做大概位置参考，导航交给外部地图。</p>
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
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => uploadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          去上传
        </button>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.listBlock}>
          <div className={styles.blockHeader}>
            <div>
              <span className={styles.kicker}>饭店列表</span>
              <h2>先从这些店开始</h2>
            </div>
            <span className={styles.count}>
              {isLoading ? "加载中..." : `${filteredShops.length} 家`}
            </span>
          </div>

          {loadError ? <p className={styles.loadError}>{loadError}</p> : null}

          {!isLoading && !filteredShops.length ? (
            <div className={styles.emptyState}>
              <p>还没有读取到店铺数据。</p>
              <span>现在页面会直接显示真实报错。把那句错误原文发我，我就能继续定点修。</span>
            </div>
          ) : null}

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

        <div className={styles.sideColumn}>
          {activeShop ? (
            <ShopDetailDrawer
              shop={activeShop}
              onVote={handleVote}
              onAddImage={handleAddImage}
              onUpdateDetails={handleUpdateDetails}
            />
          ) : null}

          <section ref={uploadPanelRef}>
            <UploadShopPanel
              onCreateShop={handleCreateShop}
              selectedCoords={pickerCoords}
              onAutoLocate={(coords) => {
                setPickerCoords(coords);
              }}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
