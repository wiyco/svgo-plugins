import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvgPlaygroundDefinition, TransformFn } from "../../model";
import type { SvgPlaygroundViewModel } from "./svg-playground-controller-types";

import {
  DEFAULT_QUERY_STATE,
  SVG_PRESETS,
  hoistStrokeWidthPlayground,
} from "../../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { createPlaygroundStateCodec } from "../../state/playground-state-codec";
import { applyControlsToSvg } from "../../utils/svg-controls";
import { useSvgPlaygroundController } from "./use-svg-playground-controller";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const successTransform: TransformFn = async ({ svg }) => {
  return {
    kind: "success",
    optimizedSvg: svg,
  };
};

const unsafeOptimizedOutputTransform: TransformFn = async () => {
  return {
    kind: "success",
    optimizedSvg: '<svg><image href="https://example.com/asset.svg" /></svg>',
  };
};

const createDefinition = (
  overrides: Partial<
    Pick<SvgPlaygroundDefinition, "defaultState" | "presets">
  > = {},
): SvgPlaygroundDefinition => {
  const defaultState =
    overrides.defaultState ?? hoistStrokeWidthPlayground.defaultState;
  const codec = createPlaygroundStateCodec(defaultState);

  return {
    ...hoistStrokeWidthPlayground,
    ...overrides,
    defaultState,
    presets: overrides.presets ?? hoistStrokeWidthPlayground.presets,
    parseState: codec.parse,
    serializeState: codec.serialize,
  };
};

type ControllerActions = Pick<
  SvgPlaygroundViewModel,
  | "selectPreset"
  | "setColor"
  | "setSize"
  | "setStrokeWidth"
  | "setSvg"
  | "stepStrokeWidth"
>;

let latestActions: ControllerActions | null = null;
let latestActivePresetId: string | null = null;
let latestQueryState: SvgPlaygroundViewModel["queryState"] | null = null;

let latestCanShareUrl = false;
let latestTransformState: SvgPlaygroundViewModel["transformState"] | null =
  null;

type ControllerHarnessProps = {
  definition: SvgPlaygroundDefinition;
  transform?: TransformFn;
};

const ControllerHarness = (props: ControllerHarnessProps) => {
  const { definition, transform = successTransform } = props;
  const controller = useSvgPlaygroundController({
    definition,
    transform,
  });

  latestActions = {
    selectPreset: controller.selectPreset,
    setColor: controller.setColor,
    setSize: controller.setSize,
    setStrokeWidth: controller.setStrokeWidth,
    setSvg: controller.setSvg,
    stepStrokeWidth: controller.stepStrokeWidth,
  };
  latestActivePresetId = controller.activePresetId;
  latestCanShareUrl = controller.canShareUrl;
  latestQueryState = controller.queryState;
  latestTransformState = controller.transformState;

  return (
    <div>
      <output data-testid="active-preset">
        {controller.activePresetId ?? ""}
      </output>
      <output data-testid="size">{controller.queryState.size}</output>
      <output data-testid="stroke-width">
        {controller.queryState.strokeWidth}
      </output>
      <output data-testid="color">{controller.queryState.color}</output>
      <textarea readOnly value={controller.queryState.svg} />
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  window.history.replaceState({}, "", "/");
  latestActions = null;
  latestActivePresetId = null;
  latestCanShareUrl = false;
  latestQueryState = null;
  latestTransformState = null;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });
});

describe("use-svg-playground-controller", () => {
  it("keeps an exact preset match active when the preset svg is already normalized", async () => {
    const normalizedSingleSvg = applyControlsToSvg(
      SVG_PRESETS[0].svg,
      DEFAULT_QUERY_STATE,
    );
    const definition = createDefinition({
      defaultState: {
        ...DEFAULT_QUERY_STATE,
        svg: normalizedSingleSvg,
      },
      presets: [
        {
          ...SVG_PRESETS[0],
          svg: normalizedSingleSvg,
        },
      ],
    });

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    expect(latestActivePresetId).toBe("single-weight");
    expect(
      (container.querySelector("textarea") as HTMLTextAreaElement | null)
        ?.value,
    ).toBe(normalizedSingleSvg);
  });

  it("ignores missing preset ids without changing the current state", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    const initialSvg = latestQueryState?.svg;

    await act(async () => {
      latestActions?.selectPreset("missing-preset");
      await flush();
    });

    expect(latestActivePresetId).toBe("single-weight");
    expect(latestQueryState?.svg).toBe(initialSvg);
  });

  it("reselects a matched preset after freeform svg edits clear the active preset", async () => {
    const definition = createDefinition();
    const unmatchedSvg =
      '<svg viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" /></svg>';
    const normalizedSingleSvg = applyControlsToSvg(
      definition.presets[0]?.svg ?? "",
      definition.defaultState,
    );

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.setSvg(unmatchedSvg);
      await flush();
    });

    expect(latestActivePresetId).toBeNull();

    await act(async () => {
      latestActions?.setSvg(normalizedSingleSvg);
      await flush();
    });

    expect(latestActivePresetId).toBe("single-weight");
  });

  it("derives the current matched preset even when the last selected preset no longer matches", async () => {
    const definition = createDefinition();
    const normalizedSingleSvg = applyControlsToSvg(
      definition.presets[0]?.svg ?? "",
      definition.defaultState,
    );

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.selectPreset("multiple-weights");
      await flush();
    });

    expect(latestActivePresetId).toBe("multiple-weights");

    await act(async () => {
      latestActions?.setSvg(normalizedSingleSvg);
      await flush();
    });

    expect(latestActivePresetId).toBe("single-weight");
  });

  it("keeps the current dock controls when switching to a uniform preset", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.stepStrokeWidth(0.25);
      latestActions?.stepStrokeWidth(0.25);
      latestActions?.setSize(256);
      latestActions?.setColor("#ff6600");
      latestActions?.selectPreset("multiple-weights");
      await flush();
    });

    expect(latestQueryState?.svg).toBe(
      applyControlsToSvg(definition.presets[1]?.svg ?? "", {
        ...definition.defaultState,
        color: "#ff6600",
        size: 256,
        strokeWidth: 2.5,
      }),
    );
  });

  it("preserves mixed stroke widths when switching to the mixed preset", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.stepStrokeWidth(0.25);
      latestActions?.stepStrokeWidth(0.25);
      latestActions?.setSize(256);
      latestActions?.setColor("#ff6600");
      latestActions?.selectPreset("mixed-weights");
      await flush();
    });

    expect(latestQueryState?.svg).toBe(
      applyControlsToSvg(
        definition.presets[2]?.svg ?? "",
        {
          ...definition.defaultState,
          color: "#ff6600",
          size: 256,
          strokeWidth: 2.5,
        },
        {
          preserveStrokeWidthVariations: true,
        },
      ),
    );
    expect(latestQueryState?.svg).toContain('stroke-width="1.25"');
    expect(latestQueryState?.svg).toContain('stroke-width="2"');
    expect(latestQueryState?.svg).toContain('stroke-width="3"');
    expect(latestActivePresetId).toBe("mixed-weights");
  });

  it("keeps the fallback stroke width for mixed svg edits until the dock changes it", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.setSvg(
        '<svg width="96" style="color: #0f766e" viewBox="0 0 24 24"><path d="M0 0L24 24" stroke="currentColor" stroke-width="1.25" /><path d="M24 0L0 24" stroke="currentColor" stroke-width="2.5" /></svg>',
      );
      await flush();
    });

    expect(latestQueryState?.color).toBe("#0f766e");
    expect(latestQueryState?.size).toBe(96);
    expect(latestQueryState?.strokeWidth).toBe(2);
    expect(latestQueryState?.svg).toContain('stroke-width="1.25"');
    expect(latestQueryState?.svg).toContain('stroke-width="2.5"');

    await act(async () => {
      latestActions?.stepStrokeWidth(0.25);
      await flush();
    });

    expect(latestQueryState?.svg).not.toContain('stroke-width="1.25"');
    expect(latestQueryState?.svg).not.toContain('stroke-width="2.5"');
    expect(latestQueryState?.svg).toContain('stroke-width="2.25"');
  });

  it("clears the selected preset when that preset disappears from the definition", async () => {
    const initialDefinition = createDefinition();
    const nextDefinition = createDefinition({
      presets: initialDefinition.presets.filter((preset) => {
        return preset.id !== "multiple-weights";
      }),
    });

    window.history.replaceState(
      {},
      "",
      `/?${initialDefinition.serializeState(initialDefinition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={initialDefinition} />);
      await flush();
    });

    await act(async () => {
      latestActions?.selectPreset("multiple-weights");
      await flush();
    });

    expect(latestActivePresetId).toBe("multiple-weights");

    await act(async () => {
      root.render(<ControllerHarness definition={nextDefinition} />);
      await flush();
    });

    expect(latestActivePresetId).toBeNull();
  });

  it("keeps controller action callbacks stable across rerenders when dependencies do not change", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    const previousActions = latestActions;

    await act(async () => {
      root.render(<ControllerHarness definition={definition} />);
      await flush();
    });

    expect(latestActions).not.toBeNull();
    expect(previousActions).not.toBeNull();
    expect(latestActions?.selectPreset).toBe(previousActions?.selectPreset);
    expect(latestActions?.setColor).toBe(previousActions?.setColor);
    expect(latestActions?.setSize).toBe(previousActions?.setSize);
    expect(latestActions?.setStrokeWidth).toBe(previousActions?.setStrokeWidth);
    expect(latestActions?.setSvg).toBe(previousActions?.setSvg);
    expect(latestActions?.stepStrokeWidth).toBe(
      previousActions?.stepStrokeWidth,
    );
  });

  it("blocks sharing and downgrades the transform state when optimized output is unsafe", async () => {
    const definition = createDefinition();

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(
        <ControllerHarness
          definition={definition}
          transform={unsafeOptimizedOutputTransform}
        />,
      );
      await flush();
    });

    expect(latestCanShareUrl).toBe(false);
    expect(latestTransformState).toEqual({
      kind: "unsafe",
      message: "Remote URLs are blocked in the playground preview.",
      optimizedSvg: '<svg><image href="https://example.com/asset.svg" /></svg>',
    });
  });

  it("short-circuits worker transforms for unsafe input svg", async () => {
    const transform = vi.fn<TransformFn>(successTransform);
    const definition = createDefinition({
      defaultState: {
        ...DEFAULT_QUERY_STATE,
        svg: `<svg><script>alert("blocked")</script></svg>`,
      },
      presets: [SVG_PRESETS[3]],
    });

    window.history.replaceState(
      {},
      "",
      `/?${definition.serializeState(definition.defaultState)}`,
    );

    await act(async () => {
      root.render(
        <ControllerHarness definition={definition} transform={transform} />,
      );
      await flush();
    });

    expect(transform).not.toHaveBeenCalled();
    expect(latestCanShareUrl).toBe(false);
    expect(latestTransformState).toEqual({
      kind: "unsafe",
      message: "Script elements are blocked in the playground preview.",
    });
  });
});
