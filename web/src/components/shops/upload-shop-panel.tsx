"use client";

import { useMemo, useState } from "react";
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
}

const DEFAULT_LAT = 34.2044;
const DEFAULT_LNG = 117.28565;

export function UploadShopPanel({ onCreateShop }: UploadShopPanelProps) {
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
          先不依赖真实地图选点。上传时默认落在徐州市中心，后面再补地理编码和地图点选。
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
          <span>后面再接地图选点和地址解析</span>
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
