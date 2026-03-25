export function assertAuthenticated(authLoading: boolean, isAuthenticated: boolean) { if (authLoading || !isAuthenticated) throw new Error("DOMYLI_RPC_UNAUTHENTICATED"); }
