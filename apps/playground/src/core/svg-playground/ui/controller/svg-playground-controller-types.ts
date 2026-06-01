import type { PlaygroundQueryState } from "../../model";

export type TransformState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; optimizedSvg: string }
  | { kind: "unsafe"; message: string }
  | { kind: "error"; message: string };

export type ReactSourceState = {
  error: string;
  source: string;
};

export type SvgPlaygroundViewModel = {
  activePresetId: string | null;
  copyShareUrl: () => void;
  copyStatus: string;
  previewHtml: { __html: string } | null;
  queryState: PlaygroundQueryState;
  reactSourceState: ReactSourceState;
  selectPreset: (presetId: string) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
  setSvg: (svg: string) => void;
  stepStrokeWidth: (delta: number) => void;
  transformState: TransformState;
};
