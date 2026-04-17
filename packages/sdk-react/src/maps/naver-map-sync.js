/**
 * naver-map-sync.js
 * 네이버 지도와 CAD 뷰포트 간 양방향 동기화 모듈
 *
 * 2D CAD 모드에서 CAD 뷰포트( pan, zoom )와 NAVER 지도 배경의 중심/줌을 동기화합니다.
 * 3D/포인트클라우드 모드에서는 동기화가 비활성화됩니다.
 */

// 동기화가 활성화될 뷰 모드
const SYNC_ENABLED_VIEW_MODES = ["2d-cad"];

/**
 * CAD 뷰포트 상태를 NAVER 지도 옵션으로 변환합니다.
 *
 * @param {Object} viewport - CAD 뷰포트 상태
 * @param {number} viewport.zoom - 줌 배율 (1 = 100%)
 * @param {Object} viewport.pan - 팬 오프셋 { x, y }
 * @param {Object} viewport.center - CAD 세계 좌표 중심 (좌표계 변환 후)
 * @returns {Object} NAVER 지도 생성 옵션
 */
export function toNaverMapOptions(viewport) {
  // 줌 레벨 변환: CAD zoom 1.0 → NAVER 지도 줌 16 (기본값)
  // CAD zoom이 커질수록(더 확대될수록) NAVER 지도 줌도 커짐
  const naverZoom = Math.max(1, Math.min(21, Math.round(Math.log2(viewport.zoom) + 15)));

  return {
    center: viewport.center,
    zoom: naverZoom
  };
}

/**
 * NAVER 지도 중심을 CAD 세계 좌표로 변환합니다.
 *
 * @param {Object} latLng - NAVER 위경도 좌표 { lat, lng }
 * @param {Object} mapOrigin - CAD 현장 기준점 { x, y } (지도-현장 정합 기준점)
 * @returns {Object} CAD 세계 좌표 { x, y }
 */
export function mapCenterToCadPoint(latLng, mapOrigin) {
  return {
    x: latLng.lng - mapOrigin.x,
    y: latLng.lat - mapOrigin.y
  };
}

/**
 * CAD 중심점을 NAVER 지도 위경도로 변환합니다.
 *
 * @param {Object} cadPoint - CAD 세계 좌표 { x, y }
 * @param {Object} mapOrigin - CAD 현장 기준점 { x, y }
 * @returns {Object} NAVER 위경도 { lat, lng }
 */
export function cadPointToMapCenter(cadPoint, mapOrigin) {
  return {
    lat: cadPoint.y + mapOrigin.y,
    lng: cadPoint.x + mapOrigin.x
  };
}

/**
 * CAD 줌 배율을 NAVER 지도 줌 레벨로 변환합니다.
 *
 * @param {number} cadZoom - CAD 줌 배율
 * @returns {number} NAVER 지도 줌 레벨 (1~21)
 */
export function cadZoomToMapLevel(cadZoom) {
  // log2(zoom) + 15는 대략적인 변환 공식
  // zoom 1.0 → 레벨 15, zoom 2.0 → 레벨 16, zoom 0.5 → 레벨 14
  return Math.max(1, Math.min(21, Math.round(Math.log2(cadZoom) + 15)));
}

/**
 * NAVER 지도 줌 레벨을 CAD 줌 배율로 변환합니다.
 *
 * @param {number} mapLevel - NAVER 지도 줌 레벨 (1~21)
 * @returns {number} CAD 줌 배율
 */
export function mapLevelToCadZoom(mapLevel) {
  return Math.pow(2, mapLevel - 15);
}

/**
 * 현재 뷰 모드에서 지도 동기화가 활성화되어야 하는지 확인합니다.
 *
 * @param {string} viewMode - 뷰 모드 (예: "2d-cad", "3d", "point-cloud")
 * @returns {boolean} 동기화 활성화 여부
 */
export function isSyncEnabled(viewMode) {
  return SYNC_ENABLED_VIEW_MODES.includes(viewMode);
}

/**
 * CAD 뷰포트 변경 시 NAVER 지도 상태를 동기화합니다.
 *
 * @param {Object} mapRef - NAVER 지도 인스턴스 (ref.current)
 * @param {Object} viewport - CAD 뷰포트 상태
 * @param {Object} mapOrigin - 지도-현장 정합 기준점
 */
export function syncViewToMap(mapRef, viewport, mapOrigin) {
  if (!mapRef?.current) return;

  const center = cadPointToMapCenter(viewport.pan, mapOrigin);
  const zoom = cadZoomToMapLevel(viewport.zoom);

  mapRef.current.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
  mapRef.current.setZoom(zoom);
}

/**
 * NAVER 지도 이동/줌 시 CAD 뷰포트 상태를 동기화합니다.
 *
 * @param {Object} mapRef - NAVER 지도 인스턴스
 * @param {Object} mapOrigin - 지도-현장 정합 기준점
 * @returns {Function} 구독 해제 함수
 */
export function syncMapToView(mapRef, mapOrigin) {
  if (!mapRef?.current) return () => {};

  const listener = () => {
    const mapCenter = mapRef.current.getCenter();
    const mapZoom = mapRef.current.getZoom();

    const cadPoint = mapCenterToCadPoint(
      { lat: mapCenter.lat(), lng: mapCenter.lng() },
      mapOrigin
    );

    return { pan: cadPoint, zoom: mapLevelToCadZoom(mapZoom) };
  };

  // NAVER.maps.Event.addListener는 반환값이 remove 함수
  const handleChange = () => listener();
  return handleChange;
}

/**
 * 동기화를 위한 지도 이벤트 리스너를 등록합니다.
 *
 * @param {Object} mapRef - NAVER 지도 인스턴스
 * @param {Function} onViewChange - 뷰 상태 변경 시 호출될 콜백 ({ pan, zoom })
 */
export function subscribeToMapEvents(mapRef, onViewChange) {
  if (!mapRef?.current || !onViewChange) return () => {};

  const map = mapRef.current;

  // 지도 이동/줌 시 CAD 뷰 상태 업데이트
  const centerListener = window.naver.maps.Event.addListener(map, "dragend", () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    onViewChange({
      pan: mapCenterToCadPoint({ lat: center.lat(), lng: center.lng() }, { x: 0, y: 0 }),
      zoom: mapLevelToCadZoom(zoom)
    });
  });

  const zoomListener = window.naver.maps.Event.addListener(map, "zoom_changed", () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    onViewChange({
      pan: mapCenterToCadPoint({ lat: center.lat(), lng: center.lng() }, { x: 0, y: 0 }),
      zoom: mapLevelToCadZoom(zoom)
    });
  });

  // 구독 해제 함수 반환
  return () => {
    window.naver.maps.Event.removeListener(centerListener);
    window.naver.maps.Event.removeListener(zoomListener);
  };
}