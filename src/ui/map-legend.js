export const legendClassNames = {
  root: "legend",
  item: "legend-item",
  color: "legend-color",
  label: "legend-label",
};

export function createMapLegend({ statusColors: colors = statusColors } = {}) {
  const root = document.createElement("div");
  root.className = legendClassNames.root;

  Object.entries(colors).forEach(([status, color]) => {
    const item = document.createElement("div");
    item.className = legendClassNames.item;

    const colorBox = document.createElement("span");
    colorBox.className = legendClassNames.color;
    colorBox.style.backgroundColor = color;

    const label = document.createElement("span");
    label.className = legendClassNames.label;
    label.textContent = status;

    item.appendChild(colorBox);
    item.appendChild(label);
    root.appendChild(item);
  });

  return { root };
}
