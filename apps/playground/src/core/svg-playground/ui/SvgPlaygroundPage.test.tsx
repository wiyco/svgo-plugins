import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransformFn } from "../model";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlaygroundPage } from "./SvgPlaygroundPage";

const playgroundDefinitionWithoutPackage = {
  ...hoistStrokeWidthPlayground,
  slug: "custom-playground",
};

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  window.history.replaceState(null, "", "/");
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

describe("SvgPlaygroundPage", () => {
  it("renders the simplified workbench chrome and optimized output", async () => {
    const transform = vi.fn<TransformFn>(async () => {
      return {
        kind: "success",
        optimizedSvg:
          '<svg data-optimized="yes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />',
      };
    });

    await act(async () => {
      root.render(
        <SvgPlaygroundPage
          definition={hoistStrokeWidthPlayground}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(transform).toHaveBeenCalledWith({
      svg: hoistStrokeWidthPlayground.defaultState.svg,
    });
    expect(
      container.querySelector<HTMLButtonElement>(".share-button"),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLElement>(".share-button-text")?.textContent,
    ).toBe("Copy share URL");
    expect(
      container
        .querySelector<HTMLButtonElement>(".share-button")
        ?.getAttribute("data-share-feedback-state"),
    ).toBe("idle");
    expect(container.textContent).toContain("/svgo-plugin-hoist-stroke-width");
    expect(container.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );
    expect(container.textContent).toContain('data-optimized="yes"');
    expect(container.textContent).toContain("Preview");
    expect(container.textContent).toContain("Editable");
    expect(container.textContent).toContain("React source");
    expect(container.textContent).toContain("success");
    expect(container.querySelectorAll(".panel-kicker")).toHaveLength(0);
    expect(
      container.querySelector<HTMLElement>('[aria-live="polite"]')?.textContent,
    ).toBe("");
    expect(
      container
        .querySelector<HTMLAnchorElement>(".slug-chip")
        ?.getAttribute("href"),
    ).toBe("../");
    expect(
      container
        .querySelector<HTMLElement>(".intro-title")
        ?.getAttribute("data-view-transition-name"),
    ).toContain("playground-title-svgo-plugin-hoist-stroke-width");
  });

  it("omits the package chip when the playground slug has no package mapping", async () => {
    const transform = vi.fn<TransformFn>(async () => {
      return {
        kind: "success",
        optimizedSvg:
          '<svg data-optimized="yes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />',
      };
    });

    await act(async () => {
      root.render(
        <SvgPlaygroundPage
          definition={playgroundDefinitionWithoutPackage}
          transform={transform}
        />,
      );
      await flush();
    });

    expect(container.querySelector(".package-chip")).toBeNull();
  });
});
