import { type PropsWithChildren, useMemo } from "react";

import {
  SvgPlaygroundControlsContext,
  SvgPlaygroundHeaderContext,
  SvgPlaygroundPanelsContext,
  SvgPlaygroundPresetContext,
  type SvgPlaygroundRootProps,
} from "./SvgPlaygroundContext";
import { SvgPlaygroundControls } from "./SvgPlaygroundControls";
import { SvgPlaygroundHeader } from "./SvgPlaygroundHeader";
import { SvgPlaygroundPanels } from "./SvgPlaygroundPanels";
import { SvgPlaygroundPresetBar } from "./SvgPlaygroundPresetBar";

const SvgPlaygroundRoot = (
  props: PropsWithChildren<SvgPlaygroundRootProps>,
) => {
  const {
    activePresetId,
    canShareUrl,
    children,
    color,
    copyShareUrl,
    inputSvg,
    packageName,
    previewHtml,
    reactSourceState,
    rippleHandlers,
    selectPreset,
    setColor,
    setSize,
    setStrokeWidth,
    setSvg,
    shareButton,
    size,
    slug,
    slugTransitionName,
    stepStrokeWidth,
    strokeWidth,
    title,
    titleTransitionName,
    transformState,
    visiblePresets,
  } = props;
  const headerValue = useMemo(() => {
    return {
      canShareUrl,
      copyShareUrl,
      packageName,
      rippleHandlers,
      shareButton,
      slug,
      slugTransitionName,
      title,
      titleTransitionName,
    };
  }, [
    canShareUrl,
    copyShareUrl,
    packageName,
    rippleHandlers,
    shareButton,
    slug,
    slugTransitionName,
    title,
    titleTransitionName,
  ]);
  const presetValue = useMemo(() => {
    return {
      activePresetId,
      presets: visiblePresets,
      selectPreset,
    };
  }, [activePresetId, selectPreset, visiblePresets]);
  const controlsValue = useMemo(() => {
    return {
      color,
      rippleHandlers,
      setColor,
      setSize,
      setStrokeWidth,
      size,
      stepStrokeWidth,
      strokeWidth,
    };
  }, [
    color,
    rippleHandlers,
    setColor,
    setSize,
    setStrokeWidth,
    size,
    stepStrokeWidth,
    strokeWidth,
  ]);
  const optimizedSvg =
    transformState.kind === "success"
      ? transformState.optimizedSvg
      : transformState.kind === "unsafe"
        ? (transformState.optimizedSvg ?? "")
        : "";
  const status = transformState.kind;
  const statusMessage =
    transformState.kind === "error" || transformState.kind === "unsafe"
      ? transformState.message
      : "";
  const panelsValue = useMemo(() => {
    return {
      inputSvg,
      optimizedSvg,
      previewHtml,
      reactSourceState,
      setSvg,
      status,
      statusMessage,
    };
  }, [
    inputSvg,
    optimizedSvg,
    previewHtml,
    reactSourceState,
    setSvg,
    status,
    statusMessage,
  ]);

  return (
    <SvgPlaygroundHeaderContext.Provider value={headerValue}>
      <SvgPlaygroundPresetContext.Provider value={presetValue}>
        <SvgPlaygroundControlsContext.Provider value={controlsValue}>
          <SvgPlaygroundPanelsContext.Provider value={panelsValue}>
            <main className="app-shell playground-shell">{children}</main>
          </SvgPlaygroundPanelsContext.Provider>
        </SvgPlaygroundControlsContext.Provider>
      </SvgPlaygroundPresetContext.Provider>
    </SvgPlaygroundHeaderContext.Provider>
  );
};

export const SvgPlayground = {
  Root: SvgPlaygroundRoot,
  Header: SvgPlaygroundHeader,
  PresetBar: SvgPlaygroundPresetBar,
  Controls: SvgPlaygroundControls,
  Panels: SvgPlaygroundPanels,
} as const;
