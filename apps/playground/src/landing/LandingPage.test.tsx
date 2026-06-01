import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LandingPage } from "./LandingPage";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
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

describe("LandingPage", () => {
  it("renders links for the registered playgrounds", async () => {
    await act(async () => {
      root.render(<LandingPage />);
      await flush();
    });

    const playgroundLink = container.querySelector<HTMLAnchorElement>(
      'a[href="./svgo-plugin-hoist-stroke-width/"]',
    );

    expect(container.textContent).toContain("SVGO Plugin Playgrounds");
    expect(playgroundLink?.textContent).toContain(
      "svgo-plugin-hoist-stroke-width",
    );
    expect(playgroundLink?.textContent).toContain(
      "Try the hoist-stroke-width plugin",
    );
  });
});
