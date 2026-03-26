import { supabase } from "@/src/lib/supabase";
import { createDomyliError, toDomyliError } from "@/src/lib/errors";
import { reportMonitoringEvent } from "@/src/lib/monitoring";

type RpcPayload = Record<string, unknown>;

function unwrapSingle<T>(input: T | T[] | null | undefined): T | null {
  if (Array.isArray(input)) {
    return input[0] ?? null;
  }

  return input ?? null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  rpcName: string,
): Promise<T> {
  let timeoutId: number | undefined;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(
            createDomyliError({
              message: `Délai dépassé pour app.${rpcName}.`,
              code: "DOMYLI_RPC_TIMEOUT",
              hint: "Vérifie la disponibilité Supabase et la RPC.",
            }),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function callRpc<TOutput>(
  name: string,
  payload: RpcPayload = {},
  options?: {
    requireAuth?: boolean;
    timeoutMs?: number;
    unwrap?: boolean;
    retries?: number;
    retryDelayMs?: number;
  },
): Promise<TOutput> {
  const requireAuth = options?.requireAuth ?? true;
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const unwrap = options?.unwrap ?? false;
  const retries = options?.retries ?? 0;
  const retryDelayMs = options?.retryDelayMs ?? 900;

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

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await runWithTimeout(
        supabase.schema("app").rpc(name, payload),
        timeoutMs,
        name,
      );

      const { data, error } = result as {
        data: unknown;
        error: unknown;
      };

      if (error) {
        throw error;
      }

      return (unwrap
        ? unwrapSingle(data as TOutput | TOutput[] | null)
        : data) as TOutput;
    } catch (error) {
      const normalized = toDomyliError(error);

      reportMonitoringEvent({
        level: "error",
        event: "rpc_call_failed",
        message: `RPC app.${name} en erreur`,
        meta: {
          rpc: name,
          payload,
          attempt: attempt + 1,
          retries,
          code: normalized.code ?? null,
          message: normalized.message,
        },
      });

      lastError = normalized;

      const canRetry =
        normalized.code === "DOMYLI_RPC_TIMEOUT" && attempt < retries;

      if (canRetry) {
        await delay(retryDelayMs);
        continue;
      }

      throw normalized;
    }
  }

  throw toDomyliError(lastError);
}