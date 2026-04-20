export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  zoom: number;
  pan: Point;
  center?: Point;
}

const SYNC_ENABLED_VIEW_MODES = ["2d-cad"];

export function toNaverMapOptions(viewport: Viewport) {
  const naverZoom = Math.max(1, Math.min(21, Math.round(Math.log2(viewport.zoom) + 15)));

  return {
    center: viewport.center,
    zoom: naverZoom
  };
}

export function mapCenterToCadPoint(latLng: { lat: number; lng: number }, mapOrigin: Point): Point {
  return {
    x: latLng.lng - mapOrigin.x,
    y: latLng.lat - mapOrigin.y
  };
}

export function cadPointToMapCenter(cadPoint: Point, mapOrigin: Point) {
  return {
    lat: cadPoint.y + mapOrigin.y,
    lng: cadPoint.x + mapOrigin.x
  };
}

export function cadZoomToMapLevel(cadZoom: number): number {
  return Math.max(1, Math.min(21, Math.round(Math.log2(cadZoom) + 15)));
}

export function mapLevelToCadZoom(mapLevel: number): number {
  return Math.pow(2, mapLevel - 15);
}

export function isSyncEnabled(viewMode: string): boolean {
  return SYNC_ENABLED_VIEW_MODES.includes(viewMode);
}

export interface NaverMapRef {
  current: {
    setCenter: (latLng: unknown) => void;
    setZoom: (zoom: number) => void;
    getCenter: () => { lat: () => number; lng: () => number };
    getZoom: () => number;
  } | null;
}

export function syncViewToMap(mapRef: NaverMapRef, viewport: Viewport, mapOrigin: Point) {
  if (!mapRef?.current) return;

  const center = cadPointToMapCenter(viewport.pan, mapOrigin);
  const zoom = cadZoomToMapLevel(viewport.zoom);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NaverLatLng = (globalThis as any)?.naver?.maps?.LatLng;
  if (NaverLatLng) {
    mapRef.current.setCenter(new NaverLatLng(center.lat, center.lng));
  }
  mapRef.current.setZoom(zoom);
}

export function syncMapToView(mapRef: NaverMapRef, mapOrigin: Point) {
  if (!mapRef?.current) return () => { };

  const listener = () => {
    const mapCenter = mapRef.current!.getCenter();
    const mapZoom = mapRef.current!.getZoom();

    return {
      pan: mapCenterToCadPoint({ lat: mapCenter.lat(), lng: mapCenter.lng() }, mapOrigin),
      zoom: mapLevelToCadZoom(mapZoom)
    };
  };

  const handleChange = () => listener();
  return handleChange;
}

export function subscribeToMapEvents(mapRef: NaverMapRef, onViewChange: (view: { pan: Point; zoom: number }) => void) {
  if (!mapRef?.current || !onViewChange) return () => { };

  const map = mapRef.current;

  const handleChange = () => {
    const center = map!.getCenter();
    const zoom = map!.getZoom();
    onViewChange({
      pan: mapCenterToCadPoint({ lat: center.lat(), lng: center.lng() }, { x: 0, y: 0 }),
      zoom: mapLevelToCadZoom(zoom)
    });
  };

  return () => { };
}
