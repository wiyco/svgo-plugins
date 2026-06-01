import { transformSync } from "@babel/core";
import transformReactJsx from "@babel/plugin-transform-react-jsx";
import { transform as transformSvgToComponent } from "@svgr/core";
import jsxPlugin from "@svgr/plugin-jsx";
import { createHoistStrokeWidthPlugin } from "@wiyco/svgo-plugin-hoist-stroke-width";
import { optimize } from "svgo/browser";

import { createPreviewComponentFromJs } from "./preview-component";
import { createBareComponentTemplate } from "./svgr-template";
import type { SvgTransformRequest, SvgTransformResult } from "./types";
import { getUnsafeSvgReason } from "./unsafe-svg";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected transform failure.";
};

export const optimizeSvgMarkup = (svg: string): string => {
  return optimize(svg, {
    plugins: [createHoistStrokeWidthPlugin()],
  }).data;
};

export const svgToReactSource = async (svg: string): Promise<string> => {
  return transformSvgToComponent(
    svg,
    {
      dimensions: false,
      expandProps: "end",
      jsxRuntime: "classic",
      plugins: [jsxPlugin],
      runtimeConfig: false,
      svgo: false,
      template: createBareComponentTemplate,
      typescript: false,
    },
    {
      componentName: "SvgComponent",
      filePath: "playground.svg",
    },
  );
};

export const jsxToPreviewModule = (reactSource: string): string => {
  // oxc-transform@0.133.0 still fails the Vite worker build because the
  // browser entry resolves a CPU-filtered WASI binding package.
  const transformed = transformSync(reactSource, {
    babelrc: false,
    configFile: false,
    filename: "SvgComponent.jsx",
    plugins: [
      [
        transformReactJsx,
        {
          pragma: "React.createElement",
          pragmaFrag: "React.Fragment",
          runtime: "classic",
          useBuiltIns: true,
        },
      ],
    ],
  });

  if (transformed?.code === undefined) {
    throw new Error("Babel did not return preview code.");
  }

  return transformed.code?.trim() ?? "";
};

export const transformSvgRequest = async ({
  svg,
}: SvgTransformRequest): Promise<SvgTransformResult> => {
  const unsafeReason = getUnsafeSvgReason(svg);

  if (unsafeReason !== null) {
    return {
      kind: "unsafe",
      reason: unsafeReason,
    };
  }

  try {
    const optimizedSvg = optimizeSvgMarkup(svg);
    const reactSource = await svgToReactSource(optimizedSvg);
    const previewCode = jsxToPreviewModule(reactSource);

    createPreviewComponentFromJs(previewCode);

    return {
      kind: "success",
      optimizedSvg,
      previewCode,
      reactSource,
    };
  } catch (error) {
    return {
      kind: "error",
      message: getErrorMessage(error),
    };
  }
};
