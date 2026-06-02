import { act, useCallback } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaygroundQueryState } from "../../model";

import { hoistStrokeWidthPlayground } from "../../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import {
  PLAYGROUND_URL_SYNC_DELAY_MS,
  usePlaygroundQueryState,
  usePlaygroundQueryStateUrlSync,
} from "./use-playground-query-state";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const QueryStateHarness = () => {
  const [queryState, setQueryState] = usePlaygroundQueryState(
    hoistStrokeWidthPlayground,
  );
  usePlaygroundQueryStateUrlSync({
    definition: hoistStrokeWidthPlayground,
    queryState,
  });
  const handleSetColorClick = useCallback(() => {
    setQueryState({
      ...queryState,
      color: "#0f766e",
    });
  }, [queryState, setQueryState]);
  const handleStepSizeClick = useCallback(() => {
    setQueryState((currentState: PlaygroundQueryState) => {
      return {
        ...currentState,
        size: currentState.size + 4,
      };
    });
  }, [setQueryState]);

  return (
    <div>
      <output data-testid="color">{queryState.color}</output>
      <output data-testid="size">{queryState.size}</output>
      <textarea readOnly value={queryState.svg} />
      <button type="button" onClick={handleSetColorClick}>
        Set color
      </button>
      <button type="button" onClick={handleStepSizeClick}>
        Step size
      </button>
    </div>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  window.history.replaceState(
    null,
    "",
    `?${hoistStrokeWidthPlayground.serializeState(
      hoistStrokeWidthPlayground.defaultState,
    )}`,
  );
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await flush();
  });
  vi.useRealTimers();
});

describe("use-playground-query-state", () => {
  it("parses the initial query string snapshot", async () => {
    await act(async () => {
      root.render(<QueryStateHarness />);
      await flush();
    });

    expect(container.querySelector('[data-testid="color"]')?.textContent).toBe(
      hoistStrokeWidthPlayground.defaultState.color,
    );
    expect(container.querySelector('[data-testid="size"]')?.textContent).toBe(
      String(hoistStrokeWidthPlayground.defaultState.size),
    );
  });

  it("supports direct object updates and syncs them back to the URL after the debounce", async () => {
    await act(async () => {
      root.render(<QueryStateHarness />);
      await flush();
    });

    await act(async () => {
      container.querySelectorAll("button")[0]?.click();
      await flush();
    });

    expect(container.querySelector('[data-testid="color"]')?.textContent).toBe(
      "#0f766e",
    );
    expect(
      hoistStrokeWidthPlayground.parseState(window.location.search).color,
    ).toBe(hoistStrokeWidthPlayground.defaultState.color);

    await act(async () => {
      vi.advanceTimersByTime(PLAYGROUND_URL_SYNC_DELAY_MS);
      await flush();
    });

    expect(
      hoistStrokeWidthPlayground.parseState(window.location.search).color,
    ).toBe("#0f766e");
  });

  it("supports updater functions and reacts to external popstate changes", async () => {
    await act(async () => {
      root.render(<QueryStateHarness />);
      await flush();
    });

    await act(async () => {
      container.querySelectorAll("button")[1]?.click();
      await flush();
    });

    expect(container.querySelector('[data-testid="size"]')?.textContent).toBe(
      String(hoistStrokeWidthPlayground.defaultState.size + 4),
    );
    expect(
      hoistStrokeWidthPlayground.parseState(window.location.search).size,
    ).toBe(hoistStrokeWidthPlayground.defaultState.size);

    await act(async () => {
      vi.advanceTimersByTime(PLAYGROUND_URL_SYNC_DELAY_MS);
      await flush();
    });

    expect(
      hoistStrokeWidthPlayground.parseState(window.location.search).size,
    ).toBe(hoistStrokeWidthPlayground.defaultState.size + 4);

    const nextSvg = hoistStrokeWidthPlayground.presets[1]?.svg ?? "";

    await act(async () => {
      window.history.pushState(
        null,
        "",
        `?${hoistStrokeWidthPlayground.serializeState({
          ...hoistStrokeWidthPlayground.defaultState,
          svg: nextSvg,
        })}`,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flush();
    });

    expect(
      (container.querySelector("textarea") as HTMLTextAreaElement | null)
        ?.value,
    ).toBe(nextSvg);
  });
});
