export interface NaverMapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapTypeId?: string;
}

export interface NaverMapScriptOptions {
  naverMapClientId: string;
  callbackName?: string;
  submodules?: string[];
}

export function shouldEnableNaverMapBackground({
  viewMode,
  mapProvider,
  naverMapClientId
}: {
  viewMode: string;
  mapProvider: string | null;
  naverMapClientId: string | null;
}): boolean {
  return viewMode === "2d-cad" && mapProvider === "naver" && Boolean(naverMapClientId);
}

export function buildNaverMapScriptUrl({
  naverMapClientId,
  callbackName,
  submodules = []
}: NaverMapScriptOptions): string {
  const query = new URLSearchParams({
    ncpClientId: naverMapClientId
  });

  if (submodules.length > 0) {
    query.set("submodules", submodules.join(","));
  }

  if (callbackName) {
    query.set("callback", callbackName);
  }

  return `https://oapi.map.naver.com/openapi/v3/maps.js?${query.toString()}`;
}

export function createNaverMapOptions({
  center = { lat: 37.3595704, lng: 127.105399 },
  zoom = 16,
  mapTypeId = "NORMAL"
}: NaverMapOptions = {}): NaverMapOptions {
  return {
    center,
    zoom,
    mapTypeId,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false
  };
}
