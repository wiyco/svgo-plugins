import { EditorView } from "@codemirror/view";
import { type ReactElement, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CodeSurface, resetCodeSurfaceEditorCacheForTest } from "./CodeSurface";
import { CodeMirrorCodeSurface } from "./CodeSurface.editor";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const mountedRoots = new Set<Root>();

const renderElement = async (element: ReactElement) => {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);
  mountedRoots.add(root);

  const rerender = async (nextElement: ReactElement): Promise<void> => {
    await act(async () => {
      root.render(nextElement);
      await flush();
    });
  };

  const unmount = async (): Promise<void> => {
    if (!mountedRoots.delete(root)) {
      return;
    }

    await act(async () => {
      root.unmount();
      await flush();
    });
  };

  await rerender(element);

  return {
    container,
    rerender,
    unmount,
  };
};

const findEditorView = (container: HTMLElement): EditorView => {
  const editorElement = container.querySelector<HTMLElement>(".cm-editor");

  if (editorElement === null) {
    throw new Error("Expected CodeMirror editor to render.");
  }

  const view = EditorView.findFromDOM(editorElement);

  if (view === null) {
    throw new Error("Expected CodeMirror view to be attached to editor DOM.");
  }

  return view;
};

const setIdleCallbacks = (callbacks: {
  requestIdleCallback?: typeof window.requestIdleCallback;
  cancelIdleCallback?: typeof window.cancelIdleCallback;
}): void => {
  Object.defineProperty(window, "requestIdleCallback", {
    configurable: true,
    value: callbacks.requestIdleCallback,
    writable: true,
  });
  Object.defineProperty(window, "cancelIdleCallback", {
    configurable: true,
    value: callbacks.cancelIdleCallback,
    writable: true,
  });
};

beforeEach(() => {
  document.body.innerHTML = "";
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  resetCodeSurfaceEditorCacheForTest();
});

afterEach(async () => {
  for (const root of [...mountedRoots].reverse()) {
    await act(async () => {
      root.unmount();
      await flush();
    });
  }

  mountedRoots.clear();
  document.body.innerHTML = "";
  resetCodeSurfaceEditorCacheForTest();
  vi.restoreAllMocks();
  setIdleCallbacks({});
});

describe("CodeSurface", () => {
  it("renders editable and read-only native fallbacks before the editor chunk loads", async () => {
    await renderElement(
      <CodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
      />,
    );
    await renderElement(
      <CodeSurface
        ariaLabel="Optimized SVG"
        language="svg"
        readOnly
        value="<svg><path /></svg>"
      />,
    );

    expect(
      document.querySelector<HTMLTextAreaElement>("textarea.svg-textarea")
        ?.value,
    ).toBe("<svg />");
    expect(document.querySelector("pre.code-panel")?.textContent).toBe(
      "<svg><path /></svg>",
    );
  });

  it("loads the editor chunk from fallback focus and reuses the cached editor", async () => {
    setIdleCallbacks({});

    const firstRender = await renderElement(
      <CodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
      />,
    );
    const firstTextarea =
      firstRender.container.querySelector<HTMLTextAreaElement>("textarea");

    if (firstTextarea === null) {
      throw new Error("Expected editable fallback textarea to render.");
    }

    await act(async () => {
      firstTextarea.focus();
      await flush();
    });

    expect(
      firstRender.container.querySelector('[data-code-surface="codemirror"]'),
    ).not.toBeNull();

    const secondRender = await renderElement(
      <CodeSurface
        ariaLabel="Second Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
      />,
    );
    const secondTextarea =
      secondRender.container.querySelector<HTMLTextAreaElement>("textarea");

    if (secondTextarea === null) {
      throw new Error("Expected second editable fallback textarea to render.");
    }

    await act(async () => {
      secondTextarea.focus();
      await flush();
    });

    expect(
      secondRender.container.querySelector('[data-code-surface="codemirror"]'),
    ).not.toBeNull();
  });

  it("schedules idle loading and cancels it on unmount", async () => {
    const cancelIdleCallback =
      vi.fn<NonNullable<typeof window.cancelIdleCallback>>();
    const requestIdleCallback = vi.fn<
      NonNullable<typeof window.requestIdleCallback>
    >(() => {
      return 42;
    });
    setIdleCallbacks({
      cancelIdleCallback,
      requestIdleCallback,
    });

    const rendered = await renderElement(
      <CodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
      />,
    );

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 500,
    });

    await rendered.unmount();

    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });
});

describe("CodeMirrorCodeSurface", () => {
  it("reports editable JSX transactions", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const initialSource = "const SvgComponent = (props) => (<svg />);";
    const rendered = await renderElement(
      <CodeMirrorCodeSurface
        ariaLabel="React source"
        language="jsx"
        readOnly={false}
        value={initialSource}
        onChange={onChange}
      />,
    );
    const view = findEditorView(rendered.container);

    await act(async () => {
      view.dispatch({
        changes: {
          from: view.state.doc.length,
          insert: "\n",
        },
      });
      await flush();
    });

    expect(onChange).toHaveBeenLastCalledWith(`${initialSource}\n`);
  });

  it("does not report read-only or externally synced document changes", async () => {
    const onReadOnlyChange = vi.fn<(value: string) => void>();
    const readOnlyRender = await renderElement(
      <CodeMirrorCodeSurface
        ariaLabel="Optimized SVG"
        language="svg"
        readOnly
        value="<svg />"
        onChange={onReadOnlyChange}
      />,
    );
    const readOnlyView = findEditorView(readOnlyRender.container);

    await act(async () => {
      readOnlyView.dispatch({
        changes: {
          from: readOnlyView.state.doc.length,
          insert: "\n",
        },
      });
      await flush();
    });

    expect(onReadOnlyChange).not.toHaveBeenCalled();

    const onEditableChange = vi.fn<(value: string) => void>();
    const editableRender = await renderElement(
      <CodeMirrorCodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
        onChange={onEditableChange}
      />,
    );

    await editableRender.rerender(
      <CodeMirrorCodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg><path /></svg>"
        onChange={onEditableChange}
      />,
    );

    expect(findEditorView(editableRender.container).state.doc.toString()).toBe(
      "<svg><path /></svg>",
    );
    expect(onEditableChange).not.toHaveBeenCalled();
  });

  it("ignores editor transactions that do not change the document", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const rendered = await renderElement(
      <CodeMirrorCodeSurface
        ariaLabel="Input SVG"
        language="svg"
        readOnly={false}
        value="<svg />"
        onChange={onChange}
      />,
    );
    const view = findEditorView(rendered.container);

    await act(async () => {
      view.dispatch({
        selection: {
          anchor: 0,
        },
      });
      await flush();
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
