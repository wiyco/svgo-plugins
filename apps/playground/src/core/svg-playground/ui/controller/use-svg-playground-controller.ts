import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  PlaygroundQueryState,
  SvgPlaygroundDefinition,
  TransformFn,
} from "../../model";
import type { SvgPlaygroundViewModel } from "./svg-playground-controller-types";

import { createPreviewMarkup } from "../../preview/create-preview-markup";
import { getUnsafeSvgReason } from "../../transform/unsafe-svg";
import {
  applyControlsToSvg,
  extractControlsFromSvg,
} from "../../utils/svg-controls";
import { useCopyShareUrl } from "./use-copy-share-url";
import {
  syncPlaygroundQueryStateToUrl,
  usePlaygroundQueryState,
  usePlaygroundQueryStateUrlSync,
} from "./use-playground-query-state";
import { useReactSourceState } from "./use-react-source-state";
import { useSvgTransformState } from "./use-svg-transform-state";

type UseSvgPlaygroundControllerOptions = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

const MIN_SIZE = 64;
const MAX_SIZE = 320;
const MIN_STROKE_WIDTH = 0.5;
const MAX_STROKE_WIDTH = 8;

const applyRenderableControlsToSvg = (
  svg: string,
  queryState: PlaygroundQueryState,
): string => {
  return applyControlsToSvg(svg, queryState, {
    preserveStrokeWidthVariations: true,
  });
};

const doesPresetMatchSvg = (
  presetSvg: string,
  svg: string,
  queryState: PlaygroundQueryState,
): boolean => {
  return (
    presetSvg === svg ||
    applyRenderableControlsToSvg(presetSvg, queryState) === svg
  );
};

const getPresetIdForSvg = (
  definition: SvgPlaygroundDefinition,
  svg: string,
  queryState: PlaygroundQueryState,
): string | null => {
  const exactMatch = definition.presets.find((preset) => {
    return doesPresetMatchSvg(preset.svg, svg, queryState);
  });

  return exactMatch?.id ?? null;
};

const getActivePresetId = ({
  matchedPresetId,
  renderedQueryState,
  selectedPresetId,
  definition,
}: {
  matchedPresetId: string | null;
  renderedQueryState: PlaygroundQueryState;
  selectedPresetId: string | null;
  definition: SvgPlaygroundDefinition;
}): string | null => {
  if (selectedPresetId === null) {
    return matchedPresetId;
  }

  const selectedPreset = definition.presets.find((preset) => {
    return preset.id === selectedPresetId;
  });

  if (selectedPreset === undefined) {
    return matchedPresetId;
  }

  return doesPresetMatchSvg(
    selectedPreset.svg,
    renderedQueryState.svg,
    renderedQueryState,
  )
    ? selectedPreset.id
    : matchedPresetId;
};

const createRenderableSvgWithStrokeWidth = (
  normalizedState: PlaygroundQueryState,
  strokeWidth: number,
): string => {
  return applyControlsToSvg(normalizedState.svg, {
    ...normalizedState,
    strokeWidth,
  });
};

const createRenderableSvgWithSize = (
  normalizedState: PlaygroundQueryState,
  size: number,
): string => {
  return applyControlsToSvg(
    normalizedState.svg,
    {
      ...normalizedState,
      size,
    },
    {
      preserveStrokeWidthVariations: true,
    },
  );
};

const createRenderableSvgWithColor = (
  normalizedState: PlaygroundQueryState,
  color: string,
): string => {
  return applyControlsToSvg(
    normalizedState.svg,
    {
      ...normalizedState,
      color,
    },
    {
      preserveStrokeWidthVariations: true,
    },
  );
};

const selectPresetById = (
  definition: SvgPlaygroundDefinition,
  presetId: string,
) => {
  return definition.presets.find((candidate) => {
    return candidate.id === presetId;
  });
};

const getVisiblePresets = (definition: SvgPlaygroundDefinition) => {
  return definition.presets.filter((preset) => {
    return getUnsafeSvgReason(preset.svg) === null;
  });
};

const createPreviewHtml = (previewMarkup: string | null) => {
  if (previewMarkup === null) {
    return null;
  }

  return {
    __html: previewMarkup,
  };
};

const createPreviewMarkupFromSvg = (optimizedSvg: string) => {
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
    svg: applyRenderableControlsToSvg(queryState.svg, queryState),
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
  const renderedQueryStateRef = useRef(renderedQueryState);
  renderedQueryStateRef.current = renderedQueryState;
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
  const inputUnsafeReason = useMemo(() => {
    return getUnsafeSvgReason(renderedQueryState.svg);
  }, [renderedQueryState.svg]);
  const rawTransformState = useSvgTransformState(
    renderedQueryState.svg,
    transform,
  );
  const optimizedSvg =
    rawTransformState.kind === "success" ? rawTransformState.optimizedSvg : "";
  const optimizedSvgUnsafeReason = useMemo(() => {
    if (optimizedSvg.length === 0) {
      return null;
    }

    return getUnsafeSvgReason(optimizedSvg);
  }, [optimizedSvg]);
  const canShareUrl =
    inputUnsafeReason === null && optimizedSvgUnsafeReason === null;
  usePlaygroundQueryStateUrlSync({
    definition,
    enabled: canShareUrl,
    queryState: renderedQueryState,
  });
  const resolveShareUrl = useCallback(() => {
    return syncPlaygroundQueryStateToUrl(
      definition,
      renderedQueryStateRef.current,
    );
  }, [definition]);
  const {
    copyShareUrl,
    shareAnnouncement,
    shareButtonLabel,
    shareButtonState,
  } = useCopyShareUrl({
    canShare: canShareUrl,
    resolveShareUrl,
  });
  const transformState = useMemo(() => {
    if (
      rawTransformState.kind === "success" &&
      optimizedSvgUnsafeReason !== null
    ) {
      return {
        kind: "unsafe" as const,
        message: optimizedSvgUnsafeReason,
        optimizedSvg,
      };
    }

    return rawTransformState;
  }, [optimizedSvg, optimizedSvgUnsafeReason, rawTransformState]);
  const activePresetId = getActivePresetId({
    definition,
    matchedPresetId,
    renderedQueryState,
    selectedPresetId,
  });
  const visiblePresets = useMemo(() => {
    return getVisiblePresets(definition);
  }, [definition]);

  useEffect(() => {
    if (!needsInitialNormalization || window.location.search.length === 0) {
      return;
    }

    setQueryState(initialNormalizedQueryState);
  }, [initialNormalizedQueryState, needsInitialNormalization, setQueryState]);

  const selectPreset = useCallback(
    (presetId: string): void => {
      const preset = selectPresetById(definition, presetId);

      if (preset === undefined) {
        return;
      }

      setSelectedPresetId(preset.id);
      setQueryState((currentState) => {
        const normalizedState = normalizeSvgQueryState(currentState);

        return {
          ...normalizedState,
          svg: applyRenderableControlsToSvg(preset.svg, normalizedState),
        };
      });
    },
    [definition, setQueryState],
  );

  const setStrokeWidth = useCallback(
    (strokeWidth: number): void => {
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
          svg: createRenderableSvgWithStrokeWidth(
            normalizedState,
            nextStrokeWidth,
          ),
        };
      });
    },
    [setQueryState],
  );

  const stepStrokeWidth = useCallback(
    (delta: number): void => {
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
          svg: createRenderableSvgWithStrokeWidth(
            normalizedState,
            nextStrokeWidth,
          ),
        };
      });
    },
    [setQueryState],
  );

  const setSize = useCallback(
    (size: number): void => {
      setQueryState((currentState) => {
        const normalizedState = normalizeSvgQueryState(currentState);
        const nextSize = clamp(size, MIN_SIZE, MAX_SIZE);

        return {
          ...normalizedState,
          size: nextSize,
          svg: createRenderableSvgWithSize(normalizedState, nextSize),
        };
      });
    },
    [setQueryState],
  );

  const setColor = useCallback(
    (color: string): void => {
      setQueryState((currentState) => {
        const normalizedState = normalizeSvgQueryState(currentState);

        return {
          ...normalizedState,
          color,
          svg: createRenderableSvgWithColor(normalizedState, color),
        };
      });
    },
    [setQueryState],
  );

  const setSvg = useCallback(
    (svg: string): void => {
      setQueryState((currentState) => {
        return {
          ...currentState,
          ...extractControlsFromSvg(svg, currentState),
          svg,
        };
      });
    },
    [setQueryState],
  );

  const previewMarkup = useMemo(() => {
    if (transformState.kind !== "success") {
      return null;
    }

    return createPreviewMarkupFromSvg(optimizedSvg);
  }, [optimizedSvg, transformState.kind]);
  const reactSourceState = useReactSourceState(transformState);

  const previewHtml = useMemo(() => {
    return createPreviewHtml(previewMarkup);
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
