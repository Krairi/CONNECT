export type PageState = "loading" | "error" | "empty" | "ready";
export function getPageState(params: { loading: boolean; error: unknown; isEmpty: boolean }): PageState { if (params.loading) return "loading"; if (params.error) return "error"; if (params.isEmpty) return "empty"; return "ready"; }
