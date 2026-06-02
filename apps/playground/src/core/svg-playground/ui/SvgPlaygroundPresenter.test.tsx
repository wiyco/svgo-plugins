import { type ReactNode, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvgPlaygroundViewModel } from "./controller/svg-playground-controller-types";

import { hoistStrokeWidthPlayground } from "../../../playgrounds/svgo-plugin-hoist-stroke-width/definition";
import { SvgPlaygroundPresenter } from "./SvgPlaygroundPresenter";

const mocks = vi.hoisted(() => {
  const controlsSpy = vi.fn<() => void>();
  const headerSpy = vi.fn<() => void>();
  const panelsSpy = vi.fn<() => void>();
  const presetBarSpy = vi.fn<() => void>();
  const rootSpy =
    vi.fn<(props: Record<string, unknown> & { children: ReactNode }) => void>();
  const rippleHandlers = {
    onBlur: vi.fn<() => void>(),
    onKeyDown: vi.fn<() => void>(),
    onPointerDown: vi.fn<() => void>(),
  };
  const shareButton = {
    shareAnnouncement: "",
    shareButtonIcon: "icon",
    shareButtonLabel: "Copy share URL",
    shareButtonLabelRef: { current: null },
    shareButtonMeasureRef: { current: null },
    shareButtonRef: { current: null },
    shareButtonState: "idle" as const,
    shareButtonStyle: {},
  };

  return {
    controlsSpy,
    headerSpy,
    panelsSpy,
    presetBarSpy,
    rippleHandlers,
    rootSpy,
    shareButton,
    usePressRipple: vi.fn<() => typeof rippleHandlers>(() => {
      return rippleHandlers;
    }),
    useShareButton: vi.fn<
      (options: {
        shareAnnouncement: string;
        shareButtonLabel: string;
        shareButtonState: string;
      }) => typeof shareButton
    >(() => {
      return shareButton;
    }),
  };
});

vi.mock("./use-press-ripple", () => {
  return {
    usePressRipple: mocks.usePressRipple,
  };
});

vi.mock("./use-share-button", () => {
  return {
    useShareButton: mocks.useShareButton,
  };
});

vi.mock("./SvgPlayground/SvgPlayground", () => {
  const RootComponent = (
    props: Record<string, unknown> & { children: ReactNode },
  ) => {
    mocks.rootSpy(props);

    return <div data-slot="root">{props.children}</div>;
  };
  const HeaderComponent = () => {
    mocks.headerSpy();

    return <div data-slot="header" />;
  };
  const PresetBarComponent = () => {
    mocks.presetBarSpy();

    return <div data-slot="preset-bar" />;
  };
  const ControlsComponent = () => {
    mocks.controlsSpy();

    return <div data-slot="controls" />;
  };
  const PanelsComponent = () => {
    mocks.panelsSpy();

    return <div data-slot="panels" />;
  };

  return {
    SvgPlayground: {
      Controls: ControlsComponent,
      Header: HeaderComponent,
      Panels: PanelsComponent,
      PresetBar: PresetBarComponent,
      Root: RootComponent,
    },
  };
});

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const createViewModel = (): SvgPlaygroundViewModel => {
  return {
    activePresetId: "single-weight",
    canShareUrl: true,
    copyShareUrl: vi.fn<() => void>(),
    previewHtml: { __html: '<svg data-preview="yes" />' },
    queryState: hoistStrokeWidthPlayground.defaultState,
    reactSourceState: {
      error: "",
      source: "export const Icon = () => <svg />;",
    },
    selectPreset: vi.fn<(presetId: string) => void>(),
    setColor: vi.fn<(color: string) => void>(),
    setSize: vi.fn<(size: number) => void>(),
    setStrokeWidth: vi.fn<(strokeWidth: number) => void>(),
    setSvg: vi.fn<(svg: string) => void>(),
    shareAnnouncement: "",
    shareButtonLabel: "Copy share URL",
    shareButtonState: "idle",
    stepStrokeWidth: vi.fn<(delta: number) => void>(),
    transformState: { kind: "idle" },
    visiblePresets: hoistStrokeWidthPlayground.presets,
  };
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  mocks.controlsSpy.mockClear();
  mocks.headerSpy.mockClear();
  mocks.panelsSpy.mockClear();
  mocks.presetBarSpy.mockClear();
  mocks.rootSpy.mockClear();
  mocks.usePressRipple.mockClear();
  mocks.useShareButton.mockClear();
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

describe("SvgPlaygroundPresenter", () => {
  it("assembles the SvgPlayground compound API with derived metadata", async () => {
    const viewModel = createViewModel();

    await act(async () => {
      root.render(
        <SvgPlaygroundPresenter
          definition={hoistStrokeWidthPlayground}
          viewModel={viewModel}
        />,
      );
      await flush();
    });

    expect(mocks.usePressRipple).toHaveBeenCalledTimes(1);
    expect(mocks.useShareButton).toHaveBeenCalledWith({
      shareAnnouncement: "",
      shareButtonLabel: "Copy share URL",
      shareButtonState: "idle",
    });
    expect(mocks.rootSpy).toHaveBeenCalledTimes(1);
    expect(mocks.rootSpy.mock.calls[0]?.[0]).toMatchObject({
      activePresetId: "single-weight",
      color: hoistStrokeWidthPlayground.defaultState.color,
      packageName: "@wiyco/svgo-plugin-hoist-stroke-width",
      rippleHandlers: mocks.rippleHandlers,
      shareButton: mocks.shareButton,
      slug: hoistStrokeWidthPlayground.slug,
      slugTransitionName: "playground-slug-svgo-plugin-hoist-stroke-width",
      title: hoistStrokeWidthPlayground.title,
      titleTransitionName: "playground-title-svgo-plugin-hoist-stroke-width",
      visiblePresets: hoistStrokeWidthPlayground.presets,
    });
    expect(container.querySelector('[data-slot="header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="preset-bar"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="controls"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="panels"]')).not.toBeNull();
    expect(mocks.headerSpy).toHaveBeenCalledTimes(1);
    expect(mocks.presetBarSpy).toHaveBeenCalledTimes(1);
    expect(mocks.controlsSpy).toHaveBeenCalledTimes(1);
    expect(mocks.panelsSpy).toHaveBeenCalledTimes(1);
  });
});
