import { supabase } from "../lib/supabase";
import { toDomyliError } from "../lib/errors";

export async function callRpc<TInput extends Record<string, unknown>, TOutput>(
  name: string,
  payload: TInput
): Promise<TOutput> {
  const { data, error } = await supabase.schema("app").rpc(name, payload);

  if (error) {
    throw toDomyliError(error);
  }

  return data as TOutput;
}
