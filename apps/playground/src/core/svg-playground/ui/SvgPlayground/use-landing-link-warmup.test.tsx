import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLandingLinkWarmup } from "./use-landing-link-warmup";

const flush = async (): Promise<void> => {
  await Promise.resolve();
};

const mocks = vi.hoisted(() => {
  const handleWarmup = vi.fn<() => void>();
  const linkRef = { current: null as HTMLAnchorElement | null };
  const useLinkWarmup = vi.fn<
    (
      warmup: () => void,
      options: {
        warmupKey: string;
      },
    ) => {
      handleWarmup: typeof handleWarmup;
      linkRef: typeof linkRef;
    }
  >(() => {
    return {
      handleWarmup,
      linkRef,
    };
  });
  const warmLandingRoute = vi.fn<() => Promise<void>>();

  return {
    handleWarmup,
    linkRef,
    useLinkWarmup,
    warmLandingRoute,
  };
});

vi.mock("../../../link-warmup", () => {
  return {
    useLinkWarmup: mocks.useLinkWarmup,
  };
});

vi.mock("../../../../playgrounds/preload-registry", () => {
  return {
    warmLandingRoute: mocks.warmLandingRoute,
  };
});

type HarnessState = ReturnType<typeof useLandingLinkWarmup>;

const Harness = () => {
  latestHarnessState = useLandingLinkWarmup();

  return (
    <a ref={latestHarnessState.linkRef} href="../">
      Back to landing
    </a>
  );
};

let container: HTMLDivElement;
let root: Root;
let latestHarnessState: HarnessState | null = null;

beforeEach(() => {
  mocks.handleWarmup.mockReset();
  mocks.linkRef.current = null;
  mocks.useLinkWarmup.mockClear();
  mocks.warmLandingRoute.mockReset();
  container = document.createElement("div");
  root = createRoot(container);
  document.body.innerHTML = "";
  document.body.append(container);
  latestHarnessState = null;
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

describe("useLandingLinkWarmup", () => {
  it("adapts the landing route to the shared link warmup hook", async () => {
    await act(async () => {
      root.render(<Harness />);
      await flush();
    });

    expect(mocks.useLinkWarmup).toHaveBeenCalledTimes(1);
    expect(mocks.useLinkWarmup.mock.calls[0]?.[1]).toEqual({
      warmupKey: "landing",
    });
    expect(latestHarnessState).toEqual({
      handleWarmup: mocks.handleWarmup,
      linkRef: mocks.linkRef,
    });
  });

  it("warms the landing route", async () => {
    await act(async () => {
      root.render(<Harness />);
      await flush();
    });

    const warmup = mocks.useLinkWarmup.mock.calls[0]?.[0];

    if (warmup === undefined) {
      throw new Error("Expected link warmup callback");
    }

    warmup();

    expect(mocks.warmLandingRoute).toHaveBeenCalledTimes(1);
  });
});
