import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";
import { createDomyliError, toDomyliError } from "@/src/lib/errors";

export async function getValidSession(): Promise<Session> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    const normalized = toDomyliError(error);

    throw createDomyliError({
      message:
        "Impossible de vérifier la session DOMYLI avant l’appel RPC.",
      code: "DOMYLI_RPC_UNAUTHENTICATED",
      details: normalized.message,
      hint: "Reconnecte-toi puis relance l’action.",
      source: "auth",
      recoverable: true,
    });
  }

  if (!data.session) {
    throw createDomyliError({
      message: "Aucune session active. L’appel RPC DOMYLI est bloqué.",
      code: "DOMYLI_RPC_UNAUTHENTICATED",
      hint: "Connecte-toi avant de lancer une action métier.",
      source: "auth",
      recoverable: true,
    });
  }

  return data.session;
}