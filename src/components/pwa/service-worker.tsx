"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/site";

/**
 * Registers the offline service worker in production builds. During local
 * development any previously installed worker is removed so it can never
 * serve stale files while editing.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      // The release name in the address makes each release install afresh and clear the previous
      // release's files from the visitor's browser (they'd otherwise pile up).
      const version = encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_ID ?? "1");
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js?v=${version}`, { scope: `${BASE_PATH}/` }).catch(() => {
        // Offline support is a bonus; the app works fine without it.
      });
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }
  }, []);
  return null;
}
