"use client";

import { useEffect, useMemo, useState } from "react";
import type { Shop } from "@/types/shop";
import styles from "./upload-shop-panel.module.css";

export interface CreateShopInput {
  name: string;
  address: string;
  cover_image_url: string;
  reason: string;
  creator_name: string;
  lat: number;
  lng: number;
}

interface UploadShopPanelProps {
  onCreateShop?: (input: CreateShopInput) => Promise<Shop | null>;
  selectedCoords?: { lat: number; lng: number } | null;
}

const DEFAULT_LAT = 34.2044;
const DEFAULT_LNG = 117.28565;

export function UploadShopPanel({ onCreateShop, selectedCoords }: UploadShopPanelProps) {
  const [form, setForm] = useState<CreateShopInput>({
    name: "",
    address: "",
    cover_image_url: "",
    reason: "",
    creator_name: "",
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    if (!selectedCoords) return;
    setForm((current) => ({
      ...current,
      lat: Number(selectedCoords.lat.toFixed(6)),
      lng: Number(selectedCoords.lng.toFixed(6)),
    }));
  }, [selectedCoords]);

  const isValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
        form.address.trim() &&
        form.reason.trim() &&
        form.creator_name.trim(),
    );
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || !onCreateShop) return;

    setSubmitting(true);
    setFeedback("");

    try {
      const created = await onCreateShop({
        ...form,
        cover_image_url:
          form.cover_image_url.trim() ||
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      });

      if (created) {
        setFeedback("上传成功，这家店已经进地图了。");
        setForm({
          name: "",
          address: "",
          cover_image_url: "",
          reason: "",
          creator_name: "",
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
        });
      } else {
        setFeedback("这次没传上去，先检查 Supabase 配置。");
      }
    } catch (error) {
      console.error("[shops] create failed", error);
      setFeedback("上传失败了，稍后再试。\n如果你还没配 Supabase，也可能是这个原因。");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof CreateShopInput>(key: K, value: CreateShopInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className={styles.panel}>
      <div>
        <p className={styles.eyebrow}>上传一家店</p>
        <h2>先把数据闭环跑起来</h2>
        <p className={styles.desc}>
          现在已经可以直接在左侧地图上点击选点，先把店铺位置定准，再补图片上传和地址解析。
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>店名</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="比如，老味地锅鸡"
          />
        </label>

        <label className={styles.field}>
          <span>地址</span>
          <input
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="尽量写详细一点，后面好补坐标"
          />
        </label>

        <label className={styles.field}>
          <span>封面图链接（可先留空）</span>
          <input
            value={form.cover_image_url}
            onChange={(event) => updateField("cover_image_url", event.target.value)}
            placeholder="先支持 URL，后面再接真实图片上传"
          />
        </label>

        <label className={styles.field}>
          <span>推荐理由</span>
          <textarea
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            placeholder="说说你为什么推荐这家"
            rows={4}
          />
        </label>

        <label className={styles.field}>
          <span>上传者昵称</span>
          <input
            value={form.creator_name}
            onChange={(event) => updateField("creator_name", event.target.value)}
            placeholder="比如，阿杜"
          />
        </label>

        <div className={styles.coordRow}>
          <label className={styles.field}>
            <span>纬度</span>
            <input
              type="number"
              step="0.000001"
              value={form.lat}
              onChange={(event) => updateField("lat", Number(event.target.value))}
            />
          </label>

          <label className={styles.field}>
            <span>经度</span>
            <input
              type="number"
              step="0.000001"
              value={form.lng}
              onChange={(event) => updateField("lng", Number(event.target.value))}
            />
          </label>
        </div>

        <div className={styles.tips}>
          <span>默认坐标是徐州市中心</span>
          <span>点左侧地图可自动带入坐标</span>
          <span>{selectedCoords ? `当前选点：${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}` : "还没选点时也能先手填坐标"}</span>
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={!isValid || submitting || !onCreateShop}
        >
          {submitting ? "上传中..." : "上传一家店"}
        </button>

        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </form>
    </section>
  );
}
