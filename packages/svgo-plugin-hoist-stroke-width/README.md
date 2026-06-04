# svgo-plugin-hoist-stroke-width

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
