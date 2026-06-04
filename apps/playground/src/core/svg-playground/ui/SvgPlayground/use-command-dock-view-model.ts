import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type UseCommandDockViewModelOptions = {
  color: string;
  size: number;
  strokeWidth: number;
};

export type CommandDockViewModel = {
  colorLabel: string;
  colorSwatchStyle: CSSProperties;
  controlsId: string;
  isExpanded: boolean;
  onSummaryClick: () => void;
  sizeLabel: string;
  strokeWidthLabel: string;
  summaryAriaLabel: string;
  summaryButtonRef: RefObject<HTMLButtonElement | null>;
};

const formatNumberLabel = (value: number): string => {
  return value.toFixed(2).replace(/\.?0+$/, "");
};

export const useCommandDockViewModel = (
  options: UseCommandDockViewModelOptions,
): CommandDockViewModel => {
  const { color, size, strokeWidth } = options;

  const [isExpanded, setIsExpanded] = useState(false);
  const summaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const controlsId = useId();
  const colorSwatchStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundColor: color,
    };
  }, [color]);
  const onSummaryClick = useCallback((): void => {
    setIsExpanded((currentIsExpanded) => {
      return !currentIsExpanded;
    });
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsExpanded(false);
        summaryButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isExpanded]);

  return useMemo(() => {
    return {
      colorLabel: color.toUpperCase(),
      colorSwatchStyle,
      controlsId,
      isExpanded,
      onSummaryClick,
      sizeLabel: `${Math.round(size)}px`,
      strokeWidthLabel: `Stroke ${formatNumberLabel(strokeWidth)}`,
      summaryAriaLabel: isExpanded
        ? "Collapse playground controls"
        : "Expand playground controls",
      summaryButtonRef,
    };
  }, [
    color,
    colorSwatchStyle,
    controlsId,
    isExpanded,
    onSummaryClick,
    size,
    strokeWidth,
  ]);
};
