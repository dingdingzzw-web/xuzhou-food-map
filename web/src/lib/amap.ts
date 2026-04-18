import { env, hasAmapEnv } from "@/lib/env";

let amapScriptLoadingPromise: Promise<void> | null = null;

export function loadAmapSdk() {
  if (!hasAmapEnv) {
    return Promise.reject(new Error("NEXT_PUBLIC_AMAP_KEY is missing"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("AMap can only load in browser"));
  }

  if (window.AMap) {
    return Promise.resolve();
  }

  if (amapScriptLoadingPromise) {
    return amapScriptLoadingPromise;
  }

  amapScriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${env.amapKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load AMap SDK"));
    document.head.appendChild(script);
  });

  return amapScriptLoadingPromise;
}
