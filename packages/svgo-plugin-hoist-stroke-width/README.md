# svgo-plugin-hoist-stroke-width

[![OG Image](https://wiyco.github.io/svgo-plugins/svgo-plugin-hoist-stroke-width/og-image.png)](https://wiyco.github.io/svgo-plugins/svgo-plugin-hoist-stroke-width/)

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
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/packages/svgo-plugin-hoist-stroke-width/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/wiyco/svgo-plugins?style=flat&amp;labelColor=24292E&amp;color=D29922&amp;logo=opensourceinitiative&amp;logoColor=white" />
  </a>
  <br />
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/docs/assets/coverage.svg">
    <img alt="Coverage" src="https://raw.githubusercontent.com/wiyco/svgo-plugins/main/docs/assets/coverage.svg" />
  </a>
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/docs/assets/code-to-test-ratio.svg">
    <img alt="Code to test ratio" src="https://raw.githubusercontent.com/wiyco/svgo-plugins/main/docs/assets/code-to-test-ratio.svg" />
  </a>
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/packages/svgo-plugin-hoist-stroke-width/package.json">
    <img alt="Node.js version" src="https://img.shields.io/badge/node-%3E%3D24-336633?style=flat&amp;labelColor=24292E&amp;logo=nodedotjs&amp;logoColor=white" />
  </a>
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/pnpm-lock.yaml">
    <img alt="pnpm version" src="https://img.shields.io/badge/pnpm-10.33.4-F69220?style=flat&amp;labelColor=24292E&amp;logo=pnpm&amp;logoColor=white" />
  </a>
  <a href="https://github.com/wiyco/svgo-plugins/blob/main/package.json">
    <img alt="TypeScript version" src="https://img.shields.io/badge/typescript-7%20beta-3178C6?style=flat&amp;labelColor=24292E&amp;logo=typescript&amp;logoColor=white" />
  </a>
</p>

An SVGO plugin that hoists descendant `stroke-width` attributes to the root `<svg>` when every stroked descendant resolves to the same effective stroke width.

This makes SVGR-generated React components much easier to customize, whether you are passing a `strokeWidth` prop or using Tailwind CSS utilities such as `stroke-2`.

## Install

```bash
pnpm i -D @wiyco/svgo-plugin-hoist-stroke-width
```

## Usage with SVGO

```ts
import { optimize } from "svgo";
import { createHoistStrokeWidthPlugin } from "@wiyco/svgo-plugin-hoist-stroke-width";

const result = optimize(
  '<svg><path stroke="currentColor" stroke-width="2" /></svg>',
  {
    plugins: [createHoistStrokeWidthPlugin()],
  },
);
```

See the [SVGO plugin docs](https://svgo.dev/docs/plugins/) for the full plugin configuration format.

## Usage with vite-plugin-svgr

```ts
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { createHoistStrokeWidthPlugin } from "@wiyco/svgo-plugin-hoist-stroke-width";

export default defineConfig({
  plugins: [
    svgr({
      svgrOptions: {
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
        svgo: true,
        svgoConfig: {
          plugins: [createHoistStrokeWidthPlugin()],
        },
      },
    }),
  ],
});
```

Relevant docs:

- [`vite-plugin-svgr` options](https://github.com/pd4d10/vite-plugin-svgr#options)
- [SVGR `svgo` option](https://react-svgr.com/docs/options/#svgo)

## Example

Before:

```xml
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" />
</svg>
```

After:

```xml
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke-width="2">
  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" />
</svg>
```

Because `stroke-width` is now on the root `<svg>`, consumers can override it from the generated SVGR component:

```tsx
import Icon from "./icon.svg?react";

<Icon strokeWidth={1.5} />;
<Icon className="stroke-1" />;
```

## Behavior

The plugin hoists `stroke-width` only when all of the following are true:

- The visited node is the root `<svg>`.
- At least one descendant explicitly defines `stroke-width`.
- Every stroked graphic element resolves to the same effective `stroke-width`.
- The SVG does not rely on inline stroke-related styles such as `style="stroke: ..."` or `style="stroke-width: ..."`.

If any of those conditions fail, the SVG is left untouched.
