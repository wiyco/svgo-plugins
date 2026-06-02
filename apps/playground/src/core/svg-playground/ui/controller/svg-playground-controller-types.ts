import type { PlaygroundQueryState, SvgPreset } from "../../model";
import type { ShareFeedbackState } from "./use-copy-share-url";

export type TransformState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; optimizedSvg: string }
  | { kind: "unsafe"; message: string; optimizedSvg?: string }
  | { kind: "error"; message: string };

export type ReactSourceState = {
  error: string;
  source: string;
};

export type SvgPlaygroundViewModel = {
  activePresetId: string | null;
  canShareUrl: boolean;
  copyShareUrl: () => void;
  previewHtml: { __html: string } | null;
  queryState: PlaygroundQueryState;
  reactSourceState: ReactSourceState;
  selectPreset: (presetId: string) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  shareAnnouncement: string;
  shareButtonLabel: string;
  shareButtonState: ShareFeedbackState;
  setStrokeWidth: (strokeWidth: number) => void;
  setSvg: (svg: string) => void;
  stepStrokeWidth: (delta: number) => void;
  transformState: TransformState;
  visiblePresets: readonly SvgPreset[];
};
