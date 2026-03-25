export function unwrapRpcRow<T>(
  input: T | T[] | null | undefined
): T | null {
  if (Array.isArray(input)) {
    return input.length > 0 ? input[0] : null;
  }

  return input ?? null;
}