export type VoteType = "good" | "bad";

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cover_image_url: string;
  reason: string;
  creator_name: string;
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
