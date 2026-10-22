# svgo-plugins

<p align="center">
  <a href="https://wiyco.github.io/svgo-plugins/">
    <img src="./apps/playground/public/og-image.png" alt="SVGO Plugin Playground" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/wiyco/svgo-plugins/actions/workflows/ci.yml">
    <img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/wiyco/svgo-plugins/ci.yml?branch=main&amp;style=flat&amp;label=ci&amp;labelColor=24292E&amp;color=2EA043&amp;logo=githubactions&amp;logoColor=white" />
  </a>
  <a href="https://wiyco.github.io/svgo-plugins/">
    <img alt="Playground status" src="https://img.shields.io/website?url=https%3A%2F%2Fwiyco.github.io%2Fsvgo-plugins%2F&amp;style=flat&amp;label=playground&amp;labelColor=24292E&amp;color=0969DA&amp;logo=githubpages&amp;logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@wiyco/svgo-plugin-hoist-stroke-width">
    <img alt="npm version" src="https://img.shields.io/npm/v/@wiyco/svgo-plugin-hoist-stroke-width?style=flat&amp;label=npm&amp;labelColor=24292E&amp;color=CB3837&amp;logo=npm&amp;logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@wiyco/svgo-plugin-hoist-stroke-width">
    <img alt="Bundle size" src="https://img.shields.io/bundlephobia/minzip/@wiyco/svgo-plugin-hoist-stroke-width?style=flat&amp;label=minzip&amp;labelColor=24292E&amp;color=57606A&amp;logo=webpack&amp;logoColor=white" />
  </a>
  <a href="./LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/wiyco/svgo-plugins?style=flat&amp;labelColor=24292E&amp;color=D29922&amp;logo=opensourceinitiative&amp;logoColor=white" />
  </a>
  <br />
  <a href="./docs/assets/coverage.svg">
    <img alt="Coverage" src="./docs/assets/coverage.svg" />
  </a>
  <a href="./docs/assets/code-to-test-ratio.svg">
    <img alt="Code to test ratio" src="./docs/assets/code-to-test-ratio.svg" />
  </a>
  <a href="./package.json">
    <img alt="Node.js version" src="https://img.shields.io/badge/node-%3E%3D24-339933?style=flat&amp;labelColor=24292E&amp;logo=nodedotjs&amp;logoColor=white" />
  </a>
  <a href="./pnpm-lock.yaml">
    <img alt="pnpm version" src="https://img.shields.io/badge/pnpm-12.15.0-F69220?style=flat&amp;labelColor=24292E&amp;logo=pnpm&amp;logoColor=white" />
  </a>
  <a href="./package.json">
    <img alt="TypeScript version" src="https://img.shields.io/badge/typescript-7.0.2-3178C6?style=flat&amp;labelColor=24292E&amp;logo=typescript&amp;logoColor=white" />
  </a>
</p>

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

## Tooling

Type-checking and builds use the stable TypeScript 7 compiler through `tsc`. The `typecheck:tsc` commands remain aliases for `typecheck`. Node.js is pinned in `.node-version`, and pnpm is pinned in `package.json`.

For VS Code, install the recommended [TypeScript 7 extension](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview). The workspace settings enable its native language service and use the locally installed TypeScript package.

React Compiler is not enabled. The new compiler checks `react/refs` and `react/set-state-in-effect` remain disabled for the existing ref and effect synchronization patterns; `react/globals` is disabled only in test harnesses that capture hook results during rendering.
