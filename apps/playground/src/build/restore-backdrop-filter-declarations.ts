const WEBKIT_BACKDROP_FILTER_DECLARATION_PATTERN =
  /(^|[;{])(-webkit-backdrop-filter:([^;{}]+))(?=[;}])/g;

export const restoreBackdropFilterDeclarations = (css: string): string => {
  return css.replace(
    WEBKIT_BACKDROP_FILTER_DECLARATION_PATTERN,
    (match, prefix: string, declaration: string, value: string, offset) => {
      const declarationOffset = offset + prefix.length;
      const blockStart = Math.max(
        css.lastIndexOf("{", declarationOffset - 1),
        css.lastIndexOf("}", declarationOffset - 1),
      );
      const declarationsBeforeMatch = css.slice(
        blockStart + 1,
        declarationOffset,
      );

      if (declarationsBeforeMatch.includes("backdrop-filter:")) {
        return match;
      }

      return `${prefix}backdrop-filter:${value};${declaration}`;
    },
  );
};
