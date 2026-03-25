import {
  createDomyliError,
  isMissingRpcError,
  isRpcTimeoutError,
  isRpcUnauthenticatedError,
  toDomyliError,
  type DomyliAppError,
} from "@/src/lib/errors";
import { getValidSession } from "@/src/lib/sessionGuard";

export type RpcPayload = Record<string, unknown>;

type RpcGuardOptions = {
  requireAuth?: boolean;
  timeoutMs?: number;
};

export type PreparedRpcCall = {
  name: string;
  payload: RpcPayload;
  timeoutMs: number;
};

const DEFAULT_RPC_TIMEOUT_MS = 10_000;

export async function prepareRpcCall(
  name: string,
  payload?: RpcPayload,
  options?: RpcGuardOptions
): Promise<PreparedRpcCall> {
  if (!name || typeof name !== "string") {
    throw createDomyliError({
      message: "Nom RPC invalide.",
      code: "DOMYLI_RPC_INVALID_NAME",
      source: "rpc",
    });
  }

  if (options?.requireAuth !== false) {
    await getValidSession();
  }

  if (payload !== undefined && (typeof payload !== "object" || payload === null || Array.isArray(payload))) {
    throw createDomyliError({
      message: `Payload invalide pour app.${name}.`,
      code: "DOMYLI_RPC_INVALID_PAYLOAD",
      source: "rpc",
    });
  }

  return {
    name,
    payload: payload ?? {},
    timeoutMs: options?.timeoutMs ?? DEFAULT_RPC_TIMEOUT_MS,
  };
}

export async function withRpcTimeout<T>(
  promise: Promise<T>,
  name: string,
  timeoutMs: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        createDomyliError({
          message: `Le délai d’attente de app.${name} a été dépassé.`,
          code: "DOMYLI_RPC_TIMEOUT",
          hint: "Vérifie la disponibilité Supabase et la performance du RPC.",
          source: "rpc",
          recoverable: true,
        })
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function normalizeRpcError(
  name: string,
  error: unknown
): DomyliAppError {
  const normalized = toDomyliError(error);

  if (isMissingRpcError(normalized)) {
    return createDomyliError({
      message: `La RPC app.${name} est introuvable, non exposée ou absente du cache PostgREST.`,
      code: "DOMYLI_RPC_MISSING",
      details: normalized.message,
      hint: "Vérifie le schéma exposé, le NOTIFY pgrst, puis l’existence exacte de la fonction.",
      source: "rpc",
      recoverable: false,
    });
  }

  if (isRpcUnauthenticatedError(normalized)) {
    return createDomyliError({
      message: `La session DOMYLI n’est plus valide pour exécuter app.${name}.`,
      code: "DOMYLI_RPC_UNAUTHENTICATED",
      details: normalized.message,
      hint: "Reconnecte-toi puis relance l’action.",
      source: "auth",
      recoverable: true,
    });
  }

  if (isRpcTimeoutError(normalized)) {
    return normalized;
  }

  return createDomyliError({
    message: normalized.message || `Erreur RPC sur app.${name}.`,
    code: normalized.code ?? "DOMYLI_RPC_FAILED",
    details: normalized.details ?? null,
    hint: normalized.hint ?? `Vérifie la logique backend de app.${name}.`,
    source: normalized.source ?? "rpc",
    recoverable: normalized.recoverable ?? false,
  });
}