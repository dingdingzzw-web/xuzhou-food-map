import type { Shop } from "@/types/shop";

function encode(text: string) {
  return encodeURIComponent(text);
}

export function buildAmapUrl(shop: Shop) {
  return `https://uri.amap.com/navigation?to=${shop.lng},${shop.lat},${encode(shop.name)}&src=xuzhou-food-map&coordinate=gaode&callnative=1`;
}

export function buildBaiduMapUrl(shop: Shop) {
  return `https://api.map.baidu.com/marker?location=${shop.lat},${shop.lng}&title=${encode(shop.name)}&content=${encode(shop.address)}&output=html&src=xuzhou-food-map`;
}

export function buildAppleMapsUrl(shop: Shop) {
  return `https://maps.apple.com/?ll=${shop.lat},${shop.lng}&q=${encode(shop.name)}`;
}

export function buildTencentMapUrl(shop: Shop) {
  return `https://apis.map.qq.com/uri/v1/marker?marker=coord:${shop.lat},${shop.lng};title:${encode(shop.name)};addr:${encode(shop.address)}&referer=xuzhou-food-map`;
}
