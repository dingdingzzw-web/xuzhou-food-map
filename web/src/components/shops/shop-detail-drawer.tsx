"use client";

import { useEffect, useState } from "react";
import { uploadShopImageFile } from "@/lib/storage";
import type { Shop, VoteType } from "@/types/shop";
import {
  buildAmapUrl,
  buildAppleMapsUrl,
  buildBaiduMapUrl,
  buildTencentMapUrl,
} from "@/lib/navigation";
import { hasShopCover, ShopCoverPlaceholder } from "@/lib/shop-cover";
import styles from "./shop-detail-drawer.module.css";

interface ShopDetailDrawerProps {
  shop: Shop;
  onVote?: (shopId: string, voteType: VoteType) => Promise<void>;
  onAddImage?: (shopId: string, imageUrl: string, uploaderName: string) => Promise<void>;
  onUpdateDetails?: (
    shopId: string,
    input: { address?: string; reason?: string; alias?: string },
  ) => Promise<void>;
}

export function ShopDetailDrawer({
  shop,
  onVote,
  onAddImage,
  onUpdateDetails,
}: ShopDetailDrawerProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploader, setImageUploader] = useState("");
  const [extraAddress, setExtraAddress] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [extraAlias, setExtraAlias] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submittingVote, setSubmittingVote] = useState<VoteType | null>(null);
  const [submittingImage, setSubmittingImage] = useState(false);
  const [submittingDetails, setSubmittingDetails] = useState(false);

  useEffect(() => {
    setImageFile(null);
    setImageUploader("");
    setExtraAddress(shop.address || "");
    setExtraReason(shop.reason || "");
    setExtraAlias(shop.alias || "");
    setFeedback("");
  }, [shop]);

  async function handleVote(voteType: VoteType) {
    if (!onVote) return;

    setSubmittingVote(voteType);
    setFeedback("");

    try {
      await onVote(shop.id, voteType);
      setFeedback(voteType === "good" ? "已记一票好次。" : "已记一票包次。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_vote_error";
      setFeedback(`投票失败：${message}`);
    } finally {
      setSubmittingVote(null);
    }
  }

  async function handleAddImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onAddImage) return;

    setSubmittingImage(true);
    setFeedback("");

    try {
      if (!imageFile) {
        throw new Error("missing_image_file");
      }

      const uploaded = await uploadShopImageFile(imageFile, shop.id);
      await onAddImage(shop.id, uploaded.publicUrl, imageUploader);
      setImageFile(null);
      setImageUploader("");
      setFeedback("补图已提交，这家店的封面会更新成新图片。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_add_image_error";
      setFeedback(`补图失败：${message}`);
    } finally {
      setSubmittingImage(false);
    }
  }

  async function handleUpdateDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onUpdateDetails) return;

    setSubmittingDetails(true);
    setFeedback("");

    try {
      await onUpdateDetails(shop.id, {
        address: extraAddress,
        reason: extraReason,
        alias: extraAlias,
      });
      setFeedback("商家补充信息已更新。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_update_error";
      if (message.startsWith("shop_not_found_or_not_updatable")) {
        setFeedback("补充信息失败，这家店当前不能被更新。大概率是数据库 RLS 还没放开 shops 的 update 策略。");
      } else {
        setFeedback(`补充信息失败：${message}`);
      }
    } finally {
      setSubmittingDetails(false);
    }
  }

  return (
    <aside className={styles.drawer}>
      <div className={styles.coverWrap}>
        {hasShopCover(shop) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cover} src={shop.cover_image_url!} alt={shop.name} />
        ) : (
          <ShopCoverPlaceholder />
        )}
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>今日想冲</p>
          <h2>{shop.name}</h2>
          {shop.alias?.trim() ? <p className={styles.alias}>别名：{shop.alias}</p> : null}
        </div>
        <div className={styles.votePills}>
          <span>好次 {shop.good_count}</span>
          <span>包次 {shop.bad_count}</span>
        </div>
      </div>

      <div className={styles.block}>
        <h3>地址</h3>
        <p>{shop.address}</p>
      </div>

      <div className={styles.block}>
        <h3>推荐理由</h3>
        <p>{shop.reason}</p>
      </div>

      <div className={styles.block}>
        <h3>上传者</h3>
        <p>{shop.creator_name}</p>
      </div>

      {!hasShopCover(shop) ? (
        <div className={styles.noticeBlock}>
          <h3>当前状态</h3>
          <p>这家店的位置和基础信息已经收录，但图片还没补齐。后续任何人都可以继续补图，慢慢把内容做完整。</p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => handleVote("good")}
          disabled={submittingVote !== null}
        >
          {submittingVote === "good" ? "提交中..." : "好次"}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => handleVote("bad")}
          disabled={submittingVote !== null}
        >
          {submittingVote === "bad" ? "提交中..." : "包次"}
        </button>
      </div>

      <form className={styles.inlineForm} onSubmit={handleAddImage}>
        <div className={styles.formHeader}>
          <h3>补一张图</h3>
          <span>直接选本地图片上传到云端</span>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
        />
        <input
          value={imageUploader}
          onChange={(event) => setImageUploader(event.target.value)}
          placeholder="你的昵称"
        />
        <button
          type="submit"
          className={styles.ghost}
          disabled={submittingImage || !imageFile || !imageUploader.trim()}
        >
          {submittingImage ? "上传中..." : "上传补图"}
        </button>
      </form>

      <form className={styles.inlineForm} onSubmit={handleUpdateDetails}>
        <div className={styles.formHeader}>
          <h3>补充商家信息</h3>
          <span>可补地址、推荐语、别名</span>
        </div>
        <input
          value={extraAlias}
          onChange={(event) => setExtraAlias(event.target.value)}
          placeholder="比如，当地人常叫法 / 老名字"
        />
        <input
          value={extraAddress}
          onChange={(event) => setExtraAddress(event.target.value)}
          placeholder="补充更完整的地址"
        />
        <textarea
          value={extraReason}
          onChange={(event) => setExtraReason(event.target.value)}
          placeholder="补充这家店为什么值得去"
          rows={4}
        />
        <button type="submit" className={styles.ghost} disabled={submittingDetails}>
          {submittingDetails ? "提交中..." : "更新商家信息"}
        </button>
      </form>

      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

      <div className={styles.navBlock}>
        <h3>打开导航</h3>
        <div className={styles.navLinks}>
          <a href={buildAmapUrl(shop)} target="_blank" rel="noreferrer">
            高德地图
          </a>
          <a href={buildBaiduMapUrl(shop)} target="_blank" rel="noreferrer">
            百度地图
          </a>
          <a href={buildAppleMapsUrl(shop)} target="_blank" rel="noreferrer">
            Apple 地图
          </a>
          <a href={buildTencentMapUrl(shop)} target="_blank" rel="noreferrer">
            腾讯地图
          </a>
        </div>
      </div>
    </aside>
  );
}
