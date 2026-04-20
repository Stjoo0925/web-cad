import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNaverMapScriptUrl,
  createNaverMapOptions,
  shouldEnableNaverMapBackground
} from "../packages/sdk-react/src/maps/naver-map-config.ts";

test("enables naver map only for 2d cad mode with a client id", () => {
  assert.equal(
    shouldEnableNaverMapBackground({
      viewMode: "2d-cad",
      mapProvider: "naver",
      naverMapClientId: "client-id"
    }),
    true
  );

  assert.equal(
    shouldEnableNaverMapBackground({
      viewMode: "pointcloud-3d",
      mapProvider: "naver",
      naverMapClientId: "client-id"
    }),
    false
  );

  assert.equal(
    shouldEnableNaverMapBackground({
      viewMode: "2d-cad",
      mapProvider: "naver",
      naverMapClientId: ""
    }),
    false
  );
});

test("builds the official naver maps script url with client id and callback", () => {
  const scriptUrl = buildNaverMapScriptUrl({
    naverMapClientId: "demo-client",
    callbackName: "__naverReady__",
    submodules: ["geocoder"]
  });

  assert.equal(
    scriptUrl,
    "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=demo-client&submodules=geocoder&callback=__naverReady__"
  );
});

test("creates stable naver map options for 2d cad background mode", () => {
  const options = createNaverMapOptions({
    center: { lat: 37.3595704, lng: 127.105399 },
    zoom: 16
  });

  assert.deepEqual(options, {
    center: { lat: 37.3595704, lng: 127.105399 },
    zoom: 16,
    mapTypeId: "NORMAL",
    scaleControl: false,
    logoControl: false,
    mapDataControl: false
  });
});
