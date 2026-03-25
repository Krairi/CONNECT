import { describe, expect, it } from "vitest";
import { isMissingRpcError, toDomyliError } from "@/src/lib/errors";
describe("errors", () => { it("normalise une erreur inconnue", () => { const err = toDomyliError({ message: "boom", code: "X1" }); expect(err.message).toBe("boom"); expect(err.code).toBe("X1"); }); it("détecte une RPC manquante", () => { expect(isMissingRpcError({ message: "missing", code: "PGRST202" })).toBe(true); }); });
