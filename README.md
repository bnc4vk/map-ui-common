# Map UI Common

Shared UI building blocks for map-centric experiences: Mapbox map helpers plus reusable
UI elements (search tile, date range inputs, legend) and shared CSS tokens/layouts.

## Installation

```bash
npm install map-ui-common
```

## What it exports

```js
import { createMap, createLevelAwareMap } from "map-ui-common/map-core";
import { getMapConfig } from "map-ui-common/map-core/config";

import { createSearchTile, SearchTileController } from "map-ui-common/ui/search-tile";
import { createDateRange } from "map-ui-common/ui/date-range";
import { createMapLegend } from "map-ui-common/ui/map-legend";

import "map-ui-common/ui/shared-map-ui.css";
import "map-ui-common/ui/date-range.css";
```

## Quick start: render a simple page

This example shows a minimal page that renders a map, a search tile, and a legend
using `map-ui-common`.

> **Note**: `map-ui-common` expects `mapboxgl` to be available on `window`. If you
> import Mapbox GL JS as a module, assign it to `window.mapboxgl` before calling
> `createMap` or `createLevelAwareMap`.

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Map UI Common Demo</title>
  </head>
  <body>
    <div class="map-wrapper">
      <div class="map-aspect">
        <div id="map"></div>
      </div>
    </div>

    <div id="legend"></div>
    <div id="search"></div>

    <script type="module" src="./main.js"></script>
  </body>
</html>
```

### `main.js`

```js
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import "map-ui-common/ui/shared-map-ui.css";

import { createMap } from "map-ui-common/map-core";
import { createMapLegend } from "map-ui-common/ui/map-legend";
import { createSearchTile, SearchTileController } from "map-ui-common/ui/search-tile";

window.mapboxgl = mapboxgl;
mapboxgl.accessToken = "<YOUR_MAPBOX_ACCESS_TOKEN>";

const { map, updateFillColors } = createMap({
  containerId: "map",
  mapStyle: "mapbox://styles/mapbox/light-v10",
  center: [-98.5795, 39.8283],
  zoom: 3,
  vectorSourceConfig: {
    id: "countries",
    source: {
      type: "vector",
      url: "mapbox://your.tileset",
    },
  },
  layerConfig: {
    baseLayer: {
      id: "countries-base",
      type: "fill",
      "source-layer": "countries",
      paint: { "fill-color": "#dfe6e9" },
    },
    overlayLayer: {
      id: "countries-overlay",
      type: "fill",
      "source-layer": "countries",
      paint: { "fill-color": "#74b9ff" },
    },
  },
});

updateFillColors({
  colorMap: {
    US: "#6c5ce7",
    CA: "#00b894",
  },
});

const legend = createMapLegend({
  statusColors: {
    Active: "#6c5ce7",
    Inactive: "#b2bec3",
  },
});

document.querySelector("#legend").appendChild(legend.root);

const searchTile = createSearchTile({ placeholder: "Search for substance" });
const controller = new SearchTileController({
  ...searchTile,
  onSubmit: async (query) => {
    console.log("Search:", query);
  },
});

document.querySelector("#search").appendChild(searchTile.root);

map.on("remove", () => controller.destroy());
```

## Map core helpers

### `createMap`

Creates a Mapbox map, registers base + overlay layers, and returns a
`updateFillColors` helper that crossfades fill colors.

```js
import { createMap } from "map-ui-common/map-core";

const { map, updateFillColors } = createMap({
  containerId: "map",
  mapStyle: "mapbox://styles/mapbox/light-v10",
  center: [-98.5795, 39.8283],
  zoom: 3,
  vectorSourceConfig: {
    id: "countries",
    source: {
      type: "vector",
      url: "mapbox://your.tileset",
    },
  },
  layerConfig: {
    baseLayer: {
      id: "countries-base",
      type: "fill",
      "source-layer": "countries",
      paint: { "fill-color": "#dfe6e9" },
    },
    overlayLayer: {
      id: "countries-overlay",
      type: "fill",
      "source-layer": "countries",
      paint: { "fill-color": "#74b9ff" },
    },
    interactionLayerId: "countries-overlay",
    fadeDurationMs: 2000,
  },
  onFeatureClick: ({ feature }) => console.log(feature),
  onFeatureHover: ({ feature }) => console.log(feature),
});

updateFillColors({
  colorMap: { US: "#6c5ce7", CA: "#00b894" },
  defaultColor: "#666666",
  featureProperty: "iso_3166_1",
  opacity: 0.8,
});
```

### `createLevelAwareMap`

Supports multiple source/layer configurations (e.g., country/state/county) and
handles switching visibility between them. Each level needs its own
`vectorSourceConfig` and `layerConfig`.

```js
import { createLevelAwareMap } from "map-ui-common/map-core";

const { setLevel, updateLevelFillColors } = createLevelAwareMap({
  containerId: "map",
  mapStyle: "mapbox://styles/mapbox/light-v10",
  center: [-98.5795, 39.8283],
  zoom: 3,
  levels: [
    {
      id: "countries",
      minZoom: 0,
      maxZoom: 4,
      vectorSourceConfig: {
        id: "countries",
        source: { type: "vector", url: "mapbox://your.tileset" },
      },
      layerConfig: {
        baseLayer: {
          id: "countries-base",
          type: "fill",
          "source-layer": "countries",
          paint: { "fill-color": "#dfe6e9" },
        },
        overlayLayer: {
          id: "countries-overlay",
          type: "fill",
          "source-layer": "countries",
          paint: { "fill-color": "#74b9ff" },
        },
      },
    },
  ],
  onLevelChange: (levelId) => console.log("Level:", levelId),
});

setLevel("countries");
updateLevelFillColors("countries", { colorMap: { US: "#6c5ce7" } });
```

### `getMapConfig`

Resolves access tokens, map centers, and zoom levels based on viewport size and
hostname (with localhost-friendly defaults).

```js
import { getMapConfig } from "map-ui-common/map-core/config";

const { accessToken, mapCenter, zoomLevel } = getMapConfig({
  accessTokens: {
    localhost: "pk.localhost.token",
    default: "pk.production.token",
  },
  mapCenters: {
    mobile: [-40, 20],
    desktop: [10, 20],
  },
  zoomLevels: {
    mobile: 0.8,
    desktop: 1.3,
  },
});
```

## UI components

### Search tile

```js
import { createSearchTile, SearchTileController } from "map-ui-common/ui/search-tile";

const { root, iconWrap, form, input, button, spinner } = createSearchTile({
  placeholder: "Search for substance",
});

const controller = new SearchTileController({
  root,
  iconWrap,
  form,
  input,
  button,
  spinner,
  onSubmit: async (query) => {
    console.log("Search:", query);
  },
});

document.body.appendChild(root);

// Call controller.destroy() when removing the element.
```

### Date range (inline)

```js
import { createDateRange } from "map-ui-common/ui/date-range";
import "map-ui-common/ui/date-range.css";

const dateRange = createDateRange({
  startLabel: "Start date",
  endLabel: "End date",
  onChange: ({ start, end }) => console.log({ start, end }),
});

document.body.appendChild(dateRange.element);
```

### Legend

```js
import { createMapLegend } from "map-ui-common/ui/map-legend";

const { root } = createMapLegend({
  statusColors: {
    Active: "#6c5ce7",
    Inactive: "#b2bec3",
  },
});

document.body.appendChild(root);
```

## Shared stylesheet

Include `shared-map-ui.css` before your app-specific styles so you can override
colors and tokens. The styles cover layout for the map, legend, search tile, and
date range tile.

```html
<link rel="stylesheet" href="node_modules/map-ui-common/ui/shared-map-ui.css" />
<link rel="stylesheet" href="style.css" />
```

## HTML/CSS contract

### Map container

```html
<div class="map-wrapper">
  <div class="map-aspect">
    <div id="map"></div>
  </div>
</div>
```

### Legend

```html
<div class="legend">
  <div class="legend-item">
    <span class="legend-color" style="background-color: #6c5ce7;"></span>
    <span class="legend-label">Legend label</span>
  </div>
</div>
```

### Search tile

```html
<div class="tile search-tile" aria-label="Search substance">
  <div class="search-icon-wrap" role="button" title="Search">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none">
      <!-- icon paths -->
    </svg>
  </div>

  <form class="search-form hidden">
    <input class="search-input" type="text" placeholder="Search..." />
    <button class="search-submit" type="submit">
      <span class="spinner hidden"></span>
    </button>
  </form>
</div>
```

### Date range tile

```html
<div class="tile date-range-tile" aria-label="Filter by date range">
  <form class="date-range-form">
    <input class="date-range-input date-range-start" type="date" />
    <input class="date-range-input date-range-end" type="date" />
    <button class="date-range-submit" type="submit">Apply</button>
  </form>
</div>
```

#### State classes

- `.hidden` hides elements for collapsed states.
- `.expanded` on `.search-tile` reveals the input field.
- `.active` enables a transient highlight state in the tiles.

## Brand/color overrides

The shared stylesheet uses CSS variables so each app can define its own colors
and tokens. Define these variables in your app stylesheet (example values shown):

```css
:root {
  --map-ui-wrapper-bg: #f5f5f5;
  --map-ui-map-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
  --map-ui-legend-bg: rgba(255, 255, 255, 0.9);
  --map-ui-legend-item-bg: rgba(255, 255, 255, 0.7);
  --map-ui-legend-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  --map-ui-legend-text: #222;
  --map-ui-search-bg: rgba(255, 255, 255, 0.85);
  --map-ui-search-bg-hover: rgba(255, 255, 255, 0.95);
  --map-ui-search-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  --map-ui-search-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.15);
  --map-ui-search-input: #222;
  --map-ui-search-placeholder: #9aa3ad;
  --map-ui-search-submit: #4a90e2;
  --map-ui-search-submit-hover: #3c7cc0;
  --map-ui-search-icon-stroke: #666;
  --map-ui-spinner-track: rgba(0, 0, 0, 0.2);
  --map-ui-spinner-head: #333;
}
```
