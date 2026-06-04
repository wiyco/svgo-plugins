# svgo-plugins

[![Coverage](docs/assets/coverage.svg)](docs/assets/coverage.svg)
[![Code to Test Ratio](docs/assets/code-to-test-ratio.svg)](docs/assets/code-to-test-ratio.svg)

A workspace for SVGO plugins aimed at SVG-to-React workflows.

## Package

- [`svgo-plugin-hoist-stroke-width`](packages/svgo-plugin-hoist-stroke-width) (`@wiyco/svgo-plugin-hoist-stroke-width`)

See the package README for the public API and usage examples.

## Workspace

```text
.
├─ scripts/
├─ packages/
│  └─ svgo-plugin-hoist-stroke-width/
│     ├─ src/
│     └─ __tests__/
└─ apps/
   └─ playground/
      ├─ index.html
      ├─ svgo-plugin-hoist-stroke-width/
      │  └─ index.html
      ├─ src/
      │  ├─ entries/
      │  ├─ core/
      │  ├─ landing/
      │  └─ playgrounds/
      │     └─ svgo-plugin-hoist-stroke-width/
      └─ public/
```

`apps/playground` is a single Vite app. Each package playground lives under `src/playgrounds/<slug>`, while the published GitHub Pages URL stays slug-based at `/<slug>/` via a dedicated nested `index.html`.
