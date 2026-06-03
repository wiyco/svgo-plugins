import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRoot = {
  render: ReturnType<typeof vi.fn>;
};

const createRoot = vi.fn<(element: Element) => MockRoot>();
const render = vi.fn<(element: unknown) => void>();
const LandingPage = () => {
  return null;
};
const App = () => {
  return null;
};
const installViewTransitionErrorFilter = vi.fn<() => void>();

const mockReactDomClient = () => {
  createRoot.mockReturnValue({
    render,
  });
  vi.doMock("react-dom/client", () => {
    return {
      createRoot,
    };
  });
};

beforeEach(() => {
  document.body.innerHTML = "";
  createRoot.mockReset();
  render.mockReset();
  installViewTransitionErrorFilter.mockReset();
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("react-dom/client");
  vi.doUnmock("../landing/LandingPage");
  vi.doUnmock("../playgrounds/svgo-plugin-hoist-stroke-width/App");
  vi.doUnmock("../view-transition-runtime");
});

describe("playground entrypoints", () => {
  it("renders the landing entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../landing/LandingPage", () => {
      return {
        LandingPage,
      };
    });
    vi.doMock("../view-transition-runtime", () => {
      return {
        installViewTransitionErrorFilter,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./landing");

    expect(installViewTransitionErrorFilter).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(render).toHaveBeenCalledTimes(1);
    expect(
      (render.mock.calls[0]?.[0] as { type: unknown } | undefined)?.type,
    ).toBe(LandingPage);
  });

  it("throws when the landing entry is missing #root", async () => {
    mockReactDomClient();
    vi.doMock("../landing/LandingPage", () => {
      return {
        LandingPage,
      };
    });
    vi.doMock("../view-transition-runtime", () => {
      return {
        installViewTransitionErrorFilter,
      };
    });

    await expect(import("./landing")).rejects.toThrow("Missing #root element");
  });

  it("renders the playground entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../playgrounds/svgo-plugin-hoist-stroke-width/App", () => {
      return {
        default: App,
      };
    });
    vi.doMock("../view-transition-runtime", () => {
      return {
        installViewTransitionErrorFilter,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./svgo-plugin-hoist-stroke-width");

    expect(installViewTransitionErrorFilter).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(render).toHaveBeenCalledTimes(1);
    expect(
      (render.mock.calls[0]?.[0] as { type: unknown } | undefined)?.type,
    ).toBe(App);
  });

  it("throws when the playground entry is missing #root", async () => {
    mockReactDomClient();
    vi.doMock("../playgrounds/svgo-plugin-hoist-stroke-width/App", () => {
      return {
        default: App,
      };
    });
    vi.doMock("../view-transition-runtime", () => {
      return {
        installViewTransitionErrorFilter,
      };
    });

    await expect(import("./svgo-plugin-hoist-stroke-width")).rejects.toThrow(
      "Missing #root element",
    );
  });

  it("keeps both entry stylesheets on the shared token layer", async () => {
    const [landingCss, playgroundCss] = await Promise.all([
      readFile(
        resolve(process.cwd(), "apps/playground/src/landing/index.css"),
        "utf8",
      ),
      readFile(resolve(process.cwd(), "apps/playground/src/index.css"), "utf8"),
    ]);

    expect(landingCss).toContain('@import "../tokens.css";');
    expect(playgroundCss).toContain('@import "./tokens.css";');
    expect(landingCss).toContain("@view-transition");
    expect(playgroundCss).toContain("@view-transition");
    expect(landingCss).toContain("navigation: auto;");
    expect(playgroundCss).toContain("navigation: auto;");
    expect(landingCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(playgroundCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(landingCss).toContain("transition:");
    expect(playgroundCss).toContain("transition:");
    expect(playgroundCss).toContain(".ripple-surface");
    expect(playgroundCss).toContain("@keyframes button-ripple");
    expect(playgroundCss).toContain(".visually-hidden");
    expect(playgroundCss).toContain("inline-size var(--duration-medium)");
    expect(playgroundCss).toContain(".size-slider::-webkit-slider-thumb");
    expect(playgroundCss).toContain(".size-slider::-moz-range-thumb");
    expect(playgroundCss).not.toContain(
      '.share-button[data-share-feedback-state="success"] .share-button-icon-wrap',
    );
    expect(playgroundCss).not.toContain(
      '.share-button[data-share-feedback-state="failed"] .share-button-icon-wrap',
    );
    expect(landingCss).not.toContain("animation: none");
    expect(playgroundCss).not.toContain("animation: none");
    expect(landingCss).toContain("translateY(-1px)");
    expect(playgroundCss).not.toContain("translateY(-1px)");
  });
});
