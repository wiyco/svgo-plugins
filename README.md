# svgo-plugins

[![Coverage](docs/assets/coverage.svg)](docs/assets/coverage.svg)
[![Code to Test Ratio](docs/assets/code-to-test-ratio.svg)](docs/assets/code-to-test-ratio.svg)

A workspace for SVGO plugins aimed at SVG-to-React workflows.

The first package in this repository, `svgo-plugin-hoist-stroke-width`, hoists descendant `stroke-width` attributes to the root `<svg>` when the effective stroke width is uniform across the SVG.

That makes stroke width much easier to override on SVGR-generated React components, whether through a `strokeWidth` prop or Tailwind CSS utilities such as `stroke-2`.

## Workspace

```text
.
├─ packages/
│  └─ svgo-plugin-hoist-stroke-width/
└─ apps/
```

> `apps/*` is reserved for future playgrounds and end-to-end fixtures. For now, the repository only contains the package intended for publication.

## Package

- [`svgo-plugin-hoist-stroke-width`](packages/svgo-plugin-hoist-stroke-width) (`@wiyco/svgo-plugin-hoist-stroke-width`)

See the package README for the public API and usage examples.
