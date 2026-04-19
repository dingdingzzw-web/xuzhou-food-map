import { env, hasAmapEnv } from "@/lib/env";

interface AmapGeocodeResponse {
  status?: string;
  info?: string;
  geocodes?: Array<{
    location?: string;
    formatted_address?: string;
  }>;
}

export async function geocodeAddress(address: string) {
  if (!hasAmapEnv) {
    throw new Error("missing_amap_key");
  }

  const query = new URLSearchParams({
    key: env.amapKey,
    address,
    city: "徐州",
    output: "JSON",
  });

  const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`amap_http_${response.status}`);
  }

  const data = (await response.json()) as AmapGeocodeResponse;

  if (data.status !== "1" || !data.geocodes?.length || !data.geocodes[0]?.location) {
    throw new Error(data.info || "amap_geocode_failed");
  }

  const [lngText, latText] = data.geocodes[0].location.split(",");
  const lng = Number(lngText);
  const lat = Number(latText);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("amap_geocode_invalid_location");
  }

  return {
    lat,
    lng,
    formattedAddress: data.geocodes[0].formatted_address || address,
  };
}
