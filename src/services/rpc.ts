import { supabase } from "@/src/lib/supabase";
import { createDomyliError, toDomyliError } from "@/src/lib/errors";

type RpcPayload = Record<string, unknown>;

function unwrapSingle<T>(input: T | T[] | null | undefined): T | null {
  if (Array.isArray(input)) return input[0] ?? null;
  return input ?? null;
}

export async function callRpc<TOutput>(
  name: string,
  payload: RpcPayload = {},
  options?: { requireAuth?: boolean; timeoutMs?: number; unwrap?: boolean }
): Promise<TOutput> {
  const requireAuth = options?.requireAuth ?? true;
  const timeoutMs = options?.timeoutMs ?? 10000;
  const unwrap = options?.unwrap ?? false;

  if (requireAuth) {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      throw createDomyliError({
        message: "Aucune session valide pour exécuter la RPC DOMYLI.",
        code: "DOMYLI_RPC_UNAUTHENTICATED",
        hint: "Connecte-toi puis relance l’action.",
      });
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        createDomyliError({
          message: `Délai dépassé pour app.${name}.`,
          code: "DOMYLI_RPC_TIMEOUT",
          hint: "Vérifie la disponibilité Supabase et la RPC.",
        })
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      supabase.schema("app").rpc(name, payload),
      timeoutPromise,
    ]);

    const { data, error } = result as { data: unknown; error: unknown };

    if (error) {
      throw error;
    }

    return (unwrap ? unwrapSingle(data as TOutput | TOutput[] | null) : data) as TOutput;
  } catch (error) {
    throw toDomyliError(error);
  }
}