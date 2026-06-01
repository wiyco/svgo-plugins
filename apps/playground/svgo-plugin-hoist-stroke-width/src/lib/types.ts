import type { ComponentType, SVGProps } from "react";

export type PreviewComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type PlaygroundQueryState = {
  svg: string;
  color: string;
  size: number;
  strokeWidth: number;
};

export type SvgTransformRequest = {
  svg: string;
};

export type SvgTransformSuccess = {
  kind: "success";
  optimizedSvg: string;
  previewCode: string;
  reactSource: string;
};

export type SvgTransformUnsafe = {
  kind: "unsafe";
  reason: string;
};

export type SvgTransformError = {
  kind: "error";
  message: string;
};

export type SvgTransformResult =
  | SvgTransformSuccess
  | SvgTransformUnsafe
  | SvgTransformError;

export type TransformFn = (
  request: SvgTransformRequest,
) => Promise<SvgTransformResult>;

export type WorkerRequestMessage = {
  id: number;
  payload: SvgTransformRequest;
};

export type WorkerResponseMessage = {
  id: number;
  payload: SvgTransformResult;
};

export type WorkerTransformClient = {
  dispose: () => void;
  transform: TransformFn;
};
