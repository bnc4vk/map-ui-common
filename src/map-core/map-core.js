const DEFAULT_FADE_DURATION_MS = 2000;

function hideSymbolLabels(map) {
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
}

function buildMatchExpression({
  colorMap,
  defaultColor,
  featureProperty,
  featureTransform,
}) {
  const entries = Object.entries(colorMap || {}).flatMap(([code, color]) => [
    code,
    color,
  ]);

  const baseExpression = ["get", featureProperty];
  let matchExpression = baseExpression;
  if (featureTransform === null) {
    matchExpression = baseExpression;
  } else if (typeof featureTransform === "function") {
    matchExpression = featureTransform(baseExpression);
  } else if (featureTransform) {
    matchExpression = featureTransform;
  } else if (featureProperty === "iso_3166_1") {
    matchExpression = ["slice", baseExpression, 0, 2];
  }

  return [
    "match",
    matchExpression,
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
  const {
    baseLayer,
    overlayLayer,
    interactionLayerId,
    fadeDurationMs,
    levels,
  } = layerConfig;

  const resolvedLevels =
    levels?.length > 0
      ? levels.map((level) => {
          const levelLayerIds = level.layerIds || {};
          const baseId = levelLayerIds.base || `${level.id}-base`;
          const overlayId = levelLayerIds.overlay || `${level.id}-overlay`;
          return {
            ...level,
            layerIds: {
              base: baseId,
              overlay: overlayId,
              interaction:
                levelLayerIds.interaction ||
                levelLayerIds.overlay ||
                overlayId ||
                baseId,
            },
          };
        })
      : [
          {
            id: "default",
            featureProperty: layerConfig.featureProperty,
            layerIds: {
              base: baseLayer.id,
              overlay: overlayLayer.id,
              interaction:
                interactionLayerId || overlayLayer.id || baseLayer.id,
            },
          },
        ];

  const levelDisplayStates = new Map(
    resolvedLevels.map((level) => [level.id, true])
  );
  let activeLevelId = resolvedLevels[0]?.id;

  const getLevelIdForZoom = (zoomLevel) => {
    const matchedLevel = resolvedLevels.find((level) => {
      const minZoom = level.minZoom ?? -Infinity;
      const maxZoom = level.maxZoom ?? Infinity;
      return zoomLevel >= minZoom && zoomLevel <= maxZoom;
    });
    return matchedLevel?.id || resolvedLevels[0]?.id;
  };

  map.on("load", () => {
    map.addSource(sourceId, source);

    resolvedLevels.forEach((level) => {
      const minZoom = level.minZoom ?? baseLayer.minzoom;
      const maxZoom = level.maxZoom ?? baseLayer.maxzoom;

      map.addLayer({
        ...baseLayer,
        id: level.layerIds.base,
        minzoom: minZoom,
        maxzoom: maxZoom,
        source: sourceId,
      });

      map.addLayer(
        {
          ...overlayLayer,
          id: level.layerIds.overlay,
          minzoom: minZoom,
          maxzoom: maxZoom,
          source: sourceId,
        },
        level.layerIds.base
      );
    });

    const targetLayerIds = Array.from(
      new Set(
        resolvedLevels
          .map((level) => level.layerIds.interaction)
          .filter(Boolean)
      )
    );

    if (onFeatureClick) {
      targetLayerIds.forEach((layerId) => {
        map.on("click", layerId, (event) => {
          onFeatureClick({
            feature: event.features?.[0],
            features: event.features,
            lngLat: event.lngLat,
            point: event.point,
            originalEvent: event.originalEvent,
            event,
          });
        });
      });
    }

    if (onFeatureHover) {
      targetLayerIds.forEach((layerId) => {
        map.on("mousemove", layerId, (event) => {
          onFeatureHover({
            feature: event.features?.[0],
            features: event.features,
            lngLat: event.lngLat,
            point: event.point,
            originalEvent: event.originalEvent,
            event,
          });
        });
      });
    }

    activeLevelId = getLevelIdForZoom(map.getZoom());
  });

  map.on("zoom", () => {
    activeLevelId = getLevelIdForZoom(map.getZoom());
  });

  function updateFillColors({
    colorExpression,
    colorMap,
    defaultColor = "#666666",
    featureProperty,
    featureTransform,
    opacity = 0.8,
    levelId,
  }) {
    const resolvedLevelId =
      levelId ||
      resolvedLevels.find((level) => level.featureProperty === featureProperty)
        ?.id ||
      activeLevelId;
    const level =
      resolvedLevels.find((levelToMatch) => levelToMatch.id === resolvedLevelId) ||
      resolvedLevels[0];

    const resolvedFeatureProperty =
      featureProperty ?? level.featureProperty ?? "iso_3166_1";
    const resolvedFeatureTransform =
      featureTransform ?? level.featureTransform;

    const resolvedExpression =
      colorExpression ||
      buildMatchExpression({
        colorMap,
        defaultColor,
        featureProperty: resolvedFeatureProperty,
        featureTransform: resolvedFeatureTransform,
      });

    const displayedLayerIsBase = levelDisplayStates.get(level.id) ?? true;
    const layerToHide = displayedLayerIsBase
      ? level.layerIds.base
      : level.layerIds.overlay;
    const layerToShow = displayedLayerIsBase
      ? level.layerIds.overlay
      : level.layerIds.base;
    levelDisplayStates.set(level.id, !displayedLayerIsBase);

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
