declare module "@babel/core" {
  export type TransformSyncResult = {
    code?: string | null;
  };

  export function transformSync(
    code: string,
    options?: Record<string, unknown>,
  ): TransformSyncResult | null;
}

declare module "@babel/plugin-transform-react-jsx" {
  const plugin: unknown;

  export default plugin;
}

declare module "@wiyco/svgo-plugin-hoist-stroke-width" {
  import type { CustomPlugin } from "svgo";

  export function createHoistStrokeWidthPlugin(): CustomPlugin;
}
