export function createLegend() {
  const container = document.createElement("div");
  container.className = "festival-map-legend";

  const title = document.createElement("div");
  title.className = "festival-map-legend__title";
  title.textContent = "Festival counts";

  const list = document.createElement("div");
  list.className = "festival-map-legend__list";

  container.append(title, list);

  function updateLegend({ stops, colors }) {
    list.innerHTML = "";
    if (!stops || !colors) {
      return;
    }

    stops.forEach((stop, index) => {
      const item = document.createElement("div");
      item.className = "festival-map-legend__item";

      const swatch = document.createElement("span");
      swatch.className = "festival-map-legend__swatch";
      swatch.style.backgroundColor = colors[index] || colors[colors.length - 1];

      const label = document.createElement("span");
      label.className = "festival-map-legend__label";
      const nextStop = stops[index + 1];
      label.textContent =
        nextStop === undefined ? `${stop}+` : `${stop} - ${nextStop}`;

      item.append(swatch, label);
      list.append(item);
    });
  }

  return { element: container, updateLegend };
}
