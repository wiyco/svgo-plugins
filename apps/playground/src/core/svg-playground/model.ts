export type SvgPreset = {
  description: string;
  id: string;
  label: string;
  svg: string;
};

export type SvgPlaygroundDefinition = {
  defaultState: PlaygroundQueryState;
  description: string;
  eyebrow: string;
  presets: readonly SvgPreset[];
  slug: string;
  summary: string;
  title: string;
  parseState: (search: string) => PlaygroundQueryState;
  serializeState: (state: PlaygroundQueryState) => string;
};

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

export type TransformWorkerFactory = () => Worker;
