import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { xml } from "@codemirror/lang-xml";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, type ViewUpdate, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { memo, useEffect, useMemo, useRef } from "react";

import type { CodeSurfaceLanguage, CodeSurfaceProps } from "./CodeSurface";

const codeSurfaceTheme = EditorView.theme({
  "&": {
    minHeight: "inherit",
    height: "100%",
    color: "var(--color-ink)",
    background: "transparent",
    fontFamily: "var(--font-mono)",
    fontSize: "inherit",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    minHeight: "inherit",
    padding: "var(--space-4)",
    caretColor: "var(--color-primary-strong)",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--color-primary-strong)",
  },
  ".cm-line": {
    padding: "0",
  },
  ".cm-scroller": {
    minHeight: "inherit",
    overflow: "auto",
    fontFamily: "inherit",
    lineHeight: "inherit",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--color-focus-ring)",
  },
});

const codeHighlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.operatorKeyword,
      tags.modifier,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
    ],
    color: "var(--component-editor-syntax-keyword)",
    fontWeight: "600",
  },
  {
    tag: [
      tags.tagName,
      tags.className,
      tags.typeName,
      tags.definition(tags.variableName),
      tags.function(tags.variableName),
    ],
    color: "var(--component-editor-syntax-type)",
    fontWeight: "560",
  },
  {
    tag: [
      tags.attributeName,
      tags.propertyName,
      tags.definition(tags.propertyName),
      tags.function(tags.propertyName),
    ],
    color: "var(--component-editor-syntax-property)",
  },
  {
    tag: [
      tags.variableName,
      tags.local(tags.variableName),
      tags.standard(tags.variableName),
    ],
    color: "var(--component-editor-syntax-variable)",
  },
  {
    tag: [tags.string, tags.character, tags.attributeValue],
    color: "var(--component-editor-syntax-string)",
  },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom],
    color: "var(--component-editor-syntax-literal)",
  },
  {
    tag: [
      tags.operator,
      tags.derefOperator,
      tags.arithmeticOperator,
      tags.logicOperator,
      tags.bitwiseOperator,
      tags.compareOperator,
      tags.updateOperator,
      tags.definitionOperator,
      tags.typeOperator,
      tags.controlOperator,
    ],
    color: "var(--component-editor-syntax-operator)",
  },
  {
    tag: [tags.angleBracket, tags.bracket, tags.punctuation, tags.separator],
    color: "var(--component-editor-syntax-punctuation)",
  },
  {
    tag: [
      tags.comment,
      tags.meta,
      tags.documentMeta,
      tags.processingInstruction,
    ],
    color: "var(--component-editor-syntax-comment)",
    fontStyle: "italic",
  },
]);

const createLanguageExtension = (language: CodeSurfaceLanguage) => {
  if (language === "jsx") {
    return javascript({
      jsx: true,
    });
  }

  return xml();
};

export const CodeMirrorCodeSurface = memo(function CodeMirrorCodeSurface(
  props: CodeSurfaceProps,
) {
  const { ariaLabel, language, onChange, readOnly, value } = props;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const syncFromPropsRef = useRef(false);
  const viewRef = useRef<EditorView | null>(null);

  onChangeRef.current = onChange;

  const contentAttributes = useMemo(() => {
    return {
      "aria-label": ariaLabel,
      "aria-multiline": "true",
      "aria-readonly": readOnly ? "true" : "false",
      autocapitalize: "off",
      autocomplete: "off",
      spellcheck: "false",
    };
  }, [ariaLabel, readOnly]);

  useEffect(() => {
    const hostElement = hostRef.current as HTMLDivElement;

    const view = new EditorView({
      parent: hostElement,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          codeSurfaceTheme,
          syntaxHighlighting(codeHighlightStyle),
          createLanguageExtension(language),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of(contentAttributes),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          history(),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged && !readOnly && !syncFromPropsRef.current) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [contentAttributes, language, readOnly]);

  useEffect(() => {
    const view = viewRef.current as EditorView;
    const currentValue = view.state.doc.toString();

    if (currentValue === value) {
      return;
    }

    syncFromPropsRef.current = true;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: value,
      },
    });
    syncFromPropsRef.current = false;
  }, [value]);

  return (
    <div
      ref={hostRef}
      className={
        readOnly
          ? "code-surface code-surface-readonly code-panel"
          : "code-surface code-surface-editable svg-textarea"
      }
      data-code-surface="codemirror"
      data-language={language}
    />
  );
});
