const DEFAULT_FADE_DURATION_MS = 2000;

function hideSymbolLabels(map) {
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
}

function buildMatchExpression({ colorMap, defaultColor, featureProperty }) {
  const entries = Object.entries(colorMap || {}).flatMap(([code, color]) => [
    code,
    color,
  ]);

  return [
    "match",
    ["slice", ["get", featureProperty], 0, 2],
    ...entries,
    defaultColor,
  ];
}

export function createMap({
  containerId,
  mapStyle,
  center,
  zoom,
  projection = "mercator",
  vectorSourceConfig,
  layerConfig,
  onFeatureClick,
  onFeatureHover,
}) {
  if (!vectorSourceConfig?.id || !vectorSourceConfig?.source) {
    throw new Error("vectorSourceConfig requires id and source.");
  }

  if (!layerConfig?.baseLayer || !layerConfig?.overlayLayer) {
    throw new Error("layerConfig requires baseLayer and overlayLayer.");
  }

  const map = new mapboxgl.Map({
    container: containerId,
    style: mapStyle,
    center,
    zoom,
    projection,
  });

  map.addControl(new mapboxgl.NavigationControl());

  map.on("style.load", () => {
    hideSymbolLabels(map);
  });

  const { id: sourceId, source } = vectorSourceConfig;
  const { baseLayer, overlayLayer, interactionLayerId, fadeDurationMs } =
    layerConfig;

  let displayedLayerIsBase = true;

  map.on("load", () => {
    map.addSource(sourceId, source);

    map.addLayer({
      ...baseLayer,
      source: sourceId,
    });

    map.addLayer(
      {
        ...overlayLayer,
        source: sourceId,
      },
      baseLayer.id
    );

    const targetLayerId =
      interactionLayerId || overlayLayer.id || baseLayer.id;

    if (onFeatureClick) {
      map.on("click", targetLayerId, (event) => {
        onFeatureClick({
          feature: event.features?.[0],
          features: event.features,
          lngLat: event.lngLat,
          point: event.point,
          originalEvent: event.originalEvent,
          event,
        });
      });
    }

    if (onFeatureHover) {
      map.on("mousemove", targetLayerId, (event) => {
        onFeatureHover({
          feature: event.features?.[0],
          features: event.features,
          lngLat: event.lngLat,
          point: event.point,
          originalEvent: event.originalEvent,
          event,
        });
      });
    }
  });

  function updateFillColors({
    colorExpression,
    colorMap,
    defaultColor = "#666666",
    featureProperty = "iso_3166_1",
    opacity = 0.8,
  }) {
    const resolvedExpression =
      colorExpression ||
      buildMatchExpression({
        colorMap,
        defaultColor,
        featureProperty,
      });

    const layerToHide = displayedLayerIsBase ? baseLayer.id : overlayLayer.id;
    const layerToShow = displayedLayerIsBase ? overlayLayer.id : baseLayer.id;
    displayedLayerIsBase = !displayedLayerIsBase;

    map.setPaintProperty(layerToShow, "fill-color", resolvedExpression);

    map.setPaintProperty(layerToHide, "fill-opacity-transition", {
      duration: fadeDurationMs ?? DEFAULT_FADE_DURATION_MS,
      delay: 0,
    });
    map.setPaintProperty(layerToHide, "fill-opacity", 0);

    map.setPaintProperty(layerToShow, "fill-opacity-transition", {
      duration: fadeDurationMs ?? DEFAULT_FADE_DURATION_MS,
      delay: 0,
    });
    map.setPaintProperty(layerToShow, "fill-opacity", opacity);
  }

  return { map, updateFillColors };
}
