"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteShop, ensureAnonymousSession, updateShopDetails } from "@/lib/shops";
import { env } from "@/lib/env";
import type { Shop } from "@/types/shop";
import styles from "./page.module.css";

export default function ManagePage() {
  const [passcode, setPasscode] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [keyword, setKeyword] = useState("");
  const [activeShopId, setActiveShopId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    reason: "",
    alias: "",
    cover_image_url: "",
    lat: "",
    lng: "",
    status: "active",
  });

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function load() {
      try {
        const client = await ensureAnonymousSession();
        if (!client) throw new Error("missing_supabase_env");
        const { data, error } = await client
          .from("shops")
          .select("id, name, address, lat, lng, cover_image_url, reason, creator_name, alias, status, good_count, bad_count, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;
        setShops((data ?? []) as Shop[]);
        setActiveShopId((current) => current || data?.[0]?.id || "");
        setFeedback("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown_manage_load_error";
        if (!cancelled) {
          setFeedback(`读取管理数据失败：${message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(q) ||
        shop.address.toLowerCase().includes(q) ||
        shop.alias?.toLowerCase().includes(q),
    );
  }, [keyword, shops]);

  const activeShop = filtered.find((shop) => shop.id === activeShopId) || filtered[0] || null;

  useEffect(() => {
    if (!activeShop) return;
    setForm({
      name: activeShop.name || "",
      address: activeShop.address || "",
      reason: activeShop.reason || "",
      alias: activeShop.alias || "",
      cover_image_url: activeShop.cover_image_url || "",
      lat: activeShop.lat == null ? "" : String(activeShop.lat),
      lng: activeShop.lng == null ? "" : String(activeShop.lng),
      status: activeShop.status || "active",
    });
  }, [activeShop]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeShop) return;

    setSaving(true);
    setFeedback("");

    try {
      const updated = await updateShopDetails(activeShop.id, {
        name: form.name,
        address: form.address,
        reason: form.reason,
        alias: form.alias,
        cover_image_url: form.cover_image_url || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        status: form.status as "active" | "hidden" | "pending",
      });

      setShops((current) => current.map((shop) => (shop.id === updated.id ? updated : shop)));
      setFeedback("店铺信息已更新。这个页面先只给你自己用，适合纠正脏数据。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_manage_save_error";
      setFeedback(`保存失败：${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (!authorized) {
    return (
      <main className={styles.page}>
        <section className={styles.lockCard}>
          <p className={styles.kicker}>隐藏管理页</p>
          <h1>徐州美食地图管理入口</h1>
          <p className={styles.desc}>先用一个轻量口令把入口藏起来，至少别让路人随便点进来。真正的管理员鉴权后面再补。</p>
          <input
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="输入口令"
            className={styles.input}
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              if (passcode === env.adminPasscode) {
                setAuthorized(true);
                setLoading(true);
              } else {
                setFeedback("口令不对。先只给你自己用，所以入口先收紧一点。");
              }
            }}
          >
            进入管理页
          </button>
          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <p className={styles.kicker}>仅内部使用</p>
          <h1>店铺管理台</h1>
          <p className={styles.desc}>先给你一个最小可用的纠错入口，后面再补真正的管理员鉴权和审核流。</p>
        </div>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜店名 / 地址 / 别名"
          className={styles.search}
        />
      </section>

      <section className={styles.grid}>
        <aside className={styles.listCard}>
          <div className={styles.listHeader}>
            <strong>店铺列表</strong>
            <span>{loading ? "加载中..." : `${filtered.length} 家`}</span>
          </div>
          <div className={styles.list}>
            {filtered.map((shop) => (
              <button
                key={shop.id}
                type="button"
                className={`${styles.item} ${shop.id === activeShop?.id ? styles.itemActive : ""}`.trim()}
                onClick={() => setActiveShopId(shop.id)}
              >
                <strong>{shop.name}</strong>
                <span>{shop.address}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.editorCard}>
          {activeShop ? (
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.metaRow}>
                <span>ID: {activeShop.id}</span>
                <span>上传者：{activeShop.creator_name}</span>
              </div>
              <label>
                <span>店名</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>别名</span>
                <input value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} />
              </label>
              <label>
                <span>地址</span>
                <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
              </label>
              <label>
                <span>推荐理由</span>
                <textarea rows={4} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
              </label>
              <label>
                <span>封面图 URL（留空则清空）</span>
                <input value={form.cover_image_url} onChange={(event) => setForm((current) => ({ ...current, cover_image_url: event.target.value }))} />
              </label>
              <label>
                <span>状态</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="active">active，前台可见</option>
                  <option value="pending">pending，前台暂时可见但待审核</option>
                  <option value="hidden">hidden，前台隐藏</option>
                </select>
              </label>
              <div className={styles.coordRow}>
                <label>
                  <span>纬度</span>
                  <input value={form.lat} onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))} />
                </label>
                <label>
                  <span>经度</span>
                  <input value={form.lng} onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))} />
                </label>
              </div>
              <div className={styles.actionRow}>
                <button type="submit" className={styles.button} disabled={saving}>
                  {saving ? "保存中..." : "保存修改"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={async () => {
                    if (!activeShop) return;
                    setSaving(true);
                    try {
                      const updated = await updateShopDetails(activeShop.id, { status: "hidden" });
                      setShops((current) => current.map((shop) => (shop.id === updated.id ? updated : shop)));
                      setFeedback("已隐藏这条店铺，前台不会再展示。");
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "unknown_hide_error";
                      setFeedback(`隐藏失败：${message}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  立即隐藏
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={async () => {
                    if (!activeShop) return;
                    const confirmed = window.confirm(`确认彻底删除「${activeShop.name}」吗？这个动作不可恢复。`);
                    if (!confirmed) return;
                    setSaving(true);
                    try {
                      await deleteShop(activeShop.id);
                      setShops((current) => current.filter((shop) => shop.id !== activeShop.id));
                      setActiveShopId("");
                      setFeedback("店铺已删除。");
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "unknown_delete_error";
                      setFeedback(`删除失败：${message}`);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  彻底删除
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.empty}>先从左边选一家店。</div>
          )}
          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </section>
      </section>
    </main>
  );
}
