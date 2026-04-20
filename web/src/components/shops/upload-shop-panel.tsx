"use client";

import { useEffect, useMemo, useState } from "react";
import { hasAmapEnv } from "@/lib/env";
import { geocodeAddress } from "@/lib/geocode";
import type { Shop } from "@/types/shop";
import styles from "./upload-shop-panel.module.css";

export interface CreateShopInput {
  name: string;
  address: string;
  cover_image_url: string;
  reason: string;
  creator_name: string;
  lat: number | null;
  lng: number | null;
}

interface UploadShopPanelProps {
  onCreateShop?: (input: CreateShopInput) => Promise<Shop | null>;
  selectedCoords?: { lat: number; lng: number } | null;
  pickerEnabled?: boolean;
  onAutoLocate?: (coords: { lat: number; lng: number }) => void;
  onTogglePicker?: () => void;
}

const DEFAULT_LAT = 34.2044;
const DEFAULT_LNG = 117.28565;

export function UploadShopPanel({
  onCreateShop,
  selectedCoords,
  pickerEnabled = false,
  onAutoLocate,
  onTogglePicker,
}: UploadShopPanelProps) {
  const [form, setForm] = useState<CreateShopInput>({
    name: "",
    address: "",
    cover_image_url: "",
    reason: "",
    creator_name: "",
    lat: null,
    lng: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
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

  async function handleAutoLocate() {
    if (!form.address.trim()) {
      setFeedback("先填地址，我再帮你自动定位。");
      return;
    }

    if (!hasAmapEnv) {
      setFeedback("还没配置高德 Key，暂时不能自动定位。先直接提交地址，后面再补定位。");
      return;
    }

    setLocating(true);
    setFeedback("正在根据地址自动定位...");

    try {
      const result = await geocodeAddress(form.address.trim());
      setForm((current) => ({
        ...current,
        address: result.formattedAddress,
        lat: Number(result.lat.toFixed(6)),
        lng: Number(result.lng.toFixed(6)),
      }));
      onAutoLocate?.({ lat: result.lat, lng: result.lng });
      setFeedback("定位到了，地图已经跳过去了。");
    } catch (error) {
      console.error("[shops] geocode failed", error);
      const message = error instanceof Error ? error.message : "unknown_geocode_error";
      if (message.includes("INVALID_USER_KEY") || message.includes("10001")) {
        setFeedback("自动定位失败，当前高德 Key 无效。先直接提交地址，后面把 Vercel 里的 NEXT_PUBLIC_AMAP_KEY 换成可用 Web Key。");
      } else {
        setFeedback(`自动定位失败（${message}），你可以先直接提交地址。`);
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || !onCreateShop) return;

    setSubmitting(true);
    setFeedback("");

    try {
      const created = await onCreateShop({
        ...form,
        cover_image_url: form.cover_image_url.trim(),
      });

      if (created) {
        setFeedback("上传成功，这家店已经进地图了。");
        setForm({
          name: "",
          address: "",
          cover_image_url: "",
          reason: "",
          creator_name: "",
          lat: null,
          lng: null,
        });
      }
    } catch (error) {
      console.error("[shops] create failed", error);
      const message = error instanceof Error ? error.message : "unknown_create_error";

      if (message === "missing_supabase_env") {
        setFeedback("还没配 Supabase 环境变量，所以现在没法真写入。把 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 配到 Vercel 后再试。");
      } else {
        setFeedback(`上传失败：${message}`);
      }
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
        <h2>先上传店名和地址</h2>
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
          <div className={styles.addressRow}>
            <input
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="比如，云龙区 xxx 路 xx 号"
            />
            <button
              type="button"
              className={styles.locateButton}
              onClick={handleAutoLocate}
              disabled={locating}
            >
              {locating ? "定位中..." : "自动定位"}
            </button>
          </div>
        </label>

        <label className={styles.field}>
          <span>封面图链接（可先留空）</span>
          <input
            value={form.cover_image_url}
            onChange={(event) => updateField("cover_image_url", event.target.value)}
            placeholder="可先不传，后续再由其他人补图"
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

        {selectedCoords || (form.lat !== null && form.lng !== null) ? (
          <div className={styles.tips}>
            <span>地图上已显示当前定位</span>
          </div>
        ) : null}

        <button
          type="submit"
          className={styles.button}
          disabled={!isValid || submitting || locating || !onCreateShop}
        >
          {submitting ? "上传中..." : "上传一家店"}
        </button>

        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </form>
    </section>
  );
}
