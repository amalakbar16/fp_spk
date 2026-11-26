"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "spk_weight_source";
const SYNC_EVENT = "spk-weight-source-change";

function normalizeWeightSourceKey(raw?: string | null): string {
  const trimmed = raw?.trim() || "";
  if (!trimmed || trimmed.toLowerCase() === "custom") {
    return "average";
  }
  return trimmed;
}

function subscribe(callback: () => void) {
  const handleEvent = () => callback();
  window.addEventListener(SYNC_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);
  window.addEventListener("popstate", handleEvent);
  return () => {
    window.removeEventListener(SYNC_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
    window.removeEventListener("popstate", handleEvent);
  };
}

function getSnapshot(): string {
  const params = new URLSearchParams(window.location.search);
  const urlSource = params.get("source");
  if (urlSource !== null) {
    return normalizeWeightSourceKey(urlSource);
  }
  return normalizeWeightSourceKey(window.localStorage.getItem(STORAGE_KEY));
}

function getServerSnapshot(): string {
  return "average";
}

function subscribeHydration() {
  return () => {};
}

export function useWeightSource() {
  const sourceKey = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );

  const setSourceKey = useCallback((nextKey: string) => {
    const clean = normalizeWeightSourceKey(nextKey);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, clean);
      const url = new URL(window.location.href);
      if (url.searchParams.has("source")) {
        url.searchParams.delete("source");
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(null, "", nextUrl);
      }
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    }
  }, []);

  return { sourceKey, setSourceKey, hydrated };
}
