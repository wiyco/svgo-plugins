import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRoot = {
  render: ReturnType<typeof vi.fn>;
};

const createRoot = vi.fn<(element: Element) => MockRoot>();
const flushSync = vi.fn<(callback: () => void) => void>();
const render = vi.fn<(element: unknown) => void>();
const LandingPage = () => {
  return null;
};
const App = () => {
  return null;
};

const mockReactDomClient = () => {
  createRoot.mockReturnValue({
    render,
  });
  flushSync.mockImplementation((callback) => {
    callback();
  });
  vi.doMock("react-dom", () => {
    return {
      flushSync,
    };
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
  flushSync.mockReset();
  render.mockReset();
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("react-dom");
  vi.doUnmock("react-dom/client");
  vi.doUnmock("../landing/LandingPage");
  vi.doUnmock("../playgrounds/svgo-plugin-hoist-stroke-width/App");
});

describe("playground entrypoints", () => {
  it("renders the landing entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../landing/LandingPage", () => {
      return {
        LandingPage,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./landing");

    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(flushSync).toHaveBeenCalledTimes(1);
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

    await expect(import("./landing")).rejects.toThrow("Missing #root element");
  });

  it("renders the playground entry into #root", async () => {
    mockReactDomClient();
    vi.doMock("../playgrounds/svgo-plugin-hoist-stroke-width/App", () => {
      return {
        default: App,
      };
    });

    document.body.innerHTML = '<div id="root"></div>';

    await import("./svgo-plugin-hoist-stroke-width");

    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(flushSync).toHaveBeenCalledTimes(1);
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

    await expect(import("./svgo-plugin-hoist-stroke-width")).rejects.toThrow(
      "Missing #root element",
    );
  });

  it("keeps both entry stylesheets on the shared token layer", async () => {
    const [tokensCss, landingCss, playgroundCss] = await Promise.all([
      readFile(
        resolve(process.cwd(), "apps/playground/src/tokens.css"),
        "utf8",
      ),
      readFile(
        resolve(process.cwd(), "apps/playground/src/landing/index.css"),
        "utf8",
      ),
      readFile(resolve(process.cwd(), "apps/playground/src/index.css"), "utf8"),
    ]);

    expect(landingCss).toContain('@import "../tokens.css";');
    expect(playgroundCss).toContain('@import "./tokens.css";');
    expect(tokensCss).toContain("scrollbar-gutter: stable;");
    expect(landingCss).toContain("width: min(980px, calc(100% - 24px));");
    expect(landingCss).toContain("width: min(calc(100% - 16px), 980px);");
    expect(playgroundCss).toContain("width: min(1440px, calc(100% - 24px));");
    expect(playgroundCss).toContain("width: min(calc(100% - 16px), 1440px);");
    expect(landingCss).not.toContain("@view-transition");
    expect(playgroundCss).not.toContain("@view-transition");
    expect(landingCss).not.toContain("::view-transition");
    expect(playgroundCss).not.toContain("::view-transition");
    expect(landingCss).not.toContain("navigation: auto;");
    expect(playgroundCss).not.toContain("navigation: auto;");
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
