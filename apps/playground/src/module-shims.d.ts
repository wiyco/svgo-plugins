declare module "*.css";

declare module "@wiyco/svgo-plugin-hoist-stroke-width" {
  import type { CustomPlugin } from "svgo";

  export function createHoistStrokeWidthPlugin(): CustomPlugin;
}
