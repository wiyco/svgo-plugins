const sanitizeViewTransitionToken = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const getPlaygroundViewTransitionNames = (slug: string) => {
  const token = sanitizeViewTransitionToken(slug) || "playground";

  return {
    slug: `playground-slug-${token}`,
    title: `playground-title-${token}`,
  };
};
