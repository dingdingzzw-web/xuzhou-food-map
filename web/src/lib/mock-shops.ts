import type { Shop } from "@/types/shop";

export const mockShops: Shop[] = [
  {
    id: "1",
    name: "老味地锅鸡",
    address: "徐州市云龙区示例路 18 号",
    lat: 34.261,
    lng: 117.191,
    cover_image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    reason: "锅气足，酱香浓，适合三五个人一起冲。",
    creator_name: "阿杜",
    good_count: 28,
    bad_count: 3,
  },
  {
    id: "2",
    name: "二厂把子肉",
    address: "徐州市鼓楼区示例街 66 号",
    lat: 34.287,
    lng: 117.185,
    cover_image_url:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    reason: "把子肉软烂入味，配米饭很顶。",
    creator_name: "小周",
    good_count: 41,
    bad_count: 5,
  },
  {
    id: "3",
    name: "彭城烧烤摊",
    address: "徐州市泉山区示例巷 9 号",
    lat: 34.247,
    lng: 117.145,
    cover_image_url:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    reason: "晚上氛围特别好，烤串和辣汤都很有本地味。",
    creator_name: "面包",
    good_count: 35,
    bad_count: 7,
  },
];
