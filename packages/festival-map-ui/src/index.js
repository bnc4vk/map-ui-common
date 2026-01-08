import { createLevelAwareMap } from "map-ui-common/map-core";
import { createDateRange } from "map-ui-common/ui/date-range";
import "map-ui-common/ui/date-range.css";
import "map-ui-common/ui/shared-map-ui.css";
import "./styles.css";

import { createFestivalDataAdapter } from "./data-adapter.js";
import { createFestivalState } from "./state.js";
import { createLegend } from "./legend.js";

const DEFAULT_LEVELS = [
  {
    id: "country",
    minZoom: 0,
    maxZoom: 3.5,
    featureProperty: "iso_3166_1",
    vectorSourceConfig: {
      id: "festival-country-source",
      source: {
        type: "vector",
        url: "mapbox://mapbox.country-boundaries-v1",
      },
    },
    layerConfig: {
      baseLayer: {
        id: "festival-country-base",
        type: "fill",
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0.7,
        },
      },
      overlayLayer: {
        id: "festival-country-overlay",
        type: "fill",
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0,
        },
      },
    },
  },
  {
    id: "state",
    minZoom: 3.5,
    maxZoom: 6.5,
    featureProperty: "iso_3166_2",
    vectorSourceConfig: {
      id: "festival-state-source",
      source: {
        type: "vector",
        url: "mapbox://mapbox.boundaries-adm1-v3",
      },
    },
    layerConfig: {
      baseLayer: {
        id: "festival-state-base",
        type: "fill",
        "source-layer": "boundaries_admin_1",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0.7,
        },
      },
      overlayLayer: {
        id: "festival-state-overlay",
        type: "fill",
        "source-layer": "boundaries_admin_1",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0,
        },
      },
    },
  },
  {
    id: "city",
    minZoom: 6.5,
    maxZoom: 24,
    featureProperty: "iso_3166_2",
    vectorSourceConfig: {
      id: "festival-city-source",
      source: {
        type: "vector",
        url: "mapbox://mapbox.boundaries-adm2-v3",
      },
    },
    layerConfig: {
      baseLayer: {
        id: "festival-city-base",
        type: "fill",
        "source-layer": "boundaries_admin_2",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0.7,
        },
      },
      overlayLayer: {
        id: "festival-city-overlay",
        type: "fill",
        "source-layer": "boundaries_admin_2",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": 0,
        },
      },
    },
  },
];

function resolveElement(target) {
  if (!target) {
    return null;
  }
  if (typeof target === "string") {
    return document.getElementById(target);
  }
  return target;
}

function createLoadingIndicator() {
  const element = document.createElement("div");
  element.className = "festival-map-loading";
  element.textContent = "Loading festival counts…";

  return {
    element,
    setVisible: (visible) => {
      element.classList.toggle("is-visible", visible);
    },
  };
}

export function createFestivalMap({
  containerId = "map",
  mapStyle = "mapbox://styles/mapbox/light-v11",
  center = [0, 20],
  zoom = 1.5,
  projection = "mercator",
  levels = DEFAULT_LEVELS,
  dateRangeContainer,
  legendContainer,
  loadingContainer,
  fetchCounts,
  initialDateRange = { start: "", end: "" },
} = {}) {
  const state = createFestivalState({
    initialZoom: zoom,
    initialDateRange,
  });

  const dataAdapter = createFestivalDataAdapter({ levels });

  const {
    map,
    getCurrentLevelId,
    resolveLevelId,
    setLevel,
    updateLevelFillColors,
  } = createLevelAwareMap({
    containerId,
    mapStyle,
    center,
    zoom,
    projection,
    levels,
  });

  const dateRangeTarget = resolveElement(dateRangeContainer);
  const legendTarget = resolveElement(legendContainer);
  const loadingTarget = resolveElement(loadingContainer);

  const legend = createLegend();
  if (legendTarget) {
    legendTarget.append(legend.element);
  }

  const loadingIndicator = createLoadingIndicator();
  if (loadingTarget) {
    loadingTarget.append(loadingIndicator.element);
  }

  const dateRange = createDateRange({
    start: initialDateRange.start,
    end: initialDateRange.end,
    onChange: ({ start, end }) => {
      state.setDateRange({ start, end });
      refreshCounts();
    },
  });

  if (dateRangeTarget) {
    dateRangeTarget.append(dateRange.element);
  }

  let requestId = 0;

  async function refreshCounts() {
    if (!fetchCounts) {
      return;
    }

    const activeRequestId = (requestId += 1);
    const levelId = getCurrentLevelId();
    const levelConfig = levels.find((level) => level.id === levelId);
    const { dateRange: range } = state.getState();

    state.setPending(true);
    loadingIndicator.setVisible(true);

    try {
      const response = await fetchCounts({
        levelId,
        startDate: range.start,
        endDate: range.end,
      });

      if (activeRequestId !== requestId) {
        return;
      }

      const counts = dataAdapter.toCountMap(response);
      const { colorMap, stops, colors, featureProperty } =
        dataAdapter.buildColorMap({ levelId, counts });

      updateLevelFillColors(levelId, {
        colorMap,
        defaultColor: "#e2e8f0",
        featureProperty: featureProperty || levelConfig?.featureProperty,
      });

      legend.updateLegend({ stops, colors });
    } finally {
      if (activeRequestId === requestId) {
        state.setPending(false);
        loadingIndicator.setVisible(false);
      }
    }
  }

  map.on("load", () => {
    refreshCounts();
  });

  map.on("zoomend", () => {
    const nextZoom = map.getZoom();
    const nextLevelId = resolveLevelId(nextZoom);

    state.setZoom(nextZoom);

    if (nextLevelId !== getCurrentLevelId()) {
      setLevel(nextLevelId);
      refreshCounts();
    }
  });

  return {
    map,
    state,
    refreshCounts,
  };
}

export { DEFAULT_LEVELS };
