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
});

afterEach(() => {
  vi.resetModules();
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
});
