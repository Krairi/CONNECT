export type DomyliAppError = {
  code: string;
  message: string;
  hint?: string | null;
  details?: string | null;
};

export const toDomyliError = (error: unknown): DomyliAppError => {
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    return {
      code: typeof e.code === "string" ? e.code : "UNKNOWN_ERROR",
      message: typeof e.message === "string" ? e.message : "Une erreur est survenue.",
      hint: typeof e.hint === "string" ? e.hint : null,
      details: typeof e.details === "string" ? e.details : null,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : "Une erreur est survenue.",
    hint: null,
    details: null,
  };
};
