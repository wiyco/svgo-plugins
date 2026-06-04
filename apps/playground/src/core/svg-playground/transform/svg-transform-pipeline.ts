import type { SvgTransformRequest, SvgTransformResult } from "../model";

import { getErrorMessage } from "../utils/get-error-message";
import { getUnsafeSvgReason } from "./unsafe-svg";

type SvgTransformPipeline = {
  optimizeSvg: (svg: string) => Promise<string> | string;
};

export const createSvgTransformRequestHandler =
  ({ optimizeSvg }: SvgTransformPipeline) =>
  async ({ svg }: SvgTransformRequest): Promise<SvgTransformResult> => {
    const unsafeReason = getUnsafeSvgReason(svg);

    if (unsafeReason !== null) {
      return {
        kind: "unsafe",
        reason: unsafeReason,
      };
    }

    try {
      const optimizedSvg = await optimizeSvg(svg);

      return {
        kind: "success",
        optimizedSvg,
      };
    } catch (error) {
      return {
        kind: "error",
        message: getErrorMessage(error, "Unexpected transform failure."),
      };
    }
  };
