const DEFAULT_COLORS = [
  "#eef2ff",
  "#c7d2fe",
  "#818cf8",
  "#4f46e5",
  "#312e81",
];

function getValues(counts) {
  return Object.values(counts || {}).map((value) => Number(value) || 0);
}

function buildStops(values, colorCount) {
  const max = Math.max(0, ...values);
  if (max === 0) {
    return [0, 1];
  }

  const step = max / (colorCount - 1);
  return Array.from({ length: colorCount }, (_, index) =>
    Math.round(step * index)
  );
}

function resolveColor(count, stops, colors) {
  for (let index = stops.length - 1; index >= 0; index -= 1) {
    if (count >= stops[index]) {
      return colors[index] || colors[colors.length - 1];
    }
  }
  return colors[0];
}

export function createFestivalDataAdapter({ levels, colors = DEFAULT_COLORS } = {}) {
  const levelConfig = new Map(
    (levels || []).map((level) => [level.id, level])
  );

  function toCountMap(response) {
    const entries = Array.isArray(response?.counts)
      ? response.counts
      : Array.isArray(response?.items)
      ? response.items
      : [];

    return entries.reduce((acc, item) => {
      const id = item.featureId ?? item.id ?? item.code;
      if (!id) {
        return acc;
      }
      acc[id] = Number(item.count ?? item.total ?? 0);
      return acc;
    }, {});
  }

  function buildColorMap({ levelId, counts }) {
    const values = getValues(counts);
    const stops = buildStops(values, colors.length);

    const colorMap = Object.entries(counts || {}).reduce(
      (acc, [featureId, value]) => {
        acc[featureId] = resolveColor(Number(value) || 0, stops, colors);
        return acc;
      },
      {}
    );

    return {
      colorMap,
      stops,
      colors,
      featureProperty: levelConfig.get(levelId)?.featureProperty,
    };
  }

  return {
    toCountMap,
    buildColorMap,
  };
}
