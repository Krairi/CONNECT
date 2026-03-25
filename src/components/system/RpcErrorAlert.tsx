import { getUserFacingErrorMessage } from "@/src/lib/errorMessages";
export default function RpcErrorAlert({ error }: { error: unknown }) { const message = getUserFacingErrorMessage(error); return <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-red-100">{message}</div>; }
