# Map UI Common

Shared UI building blocks for the map experience, including the map core helper,
search tile UI controller, and shared CSS for layout/interaction patterns.

## Installation

```bash
npm install map-ui-common
```

## Usage

### Map core helper

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
  },
});

updateFillColors({
  colorMap: {
    US: "#6c5ce7",
    CA: "#00b894",
  },
});
```

### Search tile controller

```js
import {
  createSearchTile,
  SearchTileController,
} from "map-ui-common/ui/search-tile";

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
```

### Shared stylesheet

Include the shared stylesheet before your app-specific styles so you can override
colors and tokens:

```html
<link rel="stylesheet" href="node_modules/map-ui-common/ui/shared-map-ui.css" />
<link rel="stylesheet" href="style.css" />
```

## HTML/CSS Contract

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
    <span>Legend label</span>
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

#### State classes

- `.hidden` hides elements for collapsed states.
- `.expanded` on `.search-tile` reveals the input field.

## Brand/Color Overrides

The shared stylesheet uses CSS variables so each app can define its own colors
and tokens. Define these variables in your app stylesheet (example values shown):

```css
:root {
  --map-ui-wrapper-bg: #f5f5f5;
  --map-ui-map-shadow: 0 4px 25px rgba(0,0,0,0.1);
  --map-ui-legend-bg: rgba(255,255,255,0.9);
  --map-ui-legend-item-bg: rgba(255,255,255,0.7);
  --map-ui-legend-shadow: 0 2px 6px rgba(0,0,0,0.15);
  --map-ui-legend-text: #222;
  --map-ui-search-bg: rgba(255, 255, 255, 0.85);
  --map-ui-search-bg-hover: rgba(255, 255, 255, 0.95);
  --map-ui-search-shadow: 0 4px 20px rgba(0,0,0,0.1);
  --map-ui-search-shadow-hover: 0 6px 24px rgba(0,0,0,0.15);
  --map-ui-search-input: #222;
  --map-ui-search-placeholder: #9aa3ad;
  --map-ui-search-submit: #4A90E2;
  --map-ui-search-submit-hover: #3C7CC0;
  --map-ui-search-icon-stroke: #666;
  --map-ui-spinner-track: rgba(0, 0, 0, 0.2);
  --map-ui-spinner-head: #333;
}
```
