export type DomyliAppError = Error & {
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function toDomyliError(error: unknown): DomyliAppError {
  if (error instanceof Error) {
    return error as DomyliAppError;
  }

  const fallback = new Error("Une erreur DOMYLI est survenue.") as DomyliAppError;

  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    fallback.message =
      typeof maybe.message === "string"
        ? maybe.message
        : "Une erreur DOMYLI est survenue.";

    if (typeof maybe.code === "string") fallback.code = maybe.code;
    if (typeof maybe.details === "string" || maybe.details === null) fallback.details = maybe.details;
    if (typeof maybe.hint === "string" || maybe.hint === null) fallback.hint = maybe.hint;
  }

  return fallback;
}

export function isMissingRpcError(error: unknown): boolean {
  const err = toDomyliError(error);
  return err.code === "PGRST202";
}