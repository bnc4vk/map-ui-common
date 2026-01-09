const DEFAULT_ACCESS_TOKENS = {
  localhost:
    "pk.eyJ1IjoiYm5jNHZrIiwiYSI6ImNtZmtuNzExZTBma2YyaXB5N2V3cnNqZHYifQ.81pi_QteF8dXpaLdAgAcbA",
  default:
    "pk.eyJ1IjoiYm5jNHZrIiwiYSI6ImNtZmttd2l0NDBlcmgybXB6engyZ3NsOXMifQ.ispasH40DZiTItGPC7EuQQ",
};

const DEFAULT_MAP_CENTER = {
  mobile: [-40, 20],
  desktop: [10, 20],
};

const DEFAULT_ZOOM_LEVEL = {
  mobile: 0.8,
  desktop: 1.3,
};

const DEFAULT_MOBILE_BREAKPOINT = 500;

export function getMapConfig({
  hostname = window.location.hostname,
  innerWidth = window.innerWidth,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  accessToken,
  mapCenter,
  zoomLevel,
  accessTokens = {},
  mapCenters = {},
  zoomLevels = {},
} = {}) {
  const isLocalhost = hostname === "localhost";
  const isMobile = innerWidth <= mobileBreakpoint;

  const resolvedAccessToken =
    accessToken ??
    (isLocalhost
      ? accessTokens.localhost ?? DEFAULT_ACCESS_TOKENS.localhost
      : accessTokens.default ?? DEFAULT_ACCESS_TOKENS.default);

  const resolvedMapCenter =
    mapCenter ??
    (isMobile
      ? mapCenters.mobile ?? DEFAULT_MAP_CENTER.mobile
      : mapCenters.desktop ?? DEFAULT_MAP_CENTER.desktop);

  const resolvedZoomLevel =
    zoomLevel ??
    (isMobile
      ? zoomLevels.mobile ?? DEFAULT_ZOOM_LEVEL.mobile
      : zoomLevels.desktop ?? DEFAULT_ZOOM_LEVEL.desktop);

  return {
    accessToken: resolvedAccessToken,
    mapCenter: resolvedMapCenter,
    zoomLevel: resolvedZoomLevel,
  };
}
