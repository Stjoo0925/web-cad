export function shouldEnableNaverMapBackground({
  viewMode,
  mapProvider,
  naverMapClientId
}) {
  return viewMode === "2d-cad" && mapProvider === "naver" && Boolean(naverMapClientId);
}

export function buildNaverMapScriptUrl({
  naverMapClientId,
  callbackName,
  submodules = []
}) {
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
} = {}) {
  return {
    center,
    zoom,
    mapTypeId,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false
  };
}
