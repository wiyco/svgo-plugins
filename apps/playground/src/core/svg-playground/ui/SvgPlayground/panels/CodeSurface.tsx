import {
  type ChangeEvent,
  type ComponentType,
  type FocusEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

export type CodeSurfaceLanguage = "svg" | "jsx";

export type CodeSurfaceProps = {
  ariaLabel: string;
  language: CodeSurfaceLanguage;
  readOnly: boolean;
  value: string;
  onChange?: (value: string) => void;
};

type CodeSurfaceEditorModule = {
  CodeMirrorCodeSurface: ComponentType<CodeSurfaceProps>;
};

type ScheduledCodeSurfaceLoad =
  | { kind: "idle"; id: number }
  | { kind: "timeout"; id: ReturnType<typeof window.setTimeout> };

let codeSurfaceEditor: ComponentType<CodeSurfaceProps> | null = null;
let codeSurfaceEditorPromise: Promise<CodeSurfaceEditorModule> | null = null;

export const resetCodeSurfaceEditorCacheForTest = (): void => {
  codeSurfaceEditor = null;
  codeSurfaceEditorPromise = null;
};

const loadCodeSurfaceEditor = (): Promise<CodeSurfaceEditorModule> => {
  codeSurfaceEditorPromise ??= import("./CodeSurface.editor");

  return codeSurfaceEditorPromise;
};

const scheduleCodeSurfaceLoad = (
  callback: () => void,
): ScheduledCodeSurfaceLoad => {
  if (typeof window.requestIdleCallback === "function") {
    return {
      kind: "idle",
      id: window.requestIdleCallback(callback, {
        timeout: 500,
      }),
    };
  }

  return {
    kind: "timeout",
    id: window.setTimeout(callback, 250),
  };
};

const cancelCodeSurfaceLoad = (
  scheduledLoad: ScheduledCodeSurfaceLoad,
): void => {
  if (scheduledLoad.kind === "idle") {
    window.cancelIdleCallback?.(scheduledLoad.id);
    return;
  }

  window.clearTimeout(scheduledLoad.id);
};

export const CodeSurface = memo(function CodeSurface(props: CodeSurfaceProps) {
  const { ariaLabel, onChange, readOnly, value } = props;
  const [Editor, setEditor] = useState<ComponentType<CodeSurfaceProps> | null>(
    null,
  );

  const loadEditor = useCallback((): void => {
    if (codeSurfaceEditor !== null) {
      setEditor(() => codeSurfaceEditor);
      return;
    }

    void loadCodeSurfaceEditor().then((module) => {
      codeSurfaceEditor = module.CodeMirrorCodeSurface;
      setEditor(() => module.CodeMirrorCodeSurface);
    });
  }, []);

  useEffect(() => {
    if (Editor !== null) {
      return undefined;
    }

    let isMounted = true;
    const scheduledLoad = scheduleCodeSurfaceLoad(() => {
      void loadCodeSurfaceEditor().then((module) => {
        codeSurfaceEditor = module.CodeMirrorCodeSurface;

        if (isMounted) {
          setEditor(() => module.CodeMirrorCodeSurface);
        }
      });
    });

    return () => {
      isMounted = false;
      cancelCodeSurfaceLoad(scheduledLoad);
    };
  }, [Editor]);

  const handleFallbackChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      onChange?.(event.currentTarget.value);
    },
    [onChange],
  );

  const handleFallbackFocus = useCallback(
    (_event: FocusEvent<HTMLTextAreaElement>): void => {
      loadEditor();
    },
    [loadEditor],
  );

  if (Editor !== null) {
    return <Editor {...props} />;
  }

  if (readOnly) {
    return (
      <pre aria-label={ariaLabel} className="code-panel">
        {value}
      </pre>
    );
  }

  return (
    <textarea
      aria-label={ariaLabel}
      className="svg-textarea"
      spellCheck={false}
      value={value}
      onChange={handleFallbackChange}
      onFocus={handleFallbackFocus}
    />
  );
});
