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
      └─ svgo-plugin-hoist-stroke-width/
```

`packages/<slug>` and `apps/playground/<slug>` are paired 1:1. The repository path for each playground stays nested under `apps/playground/`, while the published GitHub Pages URL remains slug-based at `/<slug>/`.
