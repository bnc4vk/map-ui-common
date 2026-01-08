import { createFestivalMap } from "../src/index.js";

const ACCESS_TOKEN =
  window.MAPBOX_ACCESS_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN";

if (window.mapboxgl) {
  window.mapboxgl.accessToken = ACCESS_TOKEN;
}

const sampleFeatureIds = {
  country: ["US", "CA", "MX", "BR", "FR", "DE", "IN", "JP", "AU"],
  state: ["US-CA", "US-TX", "US-NY", "CA-ON", "CA-QC"],
  city: ["US-CA", "US-TX", "US-NY"],
};

async function fetchCounts({ levelId }) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const ids = sampleFeatureIds[levelId] || [];

  return {
    counts: ids.map((featureId) => ({
      featureId,
      count: Math.round(Math.random() * 250),
    })),
  };
}

createFestivalMap({
  containerId: "festival-map",
  dateRangeContainer: "festival-date-range",
  legendContainer: "festival-legend",
  loadingContainer: "festival-loading",
  fetchCounts,
  initialDateRange: {
    start: "2024-01-01",
    end: "2024-12-31",
  },
});
