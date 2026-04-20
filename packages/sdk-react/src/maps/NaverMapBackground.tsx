import React, { useEffect, useMemo, useRef } from "react";
import { buildNaverMapScriptUrl, createNaverMapOptions, type NaverMapOptions } from "./naver-map-config.js";

function ensureNaverMapsScript({ naverMapClientId, callbackName }: { naverMapClientId: string; callbackName: string }) {
  if (globalThis.window?.naver?.maps) {
    return Promise.resolve(globalThis.window.naver.maps);
  }

  return new Promise<typeof globalThis.window.naver.maps>((resolve, reject) => {
    const existingScript = globalThis.document?.querySelector("script[data-sdk='naver-maps']");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(globalThis.window?.naver?.maps!));
      existingScript.addEventListener("error", () => reject(new Error("Failed to load NAVER Maps script")));
      return;
    }

    globalThis.window[callbackName] = () => {
      resolve(globalThis.window?.naver?.maps!);
      delete globalThis.window[callbackName];
    };

    const script = globalThis.document.createElement("script");
    script.dataset.sdk = "naver-maps";
    script.async = true;
    script.src = buildNaverMapScriptUrl({ naverMapClientId, callbackName });
    script.onerror = () => {
      reject(new Error("Failed to load NAVER Maps script"));
      delete globalThis.window[callbackName];
    };
    globalThis.document.head.appendChild(script);
  });
}

export interface NaverMapBackgroundProps {
  naverMapClientId: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapReady?: (map: unknown) => void;
  onError?: (error: Error) => void;
}

export function NaverMapBackground({ naverMapClientId, center, zoom, onMapReady, onError }: NaverMapBackgroundProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const callbackName = useMemo(
    () => `__webCadNaverMapsReady_${Math.random().toString(36).slice(2)}`,
    []
  );

  useEffect(() => {
    let cancelled = false;

    void ensureNaverMapsScript({ naverMapClientId, callbackName })
      .then((naverMaps) => {
        if (cancelled || !mapElementRef.current || !naverMaps) return;

        const options = createNaverMapOptions({ center, zoom });
        const map = new naverMaps.Map(mapElementRef.current, {
          center: new naverMaps.LatLng(options.center!.lat, options.center!.lng),
          zoom: options.zoom,
          mapTypeId: naverMaps.MapTypeId[options.mapTypeId as string],
          scaleControl: options.scaleControl,
          logoControl: options.logoControl,
          mapDataControl: options.mapDataControl
        });
        mapRef.current = map;
        onMapReady?.(map);
      })
      .catch((error) => {
        if (!cancelled) {
          onError?.(error as Error);
        }
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, [callbackName, center, naverMapClientId, onError, onMapReady, zoom]);

  return React.createElement("div", {
    ref: mapElementRef,
    className: "cad-editor-map-background",
    "aria-hidden": true,
    style: { position: "absolute", inset: 0, zIndex: 0 }
  });
}
