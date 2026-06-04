import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlaygroundLinkWarmup } from "./use-playground-link-warmup";

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
  const warmPlaygroundRoute = vi.fn<(slug: string) => Promise<void>>();

  return {
    handleWarmup,
    linkRef,
    useLinkWarmup,
    warmPlaygroundRoute,
  };
});

vi.mock("../core/link-warmup", () => {
  return {
    useLinkWarmup: mocks.useLinkWarmup,
  };
});

vi.mock("../playgrounds/preload-registry", () => {
  return {
    warmPlaygroundRoute: mocks.warmPlaygroundRoute,
  };
});

type HarnessState = ReturnType<typeof usePlaygroundLinkWarmup>;

const Harness = (props: { slug: string }) => {
  latestHarnessState = usePlaygroundLinkWarmup(props.slug);

  return (
    <a ref={latestHarnessState.linkRef} href={`./${props.slug}/`}>
      Open {props.slug}
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
  mocks.warmPlaygroundRoute.mockReset();
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

describe("use-playground-link-warmup", () => {
  it("adapts the playground slug to the shared link warmup hook", async () => {
    await act(async () => {
      root.render(<Harness slug="svgo-plugin-hoist-stroke-width" />);
      await flush();
    });

    expect(mocks.useLinkWarmup).toHaveBeenCalledTimes(1);
    expect(mocks.useLinkWarmup.mock.calls[0]?.[1]).toEqual({
      warmupKey: "svgo-plugin-hoist-stroke-width",
    });
    expect(latestHarnessState).toEqual({
      handleWarmup: mocks.handleWarmup,
      linkRef: mocks.linkRef,
    });
  });

  it("warms the matching playground route", async () => {
    await act(async () => {
      root.render(<Harness slug="svgo-plugin-hoist-stroke-width" />);
      await flush();
    });

    const warmup = mocks.useLinkWarmup.mock.calls[0]?.[0];

    if (warmup === undefined) {
      throw new Error("Expected link warmup callback");
    }

    warmup();

    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledTimes(1);
    expect(mocks.warmPlaygroundRoute).toHaveBeenCalledWith(
      "svgo-plugin-hoist-stroke-width",
    );
  });
});
