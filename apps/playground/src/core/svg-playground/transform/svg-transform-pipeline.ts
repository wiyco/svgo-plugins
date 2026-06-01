import { transformSync } from "@babel/core";
import transformReactJsx from "@babel/plugin-transform-react-jsx";
import { transform as transformSvgToComponent } from "@svgr/core";
import jsxPlugin from "@svgr/plugin-jsx";

import type { SvgTransformRequest, SvgTransformResult } from "../model";

import { createPreviewComponentFromJs } from "../preview/create-preview-component";
import { createBareComponentTemplate } from "./svgr-template";
import { getUnsafeSvgReason } from "./unsafe-svg";

type SvgTransformPipeline = {
  optimizeSvg: (svg: string) => Promise<string> | string;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected transform failure.";
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

  if (transformed?.code === undefined || transformed.code === null) {
    throw new Error("Babel did not return preview code.");
  }

  return transformed.code.trim();
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
