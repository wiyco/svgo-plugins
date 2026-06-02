import { useEffect, useMemo, useState } from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  TransformFn,
} from "../../model";
import type { SvgPlaygroundViewModel } from "./svg-playground-controller-types";

import { createPreviewMarkup } from "../../preview/create-preview-markup";
import { createReactSource } from "../../source/create-react-source";
import { getUnsafeSvgReason } from "../../transform/unsafe-svg";
import { getErrorMessage } from "../../utils/get-error-message";
import {
  applyControlsToSvg,
  extractControlsFromSvg,
} from "../../utils/svg-controls";
import { useCopyShareUrl } from "./use-copy-share-url";
import { usePlaygroundQueryState } from "./use-playground-query-state";
import { useSvgTransformState } from "./use-svg-transform-state";

type UseSvgPlaygroundControllerOptions = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

const MIN_SIZE = 64;
const MAX_SIZE = 320;
const MIN_STROKE_WIDTH = 0.5;
const MAX_STROKE_WIDTH = 8;

const getPresetIdForSvg = (
  definition: SvgPlaygroundDefinition,
  svg: string,
  queryState: PlaygroundQueryState,
): string | null => {
  const exactMatch = definition.presets.find((preset) => {
    return preset.svg === svg;
  });

  if (exactMatch !== undefined) {
    return exactMatch.id;
  }

  return (
    definition.presets.find((preset) => {
      return applyControlsToSvg(preset.svg, queryState) === svg;
    })?.id ?? null
  );
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const areQueryStatesEqual = (
  left: PlaygroundQueryState,
  right: PlaygroundQueryState,
): boolean => {
  return (
    left.color === right.color &&
    left.size === right.size &&
    left.strokeWidth === right.strokeWidth &&
    left.svg === right.svg
  );
};

const normalizeSvgQueryState = (
  queryState: PlaygroundQueryState,
): PlaygroundQueryState => {
  return {
    ...queryState,
    svg: applyControlsToSvg(queryState.svg, queryState),
  };
};

export const useSvgPlaygroundController = (
  options: UseSvgPlaygroundControllerOptions,
): SvgPlaygroundViewModel => {
  const { definition, transform } = options;

  const [queryState, setQueryState] = usePlaygroundQueryState(definition);
  const [initialQueryState] = useState(queryState);
  const [initialNormalizedQueryState] = useState(() => {
    return normalizeSvgQueryState(queryState);
  });
  const needsInitialNormalization =
    areQueryStatesEqual(queryState, initialQueryState) &&
    !areQueryStatesEqual(initialNormalizedQueryState, initialQueryState);
  const renderedQueryState = needsInitialNormalization
    ? initialNormalizedQueryState
    : queryState;
  const matchedPresetId = useMemo(() => {
    return getPresetIdForSvg(
      definition,
      renderedQueryState.svg,
      renderedQueryState,
    );
  }, [definition, renderedQueryState]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    () => {
      return matchedPresetId;
    },
  );
  const canShareUrl = getUnsafeSvgReason(renderedQueryState.svg) === null;
  const {
    copyShareUrl,
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
  } = useCopyShareUrl({
    canShare: canShareUrl,
  });
  const transformState = useSvgTransformState(
    renderedQueryState.svg,
    transform,
  );
  const activePresetId = selectedPresetId ?? matchedPresetId;
  const visiblePresets = useMemo(() => {
    return definition.presets.filter((preset) => {
      return getUnsafeSvgReason(preset.svg) === null;
    });
  }, [definition.presets]);
  const optimizedSvg =
    transformState.kind === "success" ? transformState.optimizedSvg : "";

  useEffect(() => {
    if (!needsInitialNormalization || window.location.search.length === 0) {
      return;
    }

    setQueryState(initialNormalizedQueryState);
  }, [initialNormalizedQueryState, needsInitialNormalization, setQueryState]);

  useEffect(() => {
    if (selectedPresetId === null) {
      if (matchedPresetId !== null) {
        setSelectedPresetId(matchedPresetId);
      }

      return;
    }

    const selectedPreset = definition.presets.find((preset) => {
      return preset.id === selectedPresetId;
    });

    if (selectedPreset === undefined) {
      setSelectedPresetId(matchedPresetId);
      return;
    }

    if (
      applyControlsToSvg(selectedPreset.svg, renderedQueryState) !==
      renderedQueryState.svg
    ) {
      setSelectedPresetId(matchedPresetId);
    }
  }, [
    definition.presets,
    matchedPresetId,
    renderedQueryState,
    selectedPresetId,
  ]);

  const selectPreset = (presetId: string): void => {
    const preset = definition.presets.find((candidate) => {
      return candidate.id === presetId;
    });

    if (preset === undefined) {
      return;
    }

    setSelectedPresetId(preset.id);
    setQueryState((currentState) => {
      const normalizedState = normalizeSvgQueryState(currentState);

      return {
        ...normalizedState,
        svg: applyControlsToSvg(preset.svg, normalizedState),
      };
    });
  };

  const setStrokeWidth = (strokeWidth: number): void => {
    setQueryState((currentState) => {
      const normalizedState = normalizeSvgQueryState(currentState);
      const nextStrokeWidth = clamp(
        strokeWidth,
        MIN_STROKE_WIDTH,
        MAX_STROKE_WIDTH,
      );

      return {
        ...normalizedState,
        strokeWidth: nextStrokeWidth,
        svg: applyControlsToSvg(normalizedState.svg, {
          ...normalizedState,
          strokeWidth: nextStrokeWidth,
        }),
      };
    });
  };

  const stepStrokeWidth = (delta: number): void => {
    setQueryState((currentState) => {
      const normalizedState = normalizeSvgQueryState(currentState);
      const nextStrokeWidth = clamp(
        normalizedState.strokeWidth + delta,
        MIN_STROKE_WIDTH,
        MAX_STROKE_WIDTH,
      );

      return {
        ...normalizedState,
        strokeWidth: nextStrokeWidth,
        svg: applyControlsToSvg(normalizedState.svg, {
          ...normalizedState,
          strokeWidth: nextStrokeWidth,
        }),
      };
    });
  };

  const setSize = (size: number): void => {
    setQueryState((currentState) => {
      const normalizedState = normalizeSvgQueryState(currentState);
      const nextSize = clamp(size, MIN_SIZE, MAX_SIZE);

      return {
        ...normalizedState,
        size: nextSize,
        svg: applyControlsToSvg(normalizedState.svg, {
          ...normalizedState,
          size: nextSize,
        }),
      };
    });
  };

  const setColor = (color: string): void => {
    setQueryState((currentState) => {
      const normalizedState = normalizeSvgQueryState(currentState);

      return {
        ...normalizedState,
        color,
        svg: applyControlsToSvg(normalizedState.svg, {
          ...normalizedState,
          color,
        }),
      };
    });
  };

  const setSvg = (svg: string): void => {
    setQueryState((currentState) => {
      return {
        ...currentState,
        ...extractControlsFromSvg(svg, currentState),
        svg,
      };
    });
  };

  const previewMarkup = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return null;
    }

    try {
      return createPreviewMarkup(optimizedSvg, {
        ariaLabel: "Live preview",
      });
    } catch {
      return null;
    }
  }, [optimizedSvg]);

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
    canShareUrl,
    copyShareUrl,
    previewHtml,
    queryState: renderedQueryState,
    reactSourceState,
    selectPreset,
    setColor,
    setSize,
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
    setStrokeWidth,
    setSvg,
    stepStrokeWidth,
    transformState,
    visiblePresets,
  };
};
