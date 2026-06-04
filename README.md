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
├─ packages/
│  └─ svgo-plugin-hoist-stroke-width/
└─ apps/
   └─ playground/
      ├─ src/
      │  ├─ core/
      │  └─ playgrounds/
      │     └─ svgo-plugin-hoist-stroke-width/
      └─ svgo-plugin-hoist-stroke-width/
```

`apps/playground` is a single Vite app. Each package playground lives under `src/playgrounds/<slug>`, while the published GitHub Pages URL stays slug-based at `/<slug>/` via a dedicated nested `index.html`.
