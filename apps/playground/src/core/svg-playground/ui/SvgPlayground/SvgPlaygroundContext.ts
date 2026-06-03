import { createContext, useContext } from "react";

import type { SvgPreset } from "../../model";
import type {
  ReactSourceState,
  TransformState,
} from "../controller/svg-playground-controller-types";
import type { RippleHandlers } from "../use-press-ripple";
import type { UseShareButtonResult } from "../use-share-button";

export type SvgPlaygroundRootProps = {
  activePresetId: string | null;
  canShareUrl: boolean;
  color: string;
  copyShareUrl: () => void;
  inputSvg: string;
  packageName: string | null;
  previewHtml: { __html: string } | null;
  reactSourceState: ReactSourceState;
  rippleHandlers: RippleHandlers;
  selectPreset: (presetId: string) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
  setSvg: (svg: string) => void;
  shareButton: UseShareButtonResult;
  size: number;
  slug: string;
  stepStrokeWidth: (delta: number) => void;
  strokeWidth: number;
  title: string;
  transformState: TransformState;
  visiblePresets: readonly SvgPreset[];
};

export type SvgPlaygroundHeaderContextValue = {
  canShareUrl: boolean;
  copyShareUrl: () => void;
  packageName: string | null;
  rippleHandlers: RippleHandlers;
  shareButton: UseShareButtonResult;
  slug: string;
  title: string;
};

export type SvgPlaygroundPresetContextValue = {
  activePresetId: string | null;
  presets: readonly SvgPreset[];
  selectPreset: (presetId: string) => void;
};

export type SvgPlaygroundControlsContextValue = {
  color: string;
  rippleHandlers: RippleHandlers;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
  size: number;
  stepStrokeWidth: (delta: number) => void;
  strokeWidth: number;
};

export type SvgPlaygroundPanelsContextValue = {
  inputSvg: string;
  optimizedSvg: string;
  previewHtml: { __html: string } | null;
  reactSourceState: ReactSourceState;
  setSvg: (svg: string) => void;
  status: TransformState["kind"];
  statusMessage: string;
};

export const SvgPlaygroundHeaderContext =
  createContext<SvgPlaygroundHeaderContextValue | null>(null);
export const SvgPlaygroundPresetContext =
  createContext<SvgPlaygroundPresetContextValue | null>(null);
export const SvgPlaygroundControlsContext =
  createContext<SvgPlaygroundControlsContextValue | null>(null);
export const SvgPlaygroundPanelsContext =
  createContext<SvgPlaygroundPanelsContextValue | null>(null);

const useRequiredContext = <T>(name: string, value: T | null): T => {
  if (value === null) {
    throw new Error(`${name} must be used within SvgPlayground.Root.`);
  }

  return value;
};

export const useSvgPlaygroundHeaderContext = () => {
  return useRequiredContext(
    "SvgPlayground.Header",
    useContext(SvgPlaygroundHeaderContext),
  );
};

export const useSvgPlaygroundPresetContext = () => {
  return useRequiredContext(
    "SvgPlayground.PresetBar",
    useContext(SvgPlaygroundPresetContext),
  );
};

export const useSvgPlaygroundControlsContext = () => {
  return useRequiredContext(
    "SvgPlayground.Controls",
    useContext(SvgPlaygroundControlsContext),
  );
};

export const useSvgPlaygroundPanelsContext = () => {
  return useRequiredContext(
    "SvgPlayground.Panels",
    useContext(SvgPlaygroundPanelsContext),
  );
};
