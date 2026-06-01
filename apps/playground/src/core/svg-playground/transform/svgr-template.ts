type TemplateVariables = {
  componentName: unknown;
  jsx: unknown;
  props: unknown;
};

type TemplateContext = {
  tpl: (strings: TemplateStringsArray, ...values: unknown[]) => string;
};

export const createBareComponentTemplate = (
  variables: TemplateVariables,
  { tpl }: TemplateContext,
): string => {
  return tpl`
const ${variables.componentName} = (${variables.props}) => ${variables.jsx};
`;
};
