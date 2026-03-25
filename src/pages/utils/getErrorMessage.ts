export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string") return value;
  }

  if (error instanceof Error) return error.message;

  return "Une erreur est survenue.";
}