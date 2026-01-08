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

function createFillColorUpdater(map, { baseLayer, overlayLayer, fadeDurationMs }) {
  let displayedLayerIsBase = true;

  return function updateFillColors({
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
  };
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

  const updateFillColors = createFillColorUpdater(map, {
    baseLayer,
    overlayLayer,
    fadeDurationMs,
  });

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

  return { map, updateFillColors };
}

function resolveLevelId(levels, zoom, fallbackId) {
  const matchedLevel = levels.find(
    (level) =>
      (level.minZoom === undefined || zoom >= level.minZoom) &&
      (level.maxZoom === undefined || zoom < level.maxZoom)
  );

  return matchedLevel?.id || fallbackId || levels[0]?.id;
}

export function createLevelAwareMap({
  containerId,
  mapStyle,
  center,
  zoom,
  projection = "mercator",
  levels,
  onLevelChange,
  onFeatureClick,
  onFeatureHover,
}) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("createLevelAwareMap requires a non-empty levels array.");
  }

  const initialLevelId = resolveLevelId(levels, zoom, levels[0].id);
  const initialLevel = levels.find((level) => level.id === initialLevelId);

  if (!initialLevel) {
    throw new Error("Initial level config not found.");
  }

  const { map } = createMap({
    containerId,
    mapStyle,
    center,
    zoom,
    projection,
    vectorSourceConfig: initialLevel.vectorSourceConfig,
    layerConfig: initialLevel.layerConfig,
    onFeatureClick,
    onFeatureHover,
  });

  const levelConfigs = new Map(
    levels.map((level) => [
      level.id,
      {
        ...level,
        updateFillColors: createFillColorUpdater(map, level.layerConfig),
      },
    ])
  );

  let activeLevelId = initialLevelId;

  map.on("load", () => {
    levels.forEach((level) => {
      if (level.id === initialLevelId) {
        return;
      }

      const { id: sourceId, source } = level.vectorSourceConfig;
      map.addSource(sourceId, source);

      map.addLayer({
        ...level.layerConfig.baseLayer,
        source: sourceId,
        layout: {
          ...level.layerConfig.baseLayer.layout,
          visibility: "none",
        },
      });

      map.addLayer(
        {
          ...level.layerConfig.overlayLayer,
          source: sourceId,
          layout: {
            ...level.layerConfig.overlayLayer.layout,
            visibility: "none",
          },
        },
        level.layerConfig.baseLayer.id
      );
    });
  });

  function setLevel(levelId) {
    if (!levelConfigs.has(levelId)) {
      throw new Error(`Unknown levelId: ${levelId}`);
    }

    if (activeLevelId === levelId) {
      return;
    }

    levels.forEach((level) => {
      const visibility = level.id === levelId ? "visible" : "none";
      map.setLayoutProperty(
        level.layerConfig.baseLayer.id,
        "visibility",
        visibility
      );
      map.setLayoutProperty(
        level.layerConfig.overlayLayer.id,
        "visibility",
        visibility
      );
    });

    activeLevelId = levelId;
    onLevelChange?.(levelId);
  }

  function updateLevelFillColors(levelId, options) {
    const levelConfig = levelConfigs.get(levelId);
    if (!levelConfig) {
      throw new Error(`Unknown levelId: ${levelId}`);
    }

    levelConfig.updateFillColors(options);
  }

  return {
    map,
    getCurrentLevelId: () => activeLevelId,
    resolveLevelId: (nextZoom) =>
      resolveLevelId(levels, nextZoom, activeLevelId),
    setLevel,
    updateLevelFillColors,
  };
}
