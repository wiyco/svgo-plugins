import { useMemo } from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  TransformFn,
} from "../../model";
import type { SvgPlaygroundViewModel } from "./svg-playground-controller-types";

import { createPreviewMarkup } from "../../preview/create-preview-markup";
import { createReactSource } from "../../source/create-react-source";
import { getErrorMessage } from "../../utils/get-error-message";
import { useCopyShareUrl } from "./use-copy-share-url";
import { usePlaygroundQueryState } from "./use-playground-query-state";
import { useSvgTransformState } from "./use-svg-transform-state";

type UseSvgPlaygroundControllerOptions = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

const getPresetIdForSvg = (
  definition: SvgPlaygroundDefinition,
  svg: string,
): string | null => {
  return (
    definition.presets.find((preset) => {
      return preset.svg === svg;
    })?.id ?? null
  );
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const updatePlaygroundQueryState = (
  setQueryState: (
    value:
      | PlaygroundQueryState
      | ((currentState: PlaygroundQueryState) => PlaygroundQueryState),
  ) => void,
  nextState: Partial<PlaygroundQueryState>,
): void => {
  setQueryState((currentState) => {
    return {
      ...currentState,
      ...nextState,
    };
  });
};

export const useSvgPlaygroundController = (
  options: UseSvgPlaygroundControllerOptions,
): SvgPlaygroundViewModel => {
  const { definition, transform } = options;

  const [queryState, setQueryState] = usePlaygroundQueryState(definition);
  const { copyShareUrl, copyStatus } = useCopyShareUrl();
  const transformState = useSvgTransformState(queryState.svg, transform);
  const activePresetId = getPresetIdForSvg(definition, queryState.svg);
  const optimizedSvg =
    transformState.kind === "success" ? transformState.optimizedSvg : "";

  const selectPreset = (presetId: string): void => {
    const preset = definition.presets.find((candidate) => {
      return candidate.id === presetId;
    });

    if (preset === undefined) {
      return;
    }

    updatePlaygroundQueryState(setQueryState, {
      svg: preset.svg,
    });
  };

  const setStrokeWidth = (strokeWidth: number): void => {
    updatePlaygroundQueryState(setQueryState, {
      strokeWidth: clamp(strokeWidth, 0.5, 8),
    });
  };

  const stepStrokeWidth = (delta: number): void => {
    setQueryState((currentState) => {
      return {
        ...currentState,
        strokeWidth: clamp(currentState.strokeWidth + delta, 0.5, 8),
      };
    });
  };

  const setSize = (size: number): void => {
    updatePlaygroundQueryState(setQueryState, {
      size,
    });
  };

  const setColor = (color: string): void => {
    updatePlaygroundQueryState(setQueryState, {
      color,
    });
  };

  const setSvg = (svg: string): void => {
    updatePlaygroundQueryState(setQueryState, {
      svg,
    });
  };

  const previewMarkup = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return null;
    }

    try {
      return createPreviewMarkup(optimizedSvg, {
        ariaLabel: "Live preview",
        color: queryState.color,
        size: queryState.size,
        strokeWidth: queryState.strokeWidth,
      });
    } catch {
      return null;
    }
  }, [optimizedSvg, queryState.color, queryState.size, queryState.strokeWidth]);

  const reactSourceState = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return {
        error: "",
        source: "",
      };
    }

    try {
      return {
        error: "",
        source: createReactSource(optimizedSvg),
      };
    } catch (error) {
      return {
        error: getErrorMessage(error, "Unable to generate React source."),
        source: "",
      };
    }
  }, [optimizedSvg]);

  const previewHtml = useMemo(() => {
    if (previewMarkup === null) {
      return null;
    }

    return {
      __html: previewMarkup,
    };
  }, [previewMarkup]);

  return {
    activePresetId,
    copyShareUrl,
    copyStatus,
    previewHtml,
    queryState,
    reactSourceState,
    selectPreset,
    setColor,
    setSize,
    setStrokeWidth,
    setSvg,
    stepStrokeWidth,
    transformState,
  };
};
