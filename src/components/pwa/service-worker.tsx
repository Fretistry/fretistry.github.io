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
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {
        // Offline support is a bonus; the app works fine without it.
      });
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }
  }, []);
  return null;
}
