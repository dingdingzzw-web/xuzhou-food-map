export type VoteType = "good" | "bad";

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  cover_image_url?: string | null;
  reason: string;
  creator_name: string;
  alias?: string | null;
  good_count: number;
  bad_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopImage {
  id: string;
  shop_id: string;
  image_url: string;
  uploader_name: string;
  created_at?: string;
}

export interface ShopUpdateInput {
  name?: string;
  address?: string;
  reason?: string;
  alias?: string;
  cover_image_url?: string | null;
  lat?: number | null;
  lng?: number | null;
}
