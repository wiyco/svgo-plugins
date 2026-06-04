export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
