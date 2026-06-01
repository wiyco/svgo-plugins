import { createHoistStrokeWidthPlugin } from "@wiyco/svgo-plugin-hoist-stroke-width";
import { optimize } from "svgo/browser";

import { createSvgTransformRequestHandler } from "../../core/svg-playground/transform/svg-transform-pipeline";

const optimizeSvgMarkup = (svg: string): string => {
  return optimize(svg, {
    plugins: [createHoistStrokeWidthPlugin()],
  }).data;
};

export const transformSvgRequest = createSvgTransformRequestHandler({
  optimizeSvg: optimizeSvgMarkup,
});
