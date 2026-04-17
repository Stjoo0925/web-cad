import React, { useEffect, useMemo, useRef } from "react";

import {
  buildNaverMapScriptUrl,
  createNaverMapOptions
} from "./naver-map-config.js";

function ensureNaverMapsScript({ naverMapClientId, callbackName }) {
  if (globalThis.window?.naver?.maps) {
    return Promise.resolve(globalThis.window.naver.maps);
  }

  return new Promise((resolve, reject) => {
    const existingScript = globalThis.document?.querySelector("script[data-sdk='naver-maps']");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(globalThis.window?.naver?.maps));
      existingScript.addEventListener("error", () => reject(new Error("Failed to load NAVER Maps script")));
      return;
    }

    globalThis.window[callbackName] = () => {
      resolve(globalThis.window?.naver?.maps);
      delete globalThis.window[callbackName];
    };

    const script = globalThis.document.createElement("script");
    script.dataset.sdk = "naver-maps";
    script.async = true;
    script.src = buildNaverMapScriptUrl({
      naverMapClientId,
      callbackName
    });
    script.onerror = () => {
      reject(new Error("Failed to load NAVER Maps script"));
      delete globalThis.window[callbackName];
    };
    globalThis.document.head.appendChild(script);
  });
}

export function NaverMapBackground({
  naverMapClientId,
  center,
  zoom,
  onMapReady,
  onError
}) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const callbackName = useMemo(
    () => `__webCadNaverMapsReady_${Math.random().toString(36).slice(2)}`,
    []
  );

  useEffect(() => {
    let cancelled = false;

    void ensureNaverMapsScript({
      naverMapClientId,
      callbackName
    })
      .then((naverMaps) => {
        if (cancelled || !mapElementRef.current || !naverMaps) {
          return;
        }

        const options = createNaverMapOptions({ center, zoom });
        const map = new globalThis.window.naver.maps.Map(mapElementRef.current, {
          center: new globalThis.window.naver.maps.LatLng(options.center.lat, options.center.lng),
          zoom: options.zoom,
          mapTypeId: globalThis.window.naver.maps.MapTypeId[options.mapTypeId],
          scaleControl: options.scaleControl,
          logoControl: options.logoControl,
          mapDataControl: options.mapDataControl
        });
        mapRef.current = map;
        onMapReady?.(map);
      })
      .catch((error) => {
        if (!cancelled) {
          onError?.(error);
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
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 0
    }
  });
}
