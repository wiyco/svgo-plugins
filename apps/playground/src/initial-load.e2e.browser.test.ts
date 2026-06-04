import { afterEach, describe, expect, it } from "vitest";

const PLAYGROUND_SLUG = "svgo-plugin-hoist-stroke-width";

const createFrame = (): HTMLIFrameElement => {
  const frame = document.createElement("iframe");
  frame.src = "/index.html";
  frame.style.width = "960px";
  frame.style.height = "720px";
  document.body.append(frame);

  return frame;
};

const waitForFrameDocument = async (
  frame: HTMLIFrameElement,
): Promise<Document> => {
  await expect
    .poll(() => {
      const frameDocument = frame.contentDocument;

      if (frameDocument === null) {
        return null;
      }

      return {
        href: frame.contentWindow?.location.href,
        readyState: frameDocument.readyState,
      };
    })
    .toMatchObject({
      readyState: "complete",
    });

  const frameDocument = frame.contentDocument;

  if (frameDocument === null) {
    throw new Error("Expected iframe document to be available");
  }

  return frameDocument;
};

const waitForElement = async <TElement extends Element>(
  frame: HTMLIFrameElement,
  selector: string,
): Promise<TElement> => {
  await expect
    .poll(() => frame.contentDocument?.querySelector(selector))
    .not.toBeNull();

  const element = frame.contentDocument?.querySelector<TElement>(selector);

  if (element === null || element === undefined) {
    throw new Error(`Expected iframe element for selector: ${selector}`);
  }

  return element;
};

const waitForPath = async (
  frame: HTMLIFrameElement,
  pathname: string,
): Promise<void> => {
  await expect
    .poll(() => frame.contentWindow?.location.pathname)
    .toBe(pathname);
};

const waitForText = async (
  frame: HTMLIFrameElement,
  text: string,
): Promise<void> => {
  await expect
    .poll(() => frame.contentDocument?.body.textContent ?? "")
    .toContain(text);
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("playground initial load browser flow", () => {
  it("navigates from landing to the playground and keeps the fast intro shell visible", async () => {
    const frame = createFrame();
    await waitForFrameDocument(frame);

    await waitForText(frame, "SVGO Plugin Playground");

    const playgroundLink = await waitForElement<HTMLAnchorElement>(
      frame,
      `a[href="./${PLAYGROUND_SLUG}/"]`,
    );

    playgroundLink.click();

    await waitForPath(frame, `/${PLAYGROUND_SLUG}/`);
    await waitForFrameDocument(frame);

    const title = await waitForElement<HTMLElement>(frame, ".intro-title");
    const slug = await waitForElement<HTMLAnchorElement>(frame, ".slug-chip");
    const packageChip = await waitForElement<HTMLElement>(
      frame,
      ".package-chip",
    );

    expect(title.textContent).toContain("Hoist Stroke Width");
    expect(slug.textContent).toContain(`/${PLAYGROUND_SLUG}`);
    expect(slug.getAttribute("href")).toBe("../");
    expect(packageChip.textContent).toContain(
      "@wiyco/svgo-plugin-hoist-stroke-width",
    );

    slug.click();

    await waitForPath(frame, "/");
    await waitForFrameDocument(frame);
    await waitForText(frame, "SVGO Plugin Playground");
  });
});
